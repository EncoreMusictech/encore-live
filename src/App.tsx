import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import ProtectedRoute from "@/components/ProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SecurityProvider } from "@/components/SecurityProvider";
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
import ClientPortal from "./components/ClientPortal";
import ClientAdminPage from "./pages/ClientAdminPage";
import ContactPage from "./pages/ContactPage";

// Create a stable QueryClient instance
let queryClient: QueryClient | null = null;
const getQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: 2,
        },
      },
    });
  }
  return queryClient;
};

const App = () => {
  return (
  <QueryClientProvider client={getQueryClient()}>
    <SecurityProvider>
      <AuthProvider>
        <DemoAccessProvider>
          <ErrorBoundary>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <DemoUpgradeModal />
            <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/modules" element={<ModulesPage />} />
              <Route path="/catalog-valuation" element={
                <ErrorBoundary>
                  <CatalogValuationPage />
                </ErrorBoundary>
              } />
              <Route path="/deal-simulator" element={
                <ErrorBoundary>
                  <DealSimulatorPage />
                </ErrorBoundary>
              } />
              <Route path="/contract-management" element={
                <ErrorBoundary>
                  <ContractManagement />
                </ErrorBoundary>
              } />
              <Route path="/copyright-management" element={
                <ErrorBoundary>
                  <CopyrightManagement />
                </ErrorBoundary>
              } />
              <Route path="/sync-licensing" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <SyncLicensingPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/sync-licensing-preview" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <SyncLicensingPreviewPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reconciliation" element={
                <ErrorBoundary>
                  <ReconciliationPage />
                </ErrorBoundary>
              } />
              <Route path="/royalties" element={
                <ErrorBoundary>
                  <RoyaltiesPage />
                </ErrorBoundary>
              } />
              <Route path="/payouts" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PayoutsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/client-portal" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ClientPortal />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/client-admin" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ClientAdminPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </ErrorBoundary>
      </DemoAccessProvider>
    </AuthProvider>
    </SecurityProvider>
  </QueryClientProvider>
  );
};

export default App;
