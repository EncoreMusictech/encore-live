import { useState, useEffect, useCallback } from 'react';

interface ImageOptimizationOptions {
  lazy?: boolean;
  placeholder?: string;
  quality?: number;
  formats?: ('webp' | 'avif' | 'jpg' | 'png')[];
}

// Hook for optimized image loading
export function useImageOptimization(src: string, options: ImageOptimizationOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(options.placeholder || '');

  const loadImage = useCallback(() => {
    if (!src || isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    
    img.onload = () => {
      setOptimizedSrc(src);
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    
    img.src = src;
  }, [src, isLoaded, isLoading]);

  useEffect(() => {
    if (!options.lazy) {
      loadImage();
    }
  }, [loadImage, options.lazy]);

  return {
    src: optimizedSrc,
    isLoaded,
    isLoading,
    error,
    loadImage, // For manual triggering (e.g., intersection observer)
  };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Hook for progressive image enhancement
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string,
  options: ImageOptimizationOptions = {}
) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };
    img.src = highQualitySrc;
  }, [highQualitySrc]);

  return {
    src: currentSrc,
    isHighQualityLoaded,
  };
}