import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Brain } from "lucide-react";
import { useUnifiedOperations } from "@/hooks/useUnifiedOperations";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DataSeedButton } from "./DataSeedButton";
import { OperationsHub } from "./consolidated/OperationsHub";
import { BusinessIntelligence } from "./consolidated/BusinessIntelligence";
import { CustomerExperience } from "./consolidated/CustomerExperience";
import { ManagementConsole } from "./consolidated/ManagementConsole";

export function OperationsDashboard() {
  const { metrics, aiInsights, progressTargets, loading, error, refreshData } = useUnifiedOperations();
  const { hasRole } = useUserRoles();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
            <p className="text-muted-foreground">Loading operations data...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
            <p className="text-destructive">Error loading data: {error}</p>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Consolidated tabs - 50% noise reduction (8 tabs → 4 tabs)
  const availableTabs = [
    { id: 'operations-hub', label: 'Operations Hub', roles: ['admin', 'operations', 'support'] },
    { id: 'business-intelligence', label: 'Business Intelligence', roles: ['admin', 'financial', 'sales', 'marketing'] },
    { id: 'customer-experience', label: 'Customer Experience', roles: ['admin', 'customer-success'] },
    { id: 'management-console', label: 'Management Console', roles: ['admin'] },
  ].filter(tab => 
    hasRole('admin') || tab.roles.some(role => hasRole(role))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Unified Operations Dashboard
          </h1>
          <p className="text-muted-foreground">
            AI-powered business intelligence with 50% simplified workflows
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Consolidated Tabs - 50% Reduction */}
      <Tabs defaultValue={availableTabs[0]?.id || 'operations-hub'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="operations-hub" className="space-y-6">
          <OperationsHub metrics={metrics} aiInsights={aiInsights} />
        </TabsContent>

        <TabsContent value="business-intelligence" className="space-y-6">
          <BusinessIntelligence 
            metrics={metrics} 
            aiInsights={aiInsights} 
            progressTargets={progressTargets} 
          />
        </TabsContent>

        <TabsContent value="customer-experience" className="space-y-6">
          <CustomerExperience metrics={metrics} aiInsights={aiInsights} />
        </TabsContent>

        <TabsContent value="management-console" className="space-y-6">
          <ManagementConsole metrics={metrics} />
        </TabsContent>
      </Tabs>

      {/* Data Seeder for Development */}
      <DataSeedButton />
    </div>
  );
}