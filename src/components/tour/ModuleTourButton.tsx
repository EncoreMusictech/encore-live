import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from './TourProvider';
import { useDemoAccess } from '@/hooks/useDemoAccess';

interface ModuleTourButtonProps {
  moduleId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ModuleTourButton = ({ 
  moduleId, 
  variant = 'outline', 
  size = 'sm',
  className = ''
}: ModuleTourButtonProps) => {
  const { startTour } = useTour();
  const { isDemo } = useDemoAccess();

  if (!isDemo) return null; // Only show for demo users

  const handleStartTour = () => {
    startTour(moduleId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartTour}
      className={`flex items-center gap-2 ${className}`}
    >
      <HelpCircle className="h-4 w-4" />
      How to Use
    </Button>
  );
};