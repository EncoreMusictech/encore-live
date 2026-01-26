import React from 'react';
import { motion } from 'framer-motion';
import { Music, Radio, Tv, MapPin, Users, Headphones } from 'lucide-react';
import type { ArtistEnrichmentData } from '@/hooks/useArtistEnrichment';

interface ArtistProfileSlideProps {
  artistName: string;
  enrichment: ArtistEnrichmentData | null;
  isActive: boolean;
  isLoading?: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function ArtistProfileSlide({ 
  artistName, 
  enrichment, 
  isActive,
  isLoading 
}: ArtistProfileSlideProps) {
  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center p-8 md:p-16 ${
        isActive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ 
        opacity: isActive ? 1 : 0,
        x: isActive ? 0 : -100,
      }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Artist Image & Basic Info */}
          <div className="flex flex-col items-center lg:items-start gap-6">
            {/* Artist Image */}
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isActive ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {enrichment?.imageUrl ? (
                <img
                  src={enrichment.imageUrl}
                  alt={artistName}
                  className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover shadow-2xl border-2 border-primary/30"
                />
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <Music className="w-20 h-20 text-primary/40" />
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>

            {/* Artist Name & Stats */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ y: 20, opacity: 0 }}
              animate={isActive ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-2">
                {artistName}
              </h2>
              {enrichment?.genres && enrichment.genres.length > 0 && (
                <p className="text-muted-foreground text-sm mb-4">
                  {enrichment.genres.slice(0, 3).join(' • ')}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex gap-6 justify-center lg:justify-start">
                {enrichment?.spotifyFollowers && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">{formatNumber(enrichment.spotifyFollowers)} followers</span>
                  </div>
                )}
                {enrichment?.monthlyListeners && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Headphones className="w-4 h-4 text-primary" />
                    <span className="text-sm">{formatNumber(enrichment.monthlyListeners)} monthly</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Biography */}
            {enrichment?.biography && (
              <motion.div
                className="max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={isActive ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {enrichment.biography}
                </p>
              </motion.div>
            )}
          </div>

          {/* Right: Top Tracks, Syncs, Performances */}
          <div className="space-y-6">
            {/* Top Tracks */}
            {enrichment?.topTracks && enrichment.topTracks.length > 0 && (
              <motion.div
                className="bg-card/50 backdrop-blur rounded-xl p-5 border border-border/30"
                initial={{ x: 50, opacity: 0 }}
                animate={isActive ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Top Tracks
                </h3>
                <ul className="space-y-2">
                  {enrichment.topTracks.slice(0, 5).map((track, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate flex-1 mr-2">
                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                        {track.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${track.popularity}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{track.popularity}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Recent Syncs */}
            {enrichment?.recentSyncs && enrichment.recentSyncs.length > 0 && (
              <motion.div
                className="bg-card/50 backdrop-blur rounded-xl p-5 border border-border/30"
                initial={{ x: 50, opacity: 0 }}
                animate={isActive ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  Notable Sync Placements
                </h3>
                <ul className="space-y-3">
                  {enrichment.recentSyncs.map((sync, idx) => (
                    <li key={idx} className="text-sm">
                      <p className="text-foreground font-medium">{sync.title}</p>
                      <p className="text-muted-foreground text-xs">{sync.placement}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Recent Performances */}
            {enrichment?.recentPerformances && enrichment.recentPerformances.length > 0 && (
              <motion.div
                className="bg-card/50 backdrop-blur rounded-xl p-5 border border-border/30"
                initial={{ x: 50, opacity: 0 }}
                animate={isActive ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  Recent Performances
                </h3>
                <ul className="space-y-3">
                  {enrichment.recentPerformances.map((perf, idx) => (
                    <li key={idx} className="text-sm">
                      <p className="text-foreground font-medium">{perf.event}</p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        {perf.date && <span>{perf.date}</span>}
                        {perf.date && perf.location && <span>•</span>}
                        {perf.location && (
                          <>
                            <MapPin className="w-3 h-3" />
                            {perf.location}
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* No data fallback */}
            {!isLoading && !enrichment?.topTracks?.length && !enrichment?.recentSyncs?.length && !enrichment?.recentPerformances?.length && (
              <motion.div
                className="bg-card/30 backdrop-blur rounded-xl p-8 border border-border/20 text-center"
                initial={{ opacity: 0 }}
                animate={isActive ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                <p className="text-muted-foreground">
                  Additional artist information not available
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
