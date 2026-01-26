import React from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { AnimatedCounter } from '../AnimatedCounter';
import { cn } from '@/lib/utils';
import { Music, Disc, Mic2 } from 'lucide-react';
import type { AuditPresentationData } from '@/hooks/useCatalogAuditPresentation';

interface CatalogOverviewSlideProps {
  data: AuditPresentationData;
  isActive: boolean;
}

export function CatalogOverviewSlide({ data, isActive }: CatalogOverviewSlideProps) {
  return (
    <PresentationSlide
      isActive={isActive}
      slideNumber={3}
      title="Catalog Overview"
      subtitle="Works discovered and analyzed"
      background="dark"
    >
      <div className="flex flex-col items-center space-y-12">
        {/* Main stat - Total songs */}
        <div 
          className={cn(
            'text-center transition-all duration-700',
            isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <div className="relative">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
            
            <div className="relative bg-card/50 backdrop-blur-sm border border-primary/20 rounded-3xl p-8 md:p-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Music className="w-8 h-8 md:w-12 md:h-12 text-primary" />
              </div>
              <div className="text-6xl md:text-8xl font-headline text-primary">
                <AnimatedCounter 
                  value={data.catalogSize} 
                  duration={2000}
                  delay={500}
                  startAnimation={isActive}
                />
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground mt-4 font-accent tracking-wide">
                SONGS DISCOVERED
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown stats */}
        <div className="grid grid-cols-2 gap-6 md:gap-12 w-full max-w-2xl">
          {/* Albums */}
          <div 
            className={cn(
              'text-center p-6 rounded-xl bg-card/30 border border-border/50 transition-all duration-500',
              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: isActive ? '800ms' : '0ms' }}
          >
            <Disc className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-headline text-accent">
              <AnimatedCounter 
                value={data.albumCount} 
                duration={1500}
                delay={1000}
                startAnimation={isActive}
              />
            </div>
            <p className="text-muted-foreground mt-2">Albums</p>
          </div>

          {/* Singles */}
          <div 
            className={cn(
              'text-center p-6 rounded-xl bg-card/30 border border-border/50 transition-all duration-500',
              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: isActive ? '1000ms' : '0ms' }}
          >
            <Mic2 className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-headline text-primary">
              <AnimatedCounter 
                value={data.singleCount} 
                duration={1500}
                delay={1200}
                startAnimation={isActive}
              />
            </div>
            <p className="text-muted-foreground mt-2">Singles</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div 
          className={cn(
            'w-full max-w-md transition-all duration-700',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isActive ? '1400ms' : '0ms' }}
        >
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Metadata Analyzed</span>
            <span>{Math.round((1 - data.registrationGaps.incompleteMetadata / data.catalogSize) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1500 ease-out"
              style={{ 
                width: isActive 
                  ? `${Math.round((1 - data.registrationGaps.incompleteMetadata / data.catalogSize) * 100)}%` 
                  : '0%',
                transitionDelay: isActive ? '1600ms' : '0ms'
              }}
            />
          </div>
        </div>
      </div>
    </PresentationSlide>
  );
}
