import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminOrProtectedRoute from "@/components/AdminOrProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SecurityProvider } from "@/components/SecurityProvider";
import EmailRestrictedRoute from "@/components/EmailRestrictedRoute";
import { CRMLayout } from "@/components/crm/CRMLayout";
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
    <ErrorBoundary>
      <QueryClientProvider client={getQueryClient()}>
        <SecurityProvider>
          <AuthProvider>
            <DemoAccessProvider>
              <ThemeProvider defaultTheme="dark" storageKey="encore-ui-theme">
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <DemoUpgradeModal />
                <BrowserRouter>
                  <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              
              {/* CRM Routes */}
              <Route path="/crm" element={<CRMLayout />}>
                <Route index element={<div>CRM Dashboard</div>} />
                <Route path="catalog-valuation" element={<div>Catalog Valuation</div>} />
                <Route path="contracts" element={<div>Contracts</div>} />
                <Route path="copyright" element={<div>Copyright</div>} />
                <Route path="sync" element={<div>Sync</div>} />
                <Route path="royalties" element={<div>Royalties</div>} />
                <Route path="clients" element={<div>Clients</div>} />
              </Route>
              <Route path="/modules" element={<ModulesPage />} />
              <Route path="/demo-modules" element={<DemoModulesPage />} />
              <Route path="/features/:moduleId" element={<FeaturesPage />} />
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
                <AdminOrProtectedRoute>
                  <ErrorBoundary>
                    <SyncLicensingPage />
                  </ErrorBoundary>
                </AdminOrProtectedRoute>
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
                <AdminOrProtectedRoute>
                  <ErrorBoundary>
                    <PayoutsPage />
                  </ErrorBoundary>
                </AdminOrProtectedRoute>
              } />
               <Route path="/pricing" element={<PricingPage />} />
               <Route path="/contact" element={<ContactPage />} />
               <Route path="/documentation" element={<DocumentationPage />} />
              <Route path="/client-portal" element={
                <AdminOrProtectedRoute>
                  <ErrorBoundary>
                    <ClientPortal />
                  </ErrorBoundary>
                </AdminOrProtectedRoute>
              } />
              <Route path="/client-admin" element={
                <ProtectedRoute>
                  <EmailRestrictedRoute allowedEmails={["info@encoremusic.tech"]}>
                    <ErrorBoundary>
                      <ClientAdminPage />
                    </ErrorBoundary>
                  </EmailRestrictedRoute>
                </ProtectedRoute>
              } />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
              </ThemeProvider>
            </DemoAccessProvider>
          </AuthProvider>
        </SecurityProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
