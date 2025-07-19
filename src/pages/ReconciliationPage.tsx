
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Link2 } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { ReconciliationBatchForm } from "@/components/royalties/ReconciliationBatchForm";
import { ReconciliationBatchList } from "@/components/royalties/ReconciliationBatchList";
import { BatchRoyaltyManager } from "@/components/royalties/BatchRoyaltyManager";
import { ReconciliationAnalytics } from "@/components/royalties/ReconciliationAnalytics";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";

export default function ReconciliationPage() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("batches");
  const { refreshBatches } = useReconciliationBatches();

  useEffect(() => {
    updatePageMetadata('reconciliation');
  }, []);

  const handleBatchCreated = () => {
    setShowForm(false);
    refreshBatches();
  };

  const handleLinkComplete = () => {
    refreshBatches();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reconciliation Management</h1>
            <p className="text-muted-foreground mt-2">
              Track and reconcile incoming royalty payments with your allocation records
            </p>
          </div>
          <div className="flex gap-2">
            <BatchRoyaltyManager onLinkComplete={handleLinkComplete} />
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Batch
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Reconciliation Batch</CardTitle>
              <CardDescription>
                Add a new batch to track incoming royalty payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReconciliationBatchForm onCancel={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batches" className="gap-2">
              <Link2 className="h-4 w-4" />
              Batches
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Batches</CardTitle>
                <CardDescription>
                  Manage your incoming royalty payment batches and track reconciliation progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReconciliationBatchList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <ReconciliationAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Reports</CardTitle>
                <CardDescription>
                  Generate detailed reports on your reconciliation performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Reports Coming Soon</p>
                  <p>Comprehensive reconciliation reports will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
