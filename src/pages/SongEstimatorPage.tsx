import React from 'react';
import Header from "@/components/Header";
import { SongEstimatorTool } from "@/components/catalog-valuation/SongEstimatorTool";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useSubscription } from "@/hooks/useSubscription";

export default function SongEstimatorPage() {
  const { canAccess } = useDemoAccess();
  const { subscribed } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {!subscribed && <DemoLimitBanner module="catalogValuation" />}
        
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Song Estimator Tool</h1>
            <p className="text-muted-foreground text-lg">
              Research songwriter catalogs, analyze metadata completeness, and estimate uncollected royalty pipeline income using AI-powered analysis.
            </p>
          </div>

          {/* Song Estimator Tool */}
          <SongEstimatorTool />
        </div>
      </div>
    </div>
  );
}