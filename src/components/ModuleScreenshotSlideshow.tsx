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
    <Card className="relative overflow-hidden">
      {/* Image Container */}
      <div className="relative h-64 lg:h-80 overflow-hidden">
        <img 
          src={screenshots[currentIndex].image}
          alt={screenshots[currentIndex].caption}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Navigation Arrows */}
        {screenshots.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Slide Indicators */}
        {screenshots.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {screenshots.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-primary/40 hover:bg-primary/60'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Caption */}
      <div className="p-4 bg-background/95 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground font-medium">
          {screenshots[currentIndex].caption}
        </p>
      </div>
    </Card>
  );
};

export default ModuleScreenshotSlideshow;