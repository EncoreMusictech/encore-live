import React, { useState, useEffect } from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { cn } from '@/lib/utils';
import { 
  Copyright, 
  DollarSign, 
  Database, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface IntegrationSlideProps {
  isActive: boolean;
}

const tools = [
  { id: 'copyright', label: 'Copyright', icon: Copyright, color: 'text-blue-400' },
  { id: 'royalties', label: 'Royalties', icon: DollarSign, color: 'text-green-400' },
  { id: 'mlc', label: 'MLC', icon: Database, color: 'text-purple-400' },
  { id: 'contracts', label: 'Contracts', icon: FileText, color: 'text-amber-400' },
];

export function IntegrationSlide({ isActive }: IntegrationSlideProps) {
  const [animateTools, setAnimateTools] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setAnimateTools(false);
      setShowTagline(false);
      return;
    }

    const toolsTimer = setTimeout(() => setAnimateTools(true), 500);
    const taglineTimer = setTimeout(() => setShowTagline(true), 2000);

    return () => {
      clearTimeout(toolsTimer);
      clearTimeout(taglineTimer);
    };
  }, [isActive]);

  return (
    <PresentationSlide
      isActive={isActive}
      slideNumber={6}
      title="ENCORE Integrates Everything"
      subtitle="One platform to manage all your music rights"
      background="gradient"
    >
      <div className="flex flex-col items-center space-y-12">
        {/* Central hub visualization */}
        <div className="relative w-full max-w-4xl h-[300px] md:h-[400px]">
          {/* Center logo */}
          <div 
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700',
              isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Orbiting tool icons */}
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const angle = (index * 90) - 45; // Distribute evenly in a circle
            const radius = 120; // Distance from center
            const radians = (angle * Math.PI) / 180;
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;

            return (
              <div
                key={tool.id}
                className={cn(
                  'absolute top-1/2 left-1/2 transition-all duration-700',
                  animateTools ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                  transform: animateTools 
                    ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                    : 'translate(-50%, -50%)',
                  transitionDelay: `${300 + index * 150}ms`,
                }}
              >
                {/* Connection line */}
                <div 
                  className={cn(
                    'absolute w-20 h-0.5 bg-gradient-to-r from-primary/50 to-transparent',
                    'origin-right'
                  )}
                  style={{
                    transform: `rotate(${angle + 180}deg) translateX(-50%)`,
                    opacity: animateTools ? 0.5 : 0,
                    transition: 'opacity 0.5s',
                    transitionDelay: `${800 + index * 100}ms`,
                  }}
                />

                <div className="relative group">
                  <div className={cn(
                    'w-16 h-16 md:w-20 md:h-20 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50',
                    'flex flex-col items-center justify-center gap-1',
                    'hover:border-primary/50 hover:bg-card transition-all duration-300',
                    'hover:scale-110'
                  )}>
                    <Icon className={cn('w-6 h-6 md:w-8 md:h-8', tool.color)} />
                    <span className="text-xs font-medium text-muted-foreground">{tool.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature list */}
        <div 
          className={cn(
            'grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl transition-all duration-700',
            animateTools ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          style={{ transitionDelay: animateTools ? '1200ms' : '0ms' }}
        >
          {[
            'Automatic Registration',
            'Real-time Tracking',
            'Smart Matching',
            'Revenue Optimization',
          ].map((feature, index) => (
            <div 
              key={feature}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ArrowRight className="w-4 h-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div 
          className={cn(
            'text-center transition-all duration-700',
            showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="text-2xl md:text-4xl font-headline text-foreground">
            All your rights.{' '}
            <span className="text-primary">One platform.</span>
          </p>
        </div>
      </div>
    </PresentationSlide>
  );
}
