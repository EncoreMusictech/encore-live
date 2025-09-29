import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useTour } from './TourProvider';
import { useDemoAccess } from '@/hooks/useDemoAccess';

export const TourOverlay = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, skipTour } = useTour();
  const { isDemo } = useDemoAccess();
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
          const cardWidth = 320; // Tour card width
          const cardHeight = 300; // Estimated tour card height
          const padding = 20; // Minimum distance from viewport edges
          const spacing = 20; // Space between highlighted element and modal
          
          switch (currentTourStep.position) {
            case 'bottom':
              top += rect.height + spacing;
              left += (rect.width / 2) - (cardWidth / 2); // Center align
              break;
            case 'top':
              top -= cardHeight + spacing;
              left += (rect.width / 2) - (cardWidth / 2); // Center align
              break;
            case 'right':
              left += rect.width + spacing;
              top += (rect.height / 2) - (cardHeight / 2); // Vertical center
              break;
            case 'left':
              left -= cardWidth + spacing;
              top += (rect.height / 2) - (cardHeight / 2); // Vertical center
              break;
            default:
              top += rect.height + spacing;
              left += (rect.width / 2) - (cardWidth / 2); // Center align
          }
          
          // Ensure the tour card stays within viewport bounds
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Adjust horizontal position if needed
          if (left < padding) {
            left = padding;
          } else if (left + cardWidth > viewportWidth - padding) {
            left = viewportWidth - cardWidth - padding;
          }
          
          // Adjust vertical position if needed
          if (top < scrollTop + padding) {
            top = scrollTop + padding;
          } else if (top + cardHeight > scrollTop + viewportHeight - padding) {
            top = scrollTop + viewportHeight - cardHeight - padding;
          }
          
          setOverlayPosition({ top, left });
          
          // Scroll element into view with more space
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          
          // Add a cutout effect to the backdrop around this element
          element.setAttribute('data-tour-highlight', 'true');
          
          // Highlight the target element with prominent pulsing glow effect
          const originalStyles = {
            position: element.style.position,
            zIndex: element.style.zIndex,
            boxShadow: element.style.boxShadow,
            borderRadius: element.style.borderRadius,
            transition: element.style.transition,
            backgroundColor: element.style.backgroundColor
          };
          element.setAttribute('data-original-styles', JSON.stringify(originalStyles));
          
          element.style.position = 'relative';
          element.style.zIndex = '99998';
          element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 1), 0 0 0 8px rgba(59, 130, 246, 0.6), 0 0 30px 12px rgba(59, 130, 246, 0.4)';
          element.style.borderRadius = '12px';
          element.style.transition = 'all 0.3s ease-in-out';
          element.style.backgroundColor = element.style.backgroundColor || 'transparent';
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
      // Clean up highlighting and restore original styles
      if (targetElement) {
        targetElement.removeAttribute('data-tour-highlight');
        
        const originalStylesStr = targetElement.getAttribute('data-original-styles');
        if (originalStylesStr) {
          const originalStyles = JSON.parse(originalStylesStr);
          targetElement.style.position = originalStyles.position;
          targetElement.style.zIndex = originalStyles.zIndex;
          targetElement.style.boxShadow = originalStyles.boxShadow;
          targetElement.style.borderRadius = originalStyles.borderRadius;
          targetElement.style.transition = originalStyles.transition;
          targetElement.style.backgroundColor = originalStyles.backgroundColor;
          targetElement.removeAttribute('data-original-styles');
        }
      }
    };
  }, [isActive, currentStep, currentTourStep]);

  if (!isDemo || !isActive || !currentTourStep) return null;

  return (
    <>
      {/* Smart Backdrop that cuts out around highlighted element */}
      <div 
        className="fixed inset-0 z-[99997]" 
        onClick={skipTour}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Tour Card */}
      <div 
        className="fixed z-[99999] w-80"
        style={{ 
          top: `${overlayPosition.top}px`, 
          left: `${overlayPosition.left}px`,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'visible'
        }}
      >
        <Card className="shadow-xl border-2 border-primary/20 overflow-hidden">
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
            
            <div className="flex flex-col gap-3">
              {/* Progress Text */}
              <div className="text-center text-xs text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 flex-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={nextStep}
                  className="flex items-center gap-1 flex-1"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-3 w-3" />}
                </Button>
              </div>
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