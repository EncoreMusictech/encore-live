import React from 'react';
import { cn } from '@/lib/utils';

interface PresentationSlideProps {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  slideNumber?: number;
  title?: string;
  subtitle?: string;
  background?: 'dark' | 'gradient' | 'spotlight';
}

export function PresentationSlide({
  children,
  className,
  isActive,
  slideNumber,
  title,
  subtitle,
  background = 'dark',
}: PresentationSlideProps) {
  const backgroundClasses = {
    dark: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    gradient: 'bg-gradient-to-br from-slate-900 via-primary/10 to-slate-900',
    spotlight: 'bg-black',
  };

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16 transition-all duration-600',
        backgroundClasses[background],
        isActive 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-8 pointer-events-none',
        className
      )}
    >
      {/* Slide number indicator */}
      {slideNumber && (
        <div className="absolute top-6 left-6 text-muted-foreground/50 text-sm font-accent">
          {String(slideNumber).padStart(2, '0')}
        </div>
      )}

      {/* Title section */}
      {(title || subtitle) && (
        <div 
          className={cn(
            'text-center mb-8 md:mb-12 transition-all duration-500',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          )}
          style={{ transitionDelay: isActive ? '100ms' : '0ms' }}
        >
          {title && (
            <h2 className="text-3xl md:text-5xl font-headline text-foreground mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main content with staggered animations */}
      <div 
        className={cn(
          'w-full max-w-6xl transition-all duration-500',
          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}
        style={{ transitionDelay: isActive ? '200ms' : '0ms' }}
      >
        {children}
      </div>
    </div>
  );
}
