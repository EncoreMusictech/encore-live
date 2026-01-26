import React from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Rocket, Mail, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CTASlideProps {
  artistName: string;
  isActive: boolean;
  onDownloadReport?: () => void;
  isGeneratingPDF?: boolean;
  shareUrl?: string;
}

export function CTASlide({ 
  artistName, 
  isActive, 
  onDownloadReport,
  isGeneratingPDF = false,
  shareUrl
}: CTASlideProps) {
  const currentUrl = shareUrl || window.location.href;
  const shareText = `Check out this catalog audit for ${artistName} - Discover uncollected royalties with ENCORE`;

  const handleShare = (platform: 'copy' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok') => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(shareText);
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(currentUrl);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, copy link instead
        navigator.clipboard.writeText(currentUrl);
        break;
      case 'tiktok':
        // TikTok doesn't have a direct share URL, copy link instead
        navigator.clipboard.writeText(currentUrl);
        break;
    }
  };
  return (
    <PresentationSlide
      isActive={isActive}
      slideNumber={7}
      background="gradient"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-10">
        {/* Main headline */}
        <div 
          className={cn(
            'space-y-4 transition-all duration-700',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          )}
        >
          <h1 className="text-4xl md:text-6xl font-headline text-foreground">
            Ready to recover your royalties?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let ENCORE help {artistName} collect what they've earned
          </p>
        </div>

        {/* CTA Buttons */}
        <div 
          className={cn(
            'flex flex-col md:flex-row gap-4 transition-all duration-700',
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          style={{ transitionDelay: isActive ? '300ms' : '0ms' }}
        >
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg gap-3"
            onClick={() => window.open('https://www.calendly.com/encoremts', '_blank')}
          >
            <Calendar className="w-5 h-5" />
            Schedule a Demo
          </Button>

          <Button 
            size="lg"
            variant="outline"
            className="border-primary/30 hover:bg-primary/10 px-8 py-6 text-lg gap-3"
            onClick={onDownloadReport}
            disabled={isGeneratingPDF}
          >
            <Download className={cn('w-5 h-5', isGeneratingPDF && 'animate-spin')} />
            {isGeneratingPDF ? 'Generating...' : 'Download Report'}
          </Button>

          <Button 
            size="lg"
            variant="outline"
            className="border-accent/30 hover:bg-accent/10 text-accent px-8 py-6 text-lg gap-3"
            onClick={() => window.open('/trial-signup', '_blank')}
          >
            <Rocket className="w-5 h-5" />
            Start Free Trial
          </Button>
        </div>

        {/* Contact & Share */}
        <div 
          className={cn(
            'pt-8 border-t border-border/30 transition-all duration-700',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isActive ? '600ms' : '0ms' }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:info@encoremusic.tech" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@encoremusic.tech
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                  LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('instagram')}>
                  Instagram (Copy Link)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('tiktok')}>
                  TikTok (Copy Link)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
        )}
      </div>
    </PresentationSlide>
  );
}
