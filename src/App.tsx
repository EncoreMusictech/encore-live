
import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminOrProtectedRoute from "@/components/AdminOrProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";

// Lazy load pages to avoid initialization issues
const Index = React.lazy(() => import("./pages/Index"));
const Auth = React.lazy(() => import("./pages/Auth"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const CatalogValuationPage = React.lazy(() => import("./pages/CatalogValuation"));
const DealSimulatorPage = React.lazy(() => import("./pages/DealSimulatorPage"));
const ModulesPage = React.lazy(() => import("./pages/ModulesPage"));
const DemoModulesPage = React.lazy(() => import("./pages/DemoModulesPage"));
const ContractManagement = React.lazy(() => import("./pages/ContractManagement"));
const CopyrightManagement = React.lazy(() => import("./pages/CopyrightManagement"));
const SyncLicensingPage = React.lazy(() => import("./pages/SyncLicensingPage"));
const SyncLicensingPreviewPage = React.lazy(() => import("./pages/SyncLicensingPreviewPage"));
const FeaturesPage = React.lazy(() => import("./pages/FeaturesPage"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));
const ReconciliationPage = React.lazy(() => import("./pages/ReconciliationPage"));
const RoyaltiesPage = React.lazy(() => import("./pages/RoyaltiesPage"));
const PayoutsPage = React.lazy(() => import("./pages/PayoutsPage"));
const ClientPortal = React.lazy(() => import("./components/ClientPortal"));
const ClientAdminPage = React.lazy(() => import("./pages/ClientAdminPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const DocumentationPage = React.lazy(() => import("./pages/DocumentationPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

const App: React.FC = () => {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <AuthProvider>
              <DemoAccessProvider>
                <DemoUpgradeModal />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/modules" element={<ModulesPage />} />
                  <Route path="/demo-modules" element={<DemoModulesPage />} />
                  <Route path="/features/:moduleId" element={<FeaturesPage />} />
                  <Route path="/catalog-valuation" element={<CatalogValuationPage />} />
                  <Route path="/deal-simulator" element={<DealSimulatorPage />} />
                  <Route path="/contract-management" element={<ContractManagement />} />
                  <Route path="/copyright-management" element={<CopyrightManagement />} />
                  <Route path="/sync-licensing" element={
                    <AdminOrProtectedRoute>
                      <SyncLicensingPage />
                    </AdminOrProtectedRoute>
                  } />
                  <Route path="/sync-licensing-preview" element={
                    <ProtectedRoute>
                      <SyncLicensingPreviewPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/reconciliation" element={<ReconciliationPage />} />
                  <Route path="/royalties" element={<RoyaltiesPage />} />
                  <Route path="/payouts" element={
                    <AdminOrProtectedRoute>
                      <PayoutsPage />
                    </AdminOrProtectedRoute>
                  } />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/documentation" element={<DocumentationPage />} />
                  <Route path="/client-portal" element={
                    <ProtectedRoute>
                      <ClientPortal />
                    </ProtectedRoute>
                  } />
                  <Route path="/client-admin" element={
                    <ProtectedRoute>
                      <ClientAdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Sonner />
              </DemoAccessProvider>
            </AuthProvider>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.Suspense>
  );
};

export default App;
