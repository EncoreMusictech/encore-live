
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Link2, ArrowLeft } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useSearchParams } from "react-router-dom";
import { ReconciliationBatchForm } from "@/components/royalties/ReconciliationBatchForm";
import { ReconciliationBatchList } from "@/components/royalties/ReconciliationBatchList";
import { ReconciliationAnalytics } from "@/components/royalties/ReconciliationAnalytics";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";
import { useTour } from "@/hooks/useTour";

export default function ReconciliationPage() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("batches");
  const { refreshBatches } = useReconciliationBatches();
  const { subscribed } = useSubscription();
  
  // Only show demo navigation for non-subscribers
  const showDemoNavigation = !subscribed;

  useEffect(() => {
    updatePageMetadata('reconciliation');
  }, []);

  const { startTour } = useTour();
  const [searchParams] = useSearchParams();
  const steps = [
    { target: "[data-tour='recon-title']", content: "Manage reconciliation batches and analytics." },
    { target: "[data-tour='recon-new-batch']", content: "Create a new reconciliation batch." },
    { target: "[data-tour='recon-tabs']", content: "Switch between Batches and Analytics." },
    { target: "[data-tour='recon-batch-list']", content: "Your batches appear here." },
  ];

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      startTour(steps);
    }
  }, [searchParams, startTour]);

  const handleBatchCreated = () => {
    setShowForm(false);
    refreshBatches();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        {/* Back to Demo Modules - Only show for non-subscribers */}
        {showDemoNavigation && (
          <div className="flex items-center gap-2 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="/demo-modules">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Demo Modules
              </Link>
            </Button>
          </div>
        )}

        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-tour="recon-title">Reconciliation Management</h1>
            <p className="text-muted-foreground mt-2">
              Track and reconcile incoming royalty payments with your allocation records
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)} className="gap-2" data-tour="recon-new-batch">
              <Plus className="h-4 w-4" />
              New Batch
            </Button>
            <Button variant="outline" size="sm" onClick={() => startTour(steps)}>Start Tour</Button>
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
          <TabsList className="grid w-full grid-cols-2" data-tour="recon-tabs">
            <TabsTrigger value="batches" className="gap-2">
              <Link2 className="h-4 w-4" />
              Batches
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batches">
            <Card data-tour="recon-batch-list">
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
        </Tabs>
      </div>
    </div>
  );
}
