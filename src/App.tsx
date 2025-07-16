import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/modules" element={
              <ProtectedRoute>
                <ModulesPage />
              </ProtectedRoute>
            } />
            <Route path="/catalog-valuation" element={
              <ProtectedRoute>
                <CatalogValuationPage />
              </ProtectedRoute>
            } />
            <Route path="/deal-simulator" element={
              <ProtectedRoute>
                <DealSimulatorPage />
              </ProtectedRoute>
            } />
            <Route path="/contract-management" element={
              <ProtectedRoute>
                <ContractManagement />
              </ProtectedRoute>
            } />
            <Route path="/copyright-management" element={
              <ProtectedRoute>
                <CopyrightManagement />
              </ProtectedRoute>
            } />
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
            <Route path="/reconciliation" element={
              <ProtectedRoute>
                <ReconciliationPage />
              </ProtectedRoute>
            } />
            <Route path="/royalties" element={
              <ProtectedRoute>
                <RoyaltiesPage />
              </ProtectedRoute>
            } />
            <Route path="/payouts" element={
              <ProtectedRoute>
                <PayoutsPage />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
