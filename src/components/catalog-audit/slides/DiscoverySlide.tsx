import React, { useState, useEffect } from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { cn } from '@/lib/utils';
import { Search, Database, Shield, CheckCircle, Loader2 } from 'lucide-react';

interface DiscoverySlideProps {
  artistName: string;
  isActive: boolean;
}

const discoverySteps = [
  { id: 'spotify', label: 'Spotify Catalog Search', icon: Search, color: 'text-green-500' },
  { id: 'mlc', label: 'MLC Database Lookup', icon: Database, color: 'text-blue-500' },
  { id: 'pro', label: 'PRO Cross-Reference', icon: Shield, color: 'text-purple-500' },
];

export function DiscoverySlide({ artistName, isActive }: DiscoverySlideProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCompletedSteps([]);
      setCurrentStep(null);
      return;
    }

    // Simulate discovery process
    const stepTimers: NodeJS.Timeout[] = [];
    
    discoverySteps.forEach((step, index) => {
      // Start step
      stepTimers.push(
        setTimeout(() => {
          setCurrentStep(step.id);
        }, index * 1500)
      );
      
      // Complete step
      stepTimers.push(
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, step.id]);
          if (index === discoverySteps.length - 1) {
            setCurrentStep(null);
          }
        }, (index + 1) * 1500 - 300)
      );
    });

    return () => {
      stepTimers.forEach(timer => clearTimeout(timer));
    };
  }, [isActive]);

  return (
    <PresentationSlide 
      isActive={isActive} 
      slideNumber={2}
      title="Discovering Your Catalog"
      subtitle={`Searching for ${artistName}'s works across multiple databases`}
      background="dark"
    >
      <div className="flex flex-col items-center space-y-12">
        {/* Discovery steps visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          {discoverySteps.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'relative p-6 rounded-xl border transition-all duration-500',
                  isComplete 
                    ? 'bg-success/10 border-success/30' 
                    : isCurrent
                    ? 'bg-primary/10 border-primary/30 animate-pulse'
                    : 'bg-muted/5 border-muted/20'
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Connection line */}
                {index < discoverySteps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-0.5">
                    <div 
                      className={cn(
                        'h-full bg-gradient-to-r from-muted/50 to-transparent transition-all duration-500',
                        completedSteps.includes(step.id) ? 'from-success/50' : ''
                      )}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-4">
                  <div 
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                      isComplete 
                        ? 'bg-success/20' 
                        : isCurrent 
                        ? 'bg-primary/20' 
                        : 'bg-muted/10'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-8 h-8 text-success" />
                    ) : isCurrent ? (
                      <Loader2 className={cn('w-8 h-8 animate-spin', step.color)} />
                    ) : (
                      <Icon className={cn('w-8 h-8', step.color, 'opacity-50')} />
                    )}
                  </div>
                  
                  <div>
                    <h3 className={cn(
                      'font-semibold transition-colors duration-300',
                      isComplete ? 'text-success' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isComplete ? 'Complete' : isCurrent ? 'Searching...' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated pulse ring when all complete */}
        {completedSteps.length === discoverySteps.length && (
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
            <div className="relative px-8 py-4 rounded-full bg-success/10 border border-success/30">
              <p className="text-success font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Catalog Discovery Complete
              </p>
            </div>
          </div>
        )}
      </div>
    </PresentationSlide>
  );
}
