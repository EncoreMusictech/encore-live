import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize, 
  Minimize,
  X
} from 'lucide-react';

import { IntroSlide } from './slides/IntroSlide';
import { DiscoverySlide } from './slides/DiscoverySlide';
import { CatalogOverviewSlide } from './slides/CatalogOverviewSlide';
import { RegistrationGapsSlide } from './slides/RegistrationGapsSlide';
import { FinancialImpactSlide } from './slides/FinancialImpactSlide';
import { IntegrationSlide } from './slides/IntegrationSlide';
import { CTASlide } from './slides/CTASlide';

import type { AuditPresentationData } from '@/hooks/useCatalogAuditPresentation';

interface CatalogAuditPresentationProps {
  data: AuditPresentationData;
  onClose?: () => void;
  onDownloadReport?: () => void;
  isGeneratingPDF?: boolean;
}

const SLIDES = [
  { id: 'intro', label: 'Introduction' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'overview', label: 'Catalog Overview' },
  { id: 'gaps', label: 'Registration Gaps' },
  { id: 'impact', label: 'Financial Impact' },
  { id: 'integration', label: 'ENCORE Integration' },
  { id: 'cta', label: 'Call to Action' },
];

const AUTO_ADVANCE_DELAY = 8000; // 8 seconds per slide

export function CatalogAuditPresentation({
  data,
  onClose,
  onDownloadReport,
  isGeneratingPDF = false,
}: CatalogAuditPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrevious();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose?.();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Auto-advance functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= SLIDES.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_DELAY);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const showControlsTemporarily = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', showControlsTemporarily);
    window.addEventListener('click', showControlsTemporarily);

    return () => {
      window.removeEventListener('mousemove', showControlsTemporarily);
      window.removeEventListener('click', showControlsTemporarily);
      clearTimeout(timeout);
    };
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
  }, []);

  const goPrevious = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Slides container */}
      <div className="relative w-full h-full overflow-hidden">
        <IntroSlide 
          artistName={data.artistName} 
          isActive={currentSlide === 0} 
        />
        <DiscoverySlide 
          artistName={data.artistName} 
          isActive={currentSlide === 1} 
        />
        <CatalogOverviewSlide 
          data={data} 
          isActive={currentSlide === 2} 
        />
        <RegistrationGapsSlide 
          data={data} 
          isActive={currentSlide === 3} 
        />
        <FinancialImpactSlide 
          data={data} 
          isActive={currentSlide === 4} 
        />
        <IntegrationSlide 
          isActive={currentSlide === 5} 
        />
        <CTASlide 
          artistName={data.artistName}
          isActive={currentSlide === 6}
          onDownloadReport={onDownloadReport}
          isGeneratingPDF={isGeneratingPDF}
        />
      </div>

      {/* Controls overlay */}
      <div 
        className={cn(
          'absolute inset-x-0 bottom-0 p-4 md:p-6 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentSlide 
                    ? 'w-8 bg-primary' 
                    : index < currentSlide 
                    ? 'bg-primary/50' 
                    : 'bg-muted/30'
                )}
                aria-label={`Go to slide ${index + 1}: ${slide.label}`}
              />
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrevious}
                disabled={currentSlide === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isAutoPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                disabled={currentSlide === SLIDES.length - 1}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {currentSlide + 1} / {SLIDES.length}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-muted-foreground hover:text-foreground"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>

              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div 
        className={cn(
          'absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/50 transition-opacity duration-300',
          showControls && currentSlide === 0 ? 'opacity-100' : 'opacity-0'
        )}
      >
        Press arrow keys or spacebar to navigate • Press F for fullscreen
      </div>
    </div>
  );
}
