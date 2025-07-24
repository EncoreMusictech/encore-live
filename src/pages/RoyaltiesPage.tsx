import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Music, DollarSign, Users, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { Link } from "react-router-dom";
import { RoyaltyAllocationForm } from "@/components/royalties/RoyaltyAllocationForm";
import { RoyaltyAllocationList } from "@/components/royalties/RoyaltyAllocationList";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";
import { RoyaltiesImportStaging } from "@/components/royalties/RoyaltiesImportStaging";
import { RoyaltiesDiscrepancyReport } from "@/components/royalties/RoyaltiesDiscrepancyReport";
import { RoyaltiesAnalyticsDashboard } from "@/components/royalties/RoyaltiesAnalyticsDashboard";
export default function RoyaltiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("allocations");

  useEffect(() => {
    updatePageMetadata('royalties');
  }, []);
  const {
    allocations,
    loading
  } = useRoyaltyAllocations();
  const totalRoyalties = allocations.reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
  const controlledWorks = allocations.filter(allocation => allocation.controlled_status === 'Controlled').length;
  const recoupableWorks = allocations.filter(allocation => allocation.recoupable_expenses).length;
  return <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        {/* Back to Demo Modules */}
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

        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Royalties Management</h1>
            <p className="text-muted-foreground mt-2">
              Import statements, manage allocations, and process royalty distributions
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="statements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Statements
            </TabsTrigger>
            <TabsTrigger value="allocations" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Royalties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Discrepancies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statements" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Statements</h2>
                <p className="text-muted-foreground">
                  Import statements, map sources for auto-detection, and review data for approval and allocation
                </p>
              </div>
            </div>

            <RoyaltiesImportStaging />
          </TabsContent>

          <TabsContent value="allocations" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Royalties</h2>
                <p className="text-muted-foreground">
                  Map works and their rightsholders to reconciled revenue
                </p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Royalty
              </Button>
            </div>


            {/* Main Content */}
            <div className="space-y-6">
              {showForm && <Card>
                  <CardHeader>
                    <CardTitle>Create New Royalty</CardTitle>
                    <CardDescription>
                      Map a work to its rightsholders and reconciled revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoyaltyAllocationForm onCancel={() => setShowForm(false)} />
                  </CardContent>
                </Card>}

              <Card>
                <CardHeader>
                  <CardTitle>Royalties</CardTitle>
                  <CardDescription>
                    Manage work-to-rightholder mappings and revenue distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoyaltyAllocationList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <RoyaltiesAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="discrepancies" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Discrepancy Report</h2>
                <p className="text-muted-foreground">
                  Track unmatched songs, low confidence matches, and potential duplicates
                </p>
              </div>
            </div>

            <RoyaltiesDiscrepancyReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}