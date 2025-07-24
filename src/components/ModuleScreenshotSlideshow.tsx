import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Screenshot {
  image: string;
  caption: string;
}

interface ModuleScreenshotSlideshowProps {
  screenshots: Screenshot[];
  autoPlay?: boolean;
  interval?: number;
}

const ModuleScreenshotSlideshow = ({ 
  screenshots, 
  autoPlay = true, 
  interval = 4000 
}: ModuleScreenshotSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || screenshots.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, screenshots.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1);
  };

  if (!screenshots || screenshots.length === 0) {
    return (
      <Card className="p-8 text-center bg-muted/50">
        <p className="text-muted-foreground">Screenshots coming soon</p>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-electric-lavender/20 via-dusty-gold/20 to-electric-lavender/20 rounded-xl blur-xl animate-pulse opacity-75" />
      
      {/* Animated Border Frame */}
      <div className="relative bg-gradient-to-r from-electric-lavender/30 via-dusty-gold/30 to-electric-lavender/30 p-0.5 rounded-xl animate-fade-in">
        <Card className="relative overflow-hidden bg-background rounded-xl border-0 shadow-glow hover-scale transition-all duration-500">
          {/* Floating Animation Dots */}
          <div className="absolute top-4 right-4 flex space-x-1 z-10">
            <div className="w-2 h-2 bg-electric-lavender rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-dusty-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-electric-lavender rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          {/* Image Container with Enhanced Styling */}
          <div className="relative h-64 lg:h-80 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-background/20 z-10 pointer-events-none" />
            <img 
              src={screenshots[currentIndex].image}
              alt={screenshots[currentIndex].caption}
              className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            />
            {/* Enhanced Navigation Arrows */}
            {screenshots.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-electric-lavender/20 backdrop-blur-sm border border-electric-lavender/30 shadow-glow transition-all duration-300 hover:scale-110"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4 text-electric-lavender" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-electric-lavender/20 backdrop-blur-sm border border-electric-lavender/30 shadow-glow transition-all duration-300 hover:scale-110"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4 text-electric-lavender" />
                </Button>
              </>
            )}

            {/* Enhanced Slide Indicators */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-2 border border-electric-lavender/20">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                      index === currentIndex 
                        ? 'bg-electric-lavender scale-125 shadow-glow' 
                        : 'bg-platinum-gray/40 hover:bg-electric-lavender/60 hover:scale-110'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Enhanced Caption with Gradient Background */}
          <div className="relative p-4 bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm border-t border-electric-lavender/20">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-lavender/5 via-transparent to-dusty-gold/5" />
            <p className="relative text-sm text-platinum-gray font-medium leading-relaxed">
              {screenshots[currentIndex].caption}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModuleScreenshotSlideshow;