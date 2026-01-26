import React from 'react';
import { PresentationSlide } from '../PresentationSlide';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Rocket, Mail, Phone } from 'lucide-react';

interface CTASlideProps {
  artistName: string;
  isActive: boolean;
  onDownloadReport?: () => void;
  isGeneratingPDF?: boolean;
}

export function CTASlide({ 
  artistName, 
  isActive, 
  onDownloadReport,
  isGeneratingPDF = false
}: CTASlideProps) {
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

        {/* Contact info */}
        <div 
          className={cn(
            'pt-8 border-t border-border/30 transition-all duration-700',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isActive ? '600ms' : '0ms' }}
        >
          <p className="text-sm text-muted-foreground mb-4">Or reach out directly:</p>
          <div className="flex flex-col md:flex-row items-center gap-6 text-muted-foreground">
            <a 
              href="mailto:info@encore.live" 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@encore.live
            </a>
            <a 
              href="tel:+1-555-ENCORE" 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              (555) ENCORE
            </a>
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
