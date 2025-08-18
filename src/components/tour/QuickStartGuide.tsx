import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  TrendingUp, 
  FileText, 
  Copyright, 
  Film, 
  DollarSign,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { useTour } from './TourProvider';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { Link } from 'react-router-dom';

const QUICK_START_MODULES = [
  {
    id: 'catalog-valuation',
    title: 'Catalog Valuation',
    icon: TrendingUp,
    description: 'Get AI-powered valuations for any music catalog',
    url: '/dashboard/catalog-valuation',
    steps: [
      'Search for any artist (try "Taylor Swift")',
      'Review streaming data and popularity metrics',
      'Analyze the AI-generated valuation',
      'Explore different deal scenarios'
    ],
    time: '2 min'
  },
  {
    id: 'contracts',
    title: 'Contract Management',
    icon: FileText,
    description: 'Create and manage music industry agreements',
    url: '/dashboard/contracts',
    steps: [
      'Choose your contract type',
      'Complete the guided 7-step form',
      'Review auto-populated terms',
      'Save as template for future use'
    ],
    time: '5 min'
  },
  {
    id: 'copyright',
    title: 'Copyright Registration',
    icon: Copyright,
    description: 'Register musical works and manage writer splits',
    url: '/dashboard/copyright',
    steps: [
      'Enter song title and basic info',
      'Add writers and publishers',
      'Set ownership percentages (must total 100%)',
      'Include PRO and IPI information'
    ],
    time: '3 min'
  },
  {
    id: 'sync',
    title: 'Sync Licensing',
    icon: Film,
    description: 'Track sync opportunities and manage deals',
    url: '/dashboard/sync',
    steps: [
      'Log a new sync opportunity',
      'Set project details and usage terms',
      'Track deal progress through stages',
      'Generate invoice when approved'
    ],
    time: '4 min'
  },
  {
    id: 'royalties',
    title: 'Royalty Processing',
    icon: DollarSign,
    description: 'Import statements and distribute earnings',
    url: '/dashboard/royalties',
    steps: [
      'Import royalty statement file',
      'Review and match songs to catalog',
      'Allocate earnings to payees',
      'Generate detailed statements'
    ],
    time: '6 min'
  }
];

export const QuickStartGuide = () => {
  const { startTour } = useTour();
  const { isDemo, demoLimits } = useDemoAccess();
  const [openItems, setOpenItems] = useState<string[]>(['catalog-valuation']);

  if (!isDemo) return null;

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getUsageStatus = (moduleId: string) => {
    switch (moduleId) {
      case 'catalog-valuation':
        return demoLimits.catalogValuation.searches >= demoLimits.catalogValuation.maxSearches;
      case 'contracts':
        return demoLimits.contractManagement.contracts >= demoLimits.contractManagement.maxContracts;
      case 'copyright':
        return demoLimits.copyrightManagement.registrations >= demoLimits.copyrightManagement.maxRegistrations;
      case 'sync':
        return demoLimits.syncLicensing.licenses >= demoLimits.syncLicensing.maxLicenses;
      case 'royalties':
        return demoLimits.royaltiesProcessing.imports >= demoLimits.royaltiesProcessing.maxImports;
      default:
        return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Quick Start Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Try each module in the demo. You get one free action per module to explore the platform.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {QUICK_START_MODULES.map((module) => {
          const IconComponent = module.icon;
          const isUsed = getUsageStatus(module.id);
          
          return (
            <Collapsible
              key={module.id}
              open={openItems.includes(module.id)}
              onOpenChange={() => toggleItem(module.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isUsed ? 'bg-success/10' : 'bg-primary/10'}`}>
                      {isUsed ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <IconComponent className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium">{module.title}</h4>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isUsed ? 'default' : 'secondary'} className="text-xs">
                      {isUsed ? 'Completed' : module.time}
                    </Badge>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="px-3 pb-3">
                <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-3">
                  <h5 className="font-medium text-sm">Step-by-step instructions:</h5>
                  <ol className="space-y-1 text-sm text-muted-foreground">
                    {module.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full text-xs flex items-center justify-center mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTour(module.id)}
                      className="flex items-center gap-1"
                    >
                      <PlayCircle className="h-3 w-3" />
                      Interactive Guide
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      disabled={isUsed}
                    >
                      <Link to={module.url}>
                        {isUsed ? 'Completed' : 'Try Now'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Ready to unlock unlimited access? 
            <Button variant="link" className="h-auto p-0 ml-1 text-xs">
              Sign up for a free trial
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};