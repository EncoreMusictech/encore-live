import React, { useState, useEffect } from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { AnimatedCounter } from '../AnimatedCounter';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign, BarChart3, Zap } from 'lucide-react';
import type { AuditPresentationData } from '@/hooks/useCatalogAuditPresentation';

interface FinancialImpactSlideProps {
  data: AuditPresentationData;
  isActive: boolean;
}

export function FinancialImpactSlide({ data, isActive }: FinancialImpactSlideProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowBreakdown(false);
      setShowConfidence(false);
      return;
    }

    const breakdownTimer = setTimeout(() => setShowBreakdown(true), 2500);
    const confidenceTimer = setTimeout(() => setShowConfidence(true), 3500);

    return () => {
      clearTimeout(breakdownTimer);
      clearTimeout(confidenceTimer);
    };
  }, [isActive]);

  const confidenceColors = {
    high: { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/30' },
    low: { bg: 'bg-rose-500/20', text: 'text-rose-500', border: 'border-rose-500/30' },
  };

  const confidenceStyle = confidenceColors[data.pipelineEstimate.confidenceLevel];

  return (
    <PresentationSlide
      isActive={isActive}
      background="spotlight"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-8 relative">
        {/* Spotlight effect */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
          </div>
        )}

        {/* Pre-text */}
        <p 
          className={cn(
            'text-lg md:text-xl text-muted-foreground transition-all duration-700',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Based on our analysis...
        </p>

        {/* Main reveal - The Big Number */}
        <div 
          className={cn(
            'relative transition-all duration-1000',
            isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          )}
          style={{ transitionDelay: isActive ? '800ms' : '0ms' }}
        >
          {/* Pulsing glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-destructive/20 blur-2xl animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/30 rounded-3xl p-8 md:p-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-destructive" />
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
            </div>
            
            <div className="text-5xl md:text-8xl lg:text-9xl font-headline text-destructive">
              <AnimatedCounter 
                value={Math.round(data.pipelineEstimate.missingImpact)}
                format="currency"
                duration={2500}
                delay={1200}
                startAnimation={isActive}
              />
            </div>
            
            <p className="text-xl md:text-2xl text-destructive/80 mt-4 font-accent tracking-wide">
              IN ESTIMATED UNCOLLECTED ROYALTIES
            </p>
          </div>
        </div>

        {/* Breakdown section */}
        <div 
          className={cn(
            'grid grid-cols-3 gap-4 md:gap-8 w-full max-w-3xl transition-all duration-700',
            showBreakdown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {[
            { label: 'Performance', value: data.pipelineEstimate.performance, icon: BarChart3 },
            { label: 'Mechanical', value: data.pipelineEstimate.mechanical, icon: Zap },
            { label: 'Sync', value: data.pipelineEstimate.sync, icon: TrendingUp },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.label}
                className="text-center p-4 rounded-xl bg-card/30 border border-border/30"
                style={{ transitionDelay: showBreakdown ? `${index * 100}ms` : '0ms' }}
              >
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-headline text-primary">
                  <AnimatedCounter 
                    value={Math.round(item.value)}
                    format="currency"
                    duration={1500}
                    delay={showBreakdown ? 200 + index * 100 : 0}
                    startAnimation={showBreakdown}
                  />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Confidence badge */}
        <div 
          className={cn(
            'transition-all duration-500',
            showConfidence ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full border',
            confidenceStyle.bg,
            confidenceStyle.text,
            confidenceStyle.border
          )}>
            <span className="text-sm font-medium uppercase tracking-wide">
              {data.pipelineEstimate.confidenceLevel} Confidence
            </span>
          </div>
        </div>
      </div>
    </PresentationSlide>
  );
}
