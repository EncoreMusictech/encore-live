import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  loading?: boolean;
  placeholder?: string;
}

export const ArtistSelector: React.FC<ArtistSelectorProps> = ({
  value,
  onChange,
  spotifyMetadata,
  alternatives = [],
  onArtistSelect,
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

  // Show dropdown if we have multiple options or if manually typed
  const shouldShowDropdown = options.length > 1 || (options.length === 1 && value !== options[0].artist);

  const handleSelect = (selectedArtist: string) => {
    onChange(selectedArtist);
    
    // Find the metadata for the selected artist
    const selectedMetadata = options.find(option => option.artist === selectedArtist);
    if (selectedMetadata && onArtistSelect) {
      onArtistSelect(selectedMetadata);
    }
    
    setOpen(false);
  };

  const filteredOptions = options.filter(option =>
    option.artist.toLowerCase().includes(searchValue.toLowerCase())
  );

  // If we only have one option or no options, show regular input
  if (!shouldShowDropdown) {
    return (
      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <div className="relative">
          <Input
            id="artist"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={spotifyMetadata?.artist ? "Auto-filled from Spotify" : placeholder}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="artist">Artist</Label>
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
              placeholder="Search artists..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No artists found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
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
                {/* Allow manual entry option */}
                {searchValue && !filteredOptions.find(opt => opt.artist.toLowerCase() === searchValue.toLowerCase()) && (
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
  );
};