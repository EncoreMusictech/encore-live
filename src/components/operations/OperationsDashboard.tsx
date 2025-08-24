import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useOperationsData } from "@/hooks/useOperationsData";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DataSeedButton } from "./DataSeedButton";
import { OperationsTab } from "./tabs/OperationsTab";
import { CustomerSuccessTab } from "./tabs/CustomerSuccessTab";
import { SupportTab } from "./tabs/SupportTab";
import { FinancialTab } from "./tabs/FinancialTab";
import { SalesTab } from "./tabs/SalesTab";
import { MarketingTab } from "./tabs/MarketingTab";
import { EnterpriseTab } from "./tabs/EnterpriseTab";

export function OperationsDashboard() {
  const { metrics, customerHealth, supportTickets, loading, error, refreshData } = useOperationsData();
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

  // Define available tabs based on user roles or show all for admin
  const availableTabs = [
    { id: 'operations', label: 'Operations', roles: ['admin', 'operations'] },
    { id: 'customer-success', label: 'Customer Success', roles: ['admin', 'customer-success'] },
    { id: 'support', label: 'Support', roles: ['admin', 'support'] },
    { id: 'financial', label: 'Financial', roles: ['admin', 'financial'] },
    { id: 'sales', label: 'Sales', roles: ['admin', 'sales'] },
    { id: 'marketing', label: 'Marketing', roles: ['admin', 'marketing'] },
    { id: 'enterprise', label: 'Enterprise', roles: ['admin', 'enterprise'] },
  ].filter(tab => 
    hasRole('admin') || tab.roles.some(role => hasRole(role))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Role-based operations monitoring and management
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Role-based Tabs */}
      <Tabs defaultValue={availableTabs[0]?.id || 'operations'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          <OperationsTab metrics={metrics} refreshData={refreshData} />
        </TabsContent>

        <TabsContent value="customer-success" className="space-y-6">
          <CustomerSuccessTab metrics={metrics} customerHealth={customerHealth} />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <SupportTab metrics={metrics} supportTickets={supportTickets} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <SalesTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <MarketingTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="enterprise" className="space-y-6">
          <EnterpriseTab />
        </TabsContent>
      </Tabs>

      {/* Data Seeder for Development */}
      <DataSeedButton />
    </div>
  );
}