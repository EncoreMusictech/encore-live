import React from 'react';
import { motion } from 'framer-motion';
import { Search, Database, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { DiscoveryStep } from '@/hooks/useCatalogAuditDiscovery';

interface CatalogDiscoveryProgressProps {
  step: DiscoveryStep;
  progress: number;
  message: string;
  artistName: string;
  songsFound: number;
}

const discoverySteps = [
  { id: 'musicbrainz', label: 'MusicBrainz Catalog', icon: Search, description: 'Searching artist discography' },
  { id: 'pro_lookup', label: 'PRO Databases', icon: Shield, description: 'ASCAP, BMI, SESAC lookup' },
  { id: 'enriching', label: 'Metadata Analysis', icon: Database, description: 'Analyzing registration gaps' },
];

export function CatalogDiscoveryProgress({
  step,
  progress,
  message,
  artistName,
  songsFound,
}: CatalogDiscoveryProgressProps) {
  const getStepStatus = (stepId: string) => {
    const stepOrder = ['creating', 'musicbrainz', 'pro_lookup', 'enriching', 'completed'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-headline text-foreground">
            Discovering Catalog
          </h1>
          <p className="text-xl text-primary">{artistName}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">{message}</p>
        </div>

        {/* Discovery Steps */}
        <div className="space-y-4">
          {discoverySteps.map((s, index) => {
            const status = getStepStatus(s.id);
            const Icon = s.icon;
            
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  status === 'active' 
                    ? 'bg-primary/10 border border-primary/30' 
                    : status === 'completed'
                    ? 'bg-success/10 border border-success/30'
                    : 'bg-muted/30 border border-border'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  status === 'active' 
                    ? 'bg-primary/20 text-primary' 
                    : status === 'completed'
                    ? 'bg-success/20 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    {s.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Songs Found Counter */}
        {songsFound > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4 bg-card rounded-lg border"
          >
            <p className="text-3xl font-bold text-primary">{songsFound}</p>
            <p className="text-sm text-muted-foreground">Songs Discovered</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
