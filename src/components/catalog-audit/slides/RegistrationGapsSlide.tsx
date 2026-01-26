import React from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { AnimatedCounter } from '../AnimatedCounter';
import { cn } from '@/lib/utils';
import { AlertTriangle, FileQuestion, ShieldX, Database } from 'lucide-react';
import type { AuditPresentationData } from '@/hooks/useCatalogAuditPresentation';

interface RegistrationGapsSlideProps {
  data: AuditPresentationData;
  isActive: boolean;
}

export function RegistrationGapsSlide({ data, isActive }: RegistrationGapsSlideProps) {
  const gaps = [
    {
      id: 'iswc',
      label: 'Missing ISWC',
      description: 'Works without International Standard Work Code',
      value: data.registrationGaps.missingISWC,
      icon: FileQuestion,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'pro',
      label: 'Missing PRO Registration',
      description: 'Works not registered with a Performance Rights Organization',
      value: data.registrationGaps.missingPRO,
      icon: ShieldX,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
    },
    {
      id: 'metadata',
      label: 'Incomplete Metadata',
      description: 'Works with less than 70% data completeness',
      value: data.registrationGaps.incompleteMetadata,
      icon: Database,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
  ];

  return (
    <PresentationSlide
      isActive={isActive}
      slideNumber={4}
      title="Registration Gaps Identified"
      subtitle="Issues that may be causing royalty leakage"
      background="dark"
    >
      <div className="flex flex-col items-center space-y-10">
        {/* Total gaps callout */}
        <div 
          className={cn(
            'flex items-center gap-4 px-8 py-4 rounded-xl bg-destructive/10 border border-destructive/30 transition-all duration-500',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          )}
        >
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <div>
            <div className="text-3xl font-headline text-destructive">
              <AnimatedCounter 
                value={data.registrationGaps.total} 
                duration={1500}
                delay={300}
                startAnimation={isActive}
              />
            </div>
            <p className="text-sm text-destructive/80">Total Issues Found</p>
          </div>
        </div>

        {/* Gap breakdown cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {gaps.map((gap, index) => {
            const Icon = gap.icon;
            const percentage = Math.round((gap.value / data.catalogSize) * 100);

            return (
              <div
                key={gap.id}
                className={cn(
                  'p-6 rounded-xl border transition-all duration-500',
                  gap.bgColor,
                  gap.borderColor,
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: isActive ? `${500 + index * 200}ms` : '0ms' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className={cn('w-8 h-8', gap.color)} />
                  <span className={cn('text-sm font-medium px-2 py-1 rounded', gap.bgColor, gap.color)}>
                    {percentage}% of catalog
                  </span>
                </div>

                <div className={cn('text-4xl md:text-5xl font-headline mb-2', gap.color)}>
                  <AnimatedCounter 
                    value={gap.value} 
                    duration={1500}
                    delay={700 + index * 200}
                    startAnimation={isActive}
                  />
                </div>

                <h3 className="font-semibold text-foreground mb-1">{gap.label}</h3>
                <p className="text-sm text-muted-foreground">{gap.description}</p>

                {/* Visual progress bar showing gap percentage */}
                <div className="mt-4 h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full transition-all duration-1000 ease-out', gap.bgColor.replace('/10', ''))}
                    style={{ 
                      width: isActive ? `${percentage}%` : '0%',
                      transitionDelay: isActive ? `${1000 + index * 200}ms` : '0ms',
                      backgroundColor: gap.color.includes('amber') ? '#f59e0b' : 
                                       gap.color.includes('rose') ? '#f43f5e' : '#f97316'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning message */}
        <p 
          className={cn(
            'text-center text-muted-foreground max-w-2xl transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isActive ? '1500ms' : '0ms' }}
        >
          Each registration gap represents potential uncollected royalties. 
          These issues can lead to significant revenue leakage across streaming, performance, and mechanical royalties.
        </p>
      </div>
    </PresentationSlide>
  );
}
