import React from 'react';
import { ModuleWalkthroughPanel } from '@/components/ModuleWalkthroughPanel';
import DemoLimitBanner from '@/components/DemoLimitBanner';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ModuleWalkthroughsPage() {
  const { isDemo } = useDemoAccess();
  const navigate = useNavigate();

  if (!isDemo) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Demo Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Interactive walkthroughs are available for demo users to explore the platform features.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoLimitBanner module="walkthroughs" />
      
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <ModuleWalkthroughPanel />
      </div>
    </div>
  );
}