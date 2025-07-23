import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Music, Calendar, Clock, Users } from "lucide-react";
import { useDebounce, useVirtualScroll } from "@/hooks/usePerformanceOptimization";
import { TrackSelectorSkeleton, AsyncLoading } from "@/components/LoadingStates";

interface Track {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

interface Album {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  popularity?: number;
  external_urls: {
    spotify: string;
  };
  tracks?: {
    items: Track[];
  };
}

interface TrackSelectorProps {
  albums: Album[];
  singles: Album[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[], selectedData: any[]) => void;
  onEstimateStreams: (item: Album | Track, isAlbum?: boolean) => number;
}

const TrackSelector = memo(({ 
  albums, 
  singles, 
  selectedItems, 
  onSelectionChange,
  onEstimateStreams 
}: TrackSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedData, setSelectedData] = useState<any[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const formatDuration = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${(parseInt(seconds) < 10 ? '0' : '')}${seconds}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).getFullYear();
  }, []);

  const handleItemToggle = useCallback((itemId: string, itemData: any, isAlbum: boolean = false) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];

    const newSelectedData = selectedItems.includes(itemId)
      ? selectedData.filter(item => item.id !== itemId)
      : [...selectedData, { ...itemData, isAlbum }];

    setSelectedData(newSelectedData);
    onSelectionChange(newSelectedItems, newSelectedData);
  }, [selectedItems, selectedData, onSelectionChange]);

  const filteredAlbums = useMemo(() => 
    albums.filter(album =>
      album.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [albums, debouncedSearchTerm]
  );

  const filteredSingles = useMemo(() => 
    singles.filter(single =>
      single.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [singles, debouncedSearchTerm]
  );

  const getEstimatedEarnings = useCallback((item: Album | Track, isAlbum?: boolean) => {
    const streams = onEstimateStreams(item, isAlbum);
    return streams * 0.003; // $0.003 per stream
  }, [onEstimateStreams]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Search tracks and albums</Label>
          <Input
            id="search"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Selected: {selectedItems.length} items
        </div>
      </div>

      <Tabs defaultValue="albums" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="albums">Albums ({albums.length})</TabsTrigger>
          <TabsTrigger value="singles">Singles & EPs ({singles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-4">
          <div className="grid gap-4">
            {filteredAlbums.map((album) => (
              <Card key={album.id} className={`cursor-pointer transition-all ${
                selectedItems.includes(album.id) ? 'ring-2 ring-music-purple' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedItems.includes(album.id)}
                      onCheckedChange={() => handleItemToggle(album.id, album, true)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{album.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(album.release_date)}
                          </Badge>
                          <Badge variant="outline">
                            <Music className="w-3 h-3 mr-1" />
                            {album.total_tracks} tracks
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Popularity: {album.popularity || 'N/A'}/100</span>
                          <span>Est. Streams: {onEstimateStreams(album, true).toLocaleString()}</span>
                        </div>
                        <span className="font-medium text-music-purple">
                          Est. Annual Revenue: ${getEstimatedEarnings(album, true).toLocaleString()}
                        </span>
                      </div>

                      {album.tracks && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Tracks:</p>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {album.tracks.items.slice(0, 3).map((track, index) => (
                              <div key={track.id} className="flex justify-between">
                                <span>{track.name}</span>
                                <span>{formatDuration(track.duration_ms)}</span>
                              </div>
                            ))}
                            {album.tracks.items.length > 3 && (
                              <div className="text-muted-foreground">
                                +{album.tracks.items.length - 3} more tracks
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="singles" className="space-y-4">
          <div className="grid gap-4">
            {filteredSingles.map((single) => (
              <Card key={single.id} className={`cursor-pointer transition-all ${
                selectedItems.includes(single.id) ? 'ring-2 ring-music-purple' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedItems.includes(single.id)}
                      onCheckedChange={() => handleItemToggle(single.id, single, false)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{single.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(single.release_date)}
                          </Badge>
                          <Badge variant="outline">
                            <Music className="w-3 h-3 mr-1" />
                            {single.total_tracks} {single.total_tracks === 1 ? 'track' : 'tracks'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Popularity: {single.popularity || 'N/A'}/100</span>
                          <span>Est. Streams: {onEstimateStreams(single, false).toLocaleString()}</span>
                        </div>
                        <span className="font-medium text-music-purple">
                          Est. Annual Revenue: ${getEstimatedEarnings(single, false).toLocaleString()}
                        </span>
                      </div>

                      {single.tracks && single.tracks.items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {single.tracks.items.map((track) => (
                              <div key={track.id} className="flex justify-between">
                                <span>{track.name}</span>
                                <span>{formatDuration(track.duration_ms)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default TrackSelector;