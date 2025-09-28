import React from "react";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { SavedValuationScenarios } from "@/components/saved-scenarios/SavedValuationScenarios";

const CRMSavedCatalogValuationPage = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking permissions...</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Saved Catalog Valuation Scenarios</h1>
        <p className="text-muted-foreground">
          Manage and analyze saved catalog valuation scenarios with comprehensive data and comparisons.
        </p>
      </div>
      
      <SavedValuationScenarios />
    </div>
  );
};

export default CRMSavedCatalogValuationPage;