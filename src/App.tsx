import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import ProtectedRoute from "@/components/ProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CatalogValuationPage from "./pages/CatalogValuation";
import DealSimulatorPage from "./pages/DealSimulatorPage";
import ModulesPage from "./pages/ModulesPage";
import ContractManagement from "./pages/ContractManagement";
import CopyrightManagement from "./pages/CopyrightManagement";
import SyncLicensingPage from "./pages/SyncLicensingPage";
import SyncLicensingPreviewPage from "./pages/SyncLicensingPreviewPage";
import PricingPage from "./pages/PricingPage";
import ReconciliationPage from "./pages/ReconciliationPage";
import RoyaltiesPage from "./pages/RoyaltiesPage";
import PayoutsPage from "./pages/PayoutsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoAccessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DemoUpgradeModal />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/catalog-valuation" element={<CatalogValuationPage />} />
            <Route path="/deal-simulator" element={<DealSimulatorPage />} />
            <Route path="/contract-management" element={<ContractManagement />} />
            <Route path="/copyright-management" element={<CopyrightManagement />} />
            <Route path="/sync-licensing" element={
              <ProtectedRoute>
                <SyncLicensingPage />
              </ProtectedRoute>
            } />
            <Route path="/sync-licensing-preview" element={
              <ProtectedRoute>
                <SyncLicensingPreviewPage />
              </ProtectedRoute>
            } />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/royalties" element={<RoyaltiesPage />} />
            <Route path="/payouts" element={
              <ProtectedRoute>
                <PayoutsPage />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={<PricingPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </DemoAccessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
