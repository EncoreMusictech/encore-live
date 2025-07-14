import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, ExternalLink } from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  artist?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  src, 
  title = "Unknown Track", 
  artist = "Unknown Artist",
  className 
}) => {
  console.log('AudioPlayer props:', { src, title, artist });

  if (!src) {
    return (
      <div className={`p-4 border rounded-lg bg-muted/50 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          <span className="text-sm">No audio preview available</span>
        </div>
      </div>
    );
  }

  const openSpotifyLink = () => {
    window.open(src, '_blank');
  };

  return (
    <div className={`p-4 border rounded-lg bg-background ${className}`}>
      <div className="space-y-3">
        {/* Track Info */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{artist}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openSpotifyLink}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Listen
          </Button>
        </div>
      </div>
    </div>
  );
};