
import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Import providers
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";

// Import route components
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminOrProtectedRoute from "@/components/AdminOrProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CatalogValuationPage from "./pages/CatalogValuation";
import DealSimulatorPage from "./pages/DealSimulatorPage";
import ModulesPage from "./pages/ModulesPage";
import DemoModulesPage from "./pages/DemoModulesPage";
import ContractManagement from "./pages/ContractManagement";
import CopyrightManagement from "./pages/CopyrightManagement";
import SyncLicensingPage from "./pages/SyncLicensingPage";
import SyncLicensingPreviewPage from "./pages/SyncLicensingPreviewPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ReconciliationPage from "./pages/ReconciliationPage";
import RoyaltiesPage from "./pages/RoyaltiesPage";
import PayoutsPage from "./pages/PayoutsPage";
import ClientPortal from "./components/ClientPortal";
import ClientAdminPage from "./pages/ClientAdminPage";
import ContactPage from "./pages/ContactPage";
import DocumentationPage from "./pages/DocumentationPage";

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <AuthProvider>
              <DemoAccessProvider>
                <AppContent />
                <Sonner />
              </DemoAccessProvider>
            </AuthProvider>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Separate component to use hooks after providers are set up
const AppContent: React.FC = () => {
  return (
    <>
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
    </>
  );
};

export default App;
