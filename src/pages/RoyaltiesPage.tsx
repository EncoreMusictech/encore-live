import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Music, DollarSign, Users, AlertTriangle } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { RoyaltyAllocationForm } from "@/components/royalties/RoyaltyAllocationForm";
import { RoyaltyAllocationList } from "@/components/royalties/RoyaltyAllocationList";

export default function RoyaltiesPage() {
  const [showForm, setShowForm] = useState(false);
  const { allocations, loading } = useRoyaltyAllocations();

  const totalRoyalties = allocations.reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
  const controlledWorks = allocations.filter(allocation => allocation.controlled_status === 'Controlled').length;
  const recoupableWorks = allocations.filter(allocation => allocation.recoupable_expenses).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Royalties Allocation</h1>
            <p className="text-muted-foreground mt-2">
              Map works and their rightsholders to reconciled revenue
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Allocation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allocations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controlled Works</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{controlledWorks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recoupable</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{recoupableWorks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Royalties</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRoyalties.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Royalty Allocation</CardTitle>
                <CardDescription>
                  Map a work to its rightsholders and reconciled revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoyaltyAllocationForm onCancel={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Royalty Allocations</CardTitle>
              <CardDescription>
                Manage work-to-rightholder mappings and revenue allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoyaltyAllocationList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}