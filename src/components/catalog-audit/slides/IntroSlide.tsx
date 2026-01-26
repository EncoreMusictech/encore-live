import React, { useState, useEffect } from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { cn } from '@/lib/utils';
import { Music2 } from 'lucide-react';

interface IntroSlideProps {
  artistName: string;
  isActive: boolean;
}

export function IntroSlide({ artistName, isActive }: IntroSlideProps) {
  const [displayText, setDisplayText] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);

  // Typewriter effect for artist name
  useEffect(() => {
    if (!isActive) {
      setDisplayText('');
      setShowTitle(false);
      setShowSubtitle(false);
      return;
    }

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex <= artistName.length) {
        setDisplayText(artistName.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setShowTitle(true), 300);
        setTimeout(() => setShowSubtitle(true), 600);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [isActive, artistName]);

  return (
    <PresentationSlide isActive={isActive} background="gradient">
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        {/* ENCORE Logo Animation */}
        <div 
          className={cn(
            'transition-all duration-700',
            isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full animate-pulse" />
            
            <div className="relative flex items-center justify-center gap-3 text-primary">
              <Music2 className="w-12 h-12 md:w-16 md:h-16" />
              <span className="text-4xl md:text-6xl font-headline tracking-tight">
                ENCORE
              </span>
            </div>
          </div>
        </div>

        {/* "Catalog Audit for..." text */}
        <div 
          className={cn(
            'transition-all duration-500 delay-300',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="text-lg md:text-xl text-muted-foreground font-accent tracking-widest">
            CATALOG AUDIT FOR
          </p>
        </div>

        {/* Artist Name with typewriter effect */}
        <div className="min-h-[80px] md:min-h-[120px] flex items-center">
          <h1 className="text-4xl md:text-7xl font-headline text-foreground">
            {displayText}
            <span 
              className={cn(
                'inline-block w-1 h-12 md:h-16 bg-primary ml-1 transition-opacity',
                displayText.length === artistName.length ? 'opacity-0' : 'animate-pulse'
              )}
            />
          </h1>
        </div>

        {/* Subtitle reveal */}
        <div 
          className={cn(
            'transition-all duration-500',
            showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="text-xl md:text-2xl text-muted-foreground">
            Powered by ENCORE's Integrated Rights Management Platform
          </p>
        </div>

        {/* Decorative musical notes floating */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/10 text-4xl animate-float"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`,
                }}
              >
                ♪
              </div>
            ))}
          </div>
        )}
      </div>
    </PresentationSlide>
  );
}
