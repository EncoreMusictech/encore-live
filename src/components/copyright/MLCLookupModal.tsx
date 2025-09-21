import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search } from 'lucide-react';
import { useMLCLookup } from '@/hooks/useMLCLookup';
import { useToast } from '@/hooks/use-toast';

interface MLCLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'ISWC' | 'ISRC';
  onResults: (results: any) => void;
}

export const MLCLookupModal: React.FC<MLCLookupModalProps> = ({
  open,
  onOpenChange,
  type,
  onResults
}) => {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { lookupWork } = useMLCLookup();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast({
        title: "Input Required",
        description: `Please enter a valid ${type}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Add 300ms debounce as requested
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const params = type === 'ISWC' 
        ? { iswc: identifier.trim() }
        : { isrc: identifier.trim() };

      const result = await lookupWork(params);
      
      if (result && result.found) {
        onResults({
          ...result,
          searchType: type,
          searchValue: identifier.trim(),
          timestamp: new Date().toISOString()
        });
        onOpenChange(false);
        setIdentifier('');
      } else {
        toast({
          title: "No Results Found",
          description: `No data found for ${type}: ${identifier}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`MLC ${type} lookup error:`, error);
      toast({
        title: "Lookup Failed",
        description: `Failed to lookup ${type}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setIdentifier('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            MLC Lookup by {type}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">
              {type} {type === 'ISWC' ? '(International Standard Work Code)' : '(International Standard Recording Code)'}
            </Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={type === 'ISWC' ? 'T-123456789-0' : 'USRC17607839'}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {type === 'ISWC' 
                ? 'Enter the work identifier to find writers and publishers'
                : 'Enter the recording identifier to find associated works and contributors'
              }
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!identifier.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search MLC
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};