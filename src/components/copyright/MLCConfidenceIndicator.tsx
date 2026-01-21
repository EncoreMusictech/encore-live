import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface MLCConfidenceIndicatorProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  factors?: {
    hasIswc?: boolean;
    hasWriters?: boolean;
    hasPublishers?: boolean;
    hasRecordings?: boolean;
    titleMatch?: boolean;
  };
}

export const MLCConfidenceIndicator: React.FC<MLCConfidenceIndicatorProps> = ({
  confidence,
  showLabel = true,
  size = 'md',
  factors
}) => {
  const getConfidenceLevel = () => {
    if (confidence >= 80) return { level: 'high', color: 'text-green-600', bg: 'bg-green-500', label: 'High Confidence' };
    if (confidence >= 50) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Medium Confidence' };
    if (confidence >= 20) return { level: 'low', color: 'text-orange-600', bg: 'bg-orange-500', label: 'Low Confidence' };
    return { level: 'very-low', color: 'text-red-600', bg: 'bg-red-500', label: 'Very Low Confidence' };
  };

  const { level, color, label } = getConfidenceLevel();

  const getIcon = () => {
    switch (level) {
      case 'high': return <CheckCircle className={`h-4 w-4 ${color}`} />;
      case 'medium': return <AlertTriangle className={`h-4 w-4 ${color}`} />;
      case 'low': return <AlertTriangle className={`h-4 w-4 ${color}`} />;
      default: return <XCircle className={`h-4 w-4 ${color}`} />;
    }
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const getFactorTooltip = () => {
    if (!factors) return null;
    
    const items = [
      { label: 'ISWC Found', value: factors.hasIswc },
      { label: 'Writers Found', value: factors.hasWriters },
      { label: 'Publishers Found', value: factors.hasPublishers },
      { label: 'Recordings Linked', value: factors.hasRecordings },
      { label: 'Title Match', value: factors.titleMatch }
    ];

    return (
      <div className="space-y-1">
        <div className="font-medium mb-2">Confidence Factors</div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {item.value ? (
              <CheckCircle className="h-3 w-3 text-primary" />
            ) : (
              <XCircle className="h-3 w-3 text-destructive" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {getIcon()}
            <div className="flex-1 min-w-[60px]">
              <Progress 
                value={confidence} 
                className={sizeClasses[size]}
              />
            </div>
            {showLabel && (
              <span className={`text-xs font-medium ${color}`}>
                {confidence}%
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-sm">
            <div className="font-medium">{label}</div>
            {factors && getFactorTooltip()}
            {!factors && (
              <div className="text-xs text-muted-foreground mt-1">
                Based on data completeness and match quality
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
