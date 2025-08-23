import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotifyTrackMetadata {
  isrc?: string;
  artist: string;
  duration: number;
  releaseDate: string;
  trackName: string;
  albumName: string;
  label?: string;
  previewUrl?: string;
  popularity?: number;
}

interface ArtistSelectorProps {
  value: string;
  onChange: (value: string) => void;
  spotifyMetadata: SpotifyTrackMetadata | null;
  alternatives: SpotifyTrackMetadata[];
  onArtistSelect?: (metadata: SpotifyTrackMetadata) => void;
  onManualEntry?: (artistName: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export const ArtistSelector: React.FC<ArtistSelectorProps> = ({
  value,
  onChange,
  spotifyMetadata,
  alternatives = [],
  onArtistSelect,
  onManualEntry,
  loading = false,
  placeholder = "Enter artist name"
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Create options from Spotify data
  const options = React.useMemo(() => {
    const allOptions: (SpotifyTrackMetadata & { id: string })[] = [];
    
    if (spotifyMetadata) {
      allOptions.push({
        ...spotifyMetadata,
        id: 'best-match'
      });
    }
    
    alternatives.forEach((alt, index) => {
      allOptions.push({
        ...alt,
        id: `alt-${index}`
      });
    });

    // Remove duplicates based on artist name
    const uniqueOptions = allOptions.filter((option, index, self) => 
      index === self.findIndex(t => t.artist.toLowerCase() === option.artist.toLowerCase())
    );

    return uniqueOptions;
  }, [spotifyMetadata, alternatives]);

  const [useCustomArtist, setUseCustomArtist] = useState(false);

  // Always show dropdown if we have Spotify data or alternatives, or if user wants custom input
  const shouldShowDropdown = options.length > 0 || useCustomArtist;

  const handleSelect = (selectedArtist: string) => {
    onChange(selectedArtist);
    
    // Find the metadata for the selected artist
    const selectedMetadata = options.find(option => option.artist === selectedArtist);
    if (selectedMetadata && onArtistSelect) {
      onArtistSelect(selectedMetadata);
    } else if (!selectedMetadata && onManualEntry) {
      // This is a manually entered artist name
      onManualEntry(selectedArtist);
    }
    
    setOpen(false);
  };

  const handleManualInput = (artistName: string) => {
    onChange(artistName);
    if (onManualEntry) {
      onManualEntry(artistName);
    }
  };

  const filteredOptions = options.filter(option =>
    option.artist.toLowerCase().includes(searchValue.toLowerCase())
  );

  // If no Spotify data and not using custom input, show simple input
  if (!shouldShowDropdown) {
    return (
      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <div className="relative">
          <Input
            id="artist"
            value={value}
            onChange={(e) => handleManualInput(e.target.value)}
            placeholder={placeholder}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  // If we have Spotify data but user hasn't chosen custom input, show option to override
  if (options.length > 0 && !useCustomArtist && !open) {
    return (
      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="artist"
              value={value || (spotifyMetadata?.artist || '')}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder={spotifyMetadata?.artist ? "Auto-filled from Spotify" : placeholder}
              className="pr-24"
            />
            {loading && (
              <Loader2 className="absolute right-16 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUseCustomArtist(true)}
              className="absolute right-1 top-1 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Override
            </Button>
          </div>
          {spotifyMetadata && (
            <div className="text-xs text-muted-foreground">
              Found on Spotify: {spotifyMetadata.trackName} • {spotifyMetadata.albumName}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="artist">Artist</Label>
      <div className="space-y-2">
        {useCustomArtist && options.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setUseCustomArtist(false);
              if (spotifyMetadata) {
                onChange(spotifyMetadata.artist);
                if (onArtistSelect) {
                  onArtistSelect(spotifyMetadata);
                }
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to Spotify options
          </Button>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {value || "Select artist..."}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder={useCustomArtist ? "Enter custom artist name..." : "Search artists..."}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No artists found.</CommandEmpty>
                <CommandGroup>
                  {!useCustomArtist && filteredOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.artist}
                      onSelect={() => handleSelect(option.artist)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === option.artist ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.artist}</span>
                          {option.id === 'best-match' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Best Match
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>Track: {option.trackName}</div>
                          <div>Album: {option.albumName} • {option.releaseDate}</div>
                          {option.popularity && (
                            <div>Popularity: {option.popularity}/100</div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                  {!useCustomArtist && options.length > 0 && (
                    <CommandItem
                      onSelect={() => setUseCustomArtist(true)}
                      className="flex items-center gap-2 border-t pt-2 mt-2"
                    >
                      <div className="h-4 w-4" />
                      <div className="flex-1">
                        <span className="font-medium">Use custom artist name</span>
                        <div className="text-xs text-muted-foreground">
                          Override Spotify selection
                        </div>
                      </div>
                    </CommandItem>
                  )}
                  {/* Allow manual entry when in custom mode or when searching */}
                  {(useCustomArtist || searchValue) && searchValue && (
                    <CommandItem
                      value={searchValue}
                      onSelect={() => handleSelect(searchValue)}
                      className="flex items-center gap-2"
                    >
                      <div className="h-4 w-4" />
                      <div className="flex-1">
                        <span>Use "{searchValue}"</span>
                        <div className="text-xs text-muted-foreground">
                          Custom artist name
                        </div>
                      </div>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};