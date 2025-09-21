import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from './button';

interface SafeExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  onBeforeNavigate?: () => void;
}

/**
 * Safe external link component that preserves CRM state when opening external links
 * Uses window.open with proper attributes to prevent parent window issues
 */
export const SafeExternalLink: React.FC<SafeExternalLinkProps> = ({
  href,
  children,
  className,
  variant = "outline",
  size = "sm",
  showIcon = true,
  onBeforeNavigate
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save current state before opening external link
    if (onBeforeNavigate) {
      onBeforeNavigate();
    }
    
    // Open in new tab with proper security attributes
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {children}
      {showIcon && <ExternalLink className="ml-2 h-3 w-3" />}
    </Button>
  );
};