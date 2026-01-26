import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
  prefix?: string;
  suffix?: string;
  startAnimation?: boolean;
}

// Ease-out exponential function for smooth deceleration
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedCounter({
  value,
  duration = 2000,
  delay = 0,
  format = 'number',
  className,
  prefix = '',
  suffix = '',
  startAnimation = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startAnimation) {
      setDisplayValue(0);
      setHasStarted(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasStarted(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [startAnimation, delay]);

  useEffect(() => {
    if (!hasStarted) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      setDisplayValue(Math.floor(easedProgress * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [hasStarted, value, duration]);

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  return (
    <span className={cn('tabular-nums font-headline', className)}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
}
