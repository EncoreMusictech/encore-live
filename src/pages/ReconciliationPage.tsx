import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, FileText, DollarSign } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { ReconciliationBatchForm } from "@/components/royalties/ReconciliationBatchForm";
import { ReconciliationBatchList } from "@/components/royalties/ReconciliationBatchList";

import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";

export default function ReconciliationPage() {
  const [showForm, setShowForm] = useState(false);
  const { batches, loading } = useReconciliationBatches();

  const totalGrossAmount = batches.reduce((sum, batch) => sum + batch.total_gross_amount, 0);
  const pendingBatches = batches.filter(batch => batch.status === 'Pending').length;
  const processedBatches = batches.filter(batch => batch.status === 'Processed').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reconciliation - Batches</h1>
            <p className="text-muted-foreground mt-2">
              Track incoming royalty payments from DSPs, PROs, YouTube, and other sources
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Batch
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Upload className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingBatches}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{processedBatches}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalGrossAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showForm && (
            <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Batches</CardTitle>
              <CardDescription>
                Manage your incoming royalty payment batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReconciliationBatchList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}