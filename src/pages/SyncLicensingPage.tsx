import { useState, useEffect } from "react";
import { Plus, Filter, LayoutGrid, Calendar, List, ArrowLeft } from "lucide-react";
import { updatePageMetadata } from "@/utils/seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { SyncLicenseForm } from "@/components/sync-licensing/SyncLicenseForm";
import { SyncLicenseTable } from "@/components/sync-licensing/SyncLicenseTable";
import { SyncLicenseKanban } from "@/components/sync-licensing/SyncLicenseKanban";
import { SyncLicenseCalendar } from "@/components/sync-licensing/SyncLicenseCalendar";
import { SyncLicenseDashboard } from "@/components/sync-licensing/SyncLicenseDashboard";
import { useSyncLicenses } from "@/hooks/useSyncLicenses";

const SyncLicensingPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "calendar">("table");
  const { data: syncLicenses = [], isLoading } = useSyncLicenses();
  const { subscribed } = useSubscription();
  
  // Only show demo navigation for non-subscribers
  const showDemoNavigation = !subscribed;

  useEffect(() => {
    updatePageMetadata('syncLicensing');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Inquiry":
        return "bg-blue-100 text-blue-800";
      case "Negotiating":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "Licensed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalControlledAmount = (license: any) => {
    if (!license.fee_allocations || !Array.isArray(license.fee_allocations)) {
      return 0;
    }
    return license.fee_allocations.reduce((total: number, allocation: any) => {
      return total + (allocation.controlledAmount || 0);
    }, 0);
  };

  const getStatsFromLicenses = () => {
    const totalDeals = syncLicenses.length;
    const activeDeals = syncLicenses.filter(
      license => !["Declined"].includes(license.synch_status)
    ).length;
    const outstandingInvoices = syncLicenses
      .filter(license => license.invoice_status === "Issued" && license.payment_status === "Pending")
      .reduce((sum, license) => sum + (license.invoiced_amount || 0), 0);
    const paidDealsAmount = syncLicenses
      .filter(license => license.payment_status === "Paid in Full")
      .reduce((sum, license) => sum + calculateTotalControlledAmount(license), 0);

    return { totalDeals, activeDeals, totalRevenue: outstandingInvoices, paidDeals: paidDealsAmount };
  };

  const stats = getStatsFromLicenses();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sync Licensing Tracker</h1>
            <p className="text-muted-foreground mt-2">
              Manage your sync licensing deals from inquiry to payment
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Sync Request
          </Button>
        </div>

        {/* Dashboard Stats */}
        <SyncLicenseDashboard stats={stats} />

        {/* Main Content */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Sync Deals</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" && (
              <SyncLicenseTable licenses={syncLicenses} isLoading={isLoading} />
            )}
            {viewMode === "kanban" && (
              <SyncLicenseKanban licenses={syncLicenses} isLoading={isLoading} />
            )}
            {viewMode === "calendar" && (
              <SyncLicenseCalendar licenses={syncLicenses} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>

        {/* New Sync License Form Dialog */}
        <SyncLicenseForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </div>
    </div>
  );
};

export default SyncLicensingPage;