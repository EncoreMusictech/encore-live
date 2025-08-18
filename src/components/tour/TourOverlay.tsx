import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useTour } from './TourProvider';

export const TourOverlay = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, skipTour } = useTour();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = steps[currentStep];

  useEffect(() => {
    if (isActive && currentTourStep?.target) {
      // Wait for navigation and element to appear with retries
      const findTargetElement = (attempts = 0) => {
        const maxAttempts = 20; // 2 seconds total
        const element = document.querySelector(currentTourStep.target) as HTMLElement;
        
        if (element) {
          setTargetElement(element);
          
          // Calculate overlay position
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          let top = rect.top + scrollTop;
          let left = rect.left + scrollLeft;
          
          // Adjust position based on tour step position preference
          switch (currentTourStep.position) {
            case 'bottom':
              top += rect.height + 10;
              break;
            case 'top':
              top -= 10;
              break;
            case 'right':
              left += rect.width + 10;
              break;
            case 'left':
              left -= 320; // Approximate card width
              break;
            default:
              top += rect.height + 10;
          }
          
          setOverlayPosition({ top, left });
          
          // Scroll element into view
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          
          // Highlight the target element
          element.style.position = 'relative';
          element.style.zIndex = '9999';
          element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
          element.style.borderRadius = '8px';
        } else if (attempts < maxAttempts) {
          // Element not found, try again in 100ms
          setTimeout(() => findTargetElement(attempts + 1), 100);
        } else {
          // Element not found after all attempts, show overlay without target
          setTargetElement(null);
          setOverlayPosition({ top: 100, left: 50 });
        }
      };

      // Start looking for the element
      findTargetElement();
    } else if (isActive && !currentTourStep?.target) {
      // No target specified, just show overlay in default position
      setTargetElement(null);
      setOverlayPosition({ top: 100, left: 50 });
    }

    return () => {
      // Clean up highlighting
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [isActive, currentStep, currentTourStep]);

  if (!isActive || !currentTourStep) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={skipTour} />
      
      {/* Tour Card */}
      <div 
        className="fixed z-[9999] w-80"
        style={{ 
          top: `${overlayPosition.top}px`, 
          left: `${overlayPosition.left}px`,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)'
        }}
      >
        <Card className="shadow-xl border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={skipTour}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="secondary" className="w-fit">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentTourStep.content}
            </p>
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentStep 
                        ? 'bg-primary' 
                        : index < currentStep 
                          ? 'bg-primary/50' 
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                size="sm" 
                onClick={nextStep}
                className="flex items-center gap-1"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
            
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={skipTour}
                className="w-full text-xs text-muted-foreground"
              >
                Skip Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};