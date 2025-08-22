import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { modules } from '@/data/modules';
import { useTour } from '@/components/tour/TourProvider';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { useNavigate } from 'react-router-dom';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  FileText,
  Copyright,
  Film,
  DollarSign,
  Users,
  LayoutDashboard
} from 'lucide-react';

const walkthroughData = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Get familiar with the main dashboard and navigate between modules',
    icon: LayoutDashboard,
    duration: '3-4 mins',
    steps: 7,
    difficulty: 'Beginner',
    path: '/dashboard'
  },
  {
    id: 'catalog-valuation',
    title: 'Catalog Valuation & Deal Analysis',
    description: 'Complete workflow for AI-powered valuations, deal modeling, and scenario analysis',
    icon: TrendingUp,
    duration: '8-10 mins',
    steps: 34,
    difficulty: 'Comprehensive',
    path: '/dashboard/catalog-valuation',
    featured: true
  },
  {
    id: 'contracts',
    title: 'Contract Management',
    description: 'Create and manage publishing agreements, artist contracts, and licensing deals',
    icon: FileText,
    duration: '2-3 mins',
    steps: 4,
    difficulty: 'Beginner',
    path: '/dashboard/contracts'
  },
  {
    id: 'copyright',
    title: 'Copyright Registration',
    description: 'Register musical works, define splits, and manage PRO submissions',
    icon: Copyright,
    duration: '2-3 mins',
    steps: 4,
    difficulty: 'Beginner',
    path: '/dashboard/copyright'
  },
  {
    id: 'sync',
    title: 'Sync Licensing Tracker',
    description: 'Track sync opportunities, manage deals, and generate invoices',
    icon: Film,
    duration: '2-3 mins',
    steps: 4,
    difficulty: 'Beginner',
    path: '/dashboard/sync'
  },
  {
    id: 'royalties',
    title: 'Royalty Processing',
    description: 'Import statements, reconcile data, allocate payments, and generate reports',
    icon: DollarSign,
    duration: '2-3 mins',
    steps: 4,
    difficulty: 'Beginner',
    path: '/dashboard/royalties'
  }
];

export const ModuleWalkthroughPanel = () => {
  const { startTour } = useTour();
  const { isDemo } = useDemoAccess();
  const navigate = useNavigate();

  if (!isDemo) return null;

  const handleStartWalkthrough = (walkthroughId: string, path: string) => {
    if (window.location.pathname !== path) {
      navigate(path);
      // Wait a moment for navigation to complete before starting tour
      setTimeout(() => {
        startTour(walkthroughId);
      }, 500);
    } else {
      startTour(walkthroughId);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Comprehensive': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Interactive Module Walkthroughs
        </h2>
        <p className="text-muted-foreground">
          Learn how to use each module with step-by-step guided tours
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {walkthroughData.map((walkthrough) => {
          const IconComponent = walkthrough.icon;
          
          return (
            <Card 
              key={walkthrough.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                walkthrough.featured 
                  ? 'ring-2 ring-primary/20 bg-gradient-to-br from-background to-primary/5' 
                  : ''
              }`}
            >
              {walkthrough.featured && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary text-primary-foreground">
                    Featured
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{walkthrough.title}</CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {walkthrough.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {walkthrough.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {walkthrough.steps} steps
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={getDifficultyColor(walkthrough.difficulty)}
                  >
                    {walkthrough.difficulty}
                  </Badge>
                </div>

                <Button
                  onClick={() => handleStartWalkthrough(walkthrough.id, walkthrough.path)}
                  className="w-full"
                  variant={walkthrough.featured ? "default" : "outline"}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Walkthrough
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <h3 className="font-semibold text-foreground mb-2">
          💡 How to Get the Most from These Walkthroughs
        </h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Start with the <strong>Dashboard Overview</strong> to understand navigation</p>
          <p>• Try the <strong>Catalog Valuation</strong> walkthrough for the most comprehensive experience</p>
          <p>• Each walkthrough can be paused, restarted, or skipped at any time</p>
          <p>• Walkthroughs automatically navigate between pages when needed</p>
        </div>
      </div>
    </div>
  );
};