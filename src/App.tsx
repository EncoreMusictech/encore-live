import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TenantProvider } from "@/contexts/TenantContext";
import { WhitelabelThemeProvider } from "@/components/WhitelabelThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminOrProtectedRoute from "@/components/AdminOrProtectedRoute";
import DemoUpgradeModal from "@/components/DemoUpgradeModal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SecurityProvider } from "@/components/SecurityProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourOverlay } from "@/components/tour/TourOverlay";
import EmailRestrictedRoute from "@/components/EmailRestrictedRoute";
import { CRMLayout } from "@/components/crm/CRMLayout";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";


import UserCasePage from "./pages/UserCasePage";
import PricingPage from "./pages/PricingPage";
import ClientPortal from "./components/ClientPortal";

import ContactPage from "./pages/ContactPage";
import DocumentationPage from "./pages/DocumentationPage";
import CRMPage from "./pages/CRMPage";
import CRMCatalogValuationPage from "./pages/CRMCatalogValuationPage";
import LuminateCatalogTestPage from "./pages/LuminateCatalogTestPage";
import CRMContractsPage from "./pages/CRMContractsPage";
import CRMCopyrightPage from "./pages/CRMCopyrightPage";
import CRMSyncPage from "./pages/CRMSyncPage";
import CRMRoyaltiesPage from "./pages/CRMRoyaltiesPage";
import CRMClientsPage from "./pages/CRMClientsPage";
import CRMOperationsPage from "./pages/CRMOperationsPage";
import CRMBlockchainPage from "./pages/CRMBlockchainPage";
import FeaturesOverviewPage from "./pages/FeaturesOverviewPage";
import ModuleWalkthroughsPage from "./pages/ModuleWalkthroughsPage";
import WhitelabelDashboard from "./pages/WhitelabelDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RecoveryRedirect from "@/components/RecoveryRedirect";
import TermsAndConditions from "./pages/TermsAndConditions";



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
              <TenantProvider>
                <WhitelabelThemeProvider>
                    <TooltipProvider>
                       <Toaster />
                       <Sonner />
                       <DemoUpgradeModal />
                       <BrowserRouter>
                         <TourProvider>
                           <TourOverlay />
                           <RecoveryRedirect />
                           <Routes>
                             <Route path="/auth" element={<Auth />} />
                             <Route index element={<Index />} />
                              
                              {/* Redirect old admin route to new location */}
                              <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
                              
                              {/* Dashboard Routes */}
                              <Route path="/dashboard" element={<CRMLayout />}>
                                <Route index element={<CRMPage />} />
                                <Route path="catalog-valuation" element={<CRMCatalogValuationPage />} />
                                <Route path="luminate-test" element={<LuminateCatalogTestPage />} />
                                <Route path="contracts" element={<CRMContractsPage />} />
                                <Route path="copyright" element={<CRMCopyrightPage />} />
                                <Route path="sync" element={<CRMSyncPage />} />
                                <Route path="royalties" element={<CRMRoyaltiesPage />} />
                                <Route path="client-admin" element={<CRMClientsPage />} />
                                <Route path="operations" element={<CRMOperationsPage />} />
                                <Route path="blockchain" element={<CRMBlockchainPage />} />
                                <Route path="walkthroughs" element={<ModuleWalkthroughsPage />} />
                                <Route path="admin" element={<AdminDashboard />} />
                              </Route>
                             
                              {/* Client Portal - Accessible to invited clients */}
                              <Route path="/client-portal" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <ClientPortal />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              
                              {/* Terms and Conditions - Required for new users */}
                              <Route path="/terms" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <TermsAndConditions />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              
                              {/* Features Routes */}
                             <Route path="/features" element={<FeaturesOverviewPage />} />
                             
                             
                             <Route path="/use-cases/:userCaseId" element={<UserCasePage />} />
                             
                             
                             
                             
                             
                             
                             
                             
                             <Route path="/pricing" element={<PricingPage />} />
                             <Route path="/contact" element={<ContactPage />} />
                             <Route path="/documentation" element={<DocumentationPage />} />
                              <Route path="/whitelabel" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <WhitelabelDashboard />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                             
                             {/* Demo Routes */}
                             
                             
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                           </Routes>
                         </TourProvider>
                       </BrowserRouter>
                     </TooltipProvider>
                 </WhitelabelThemeProvider>
              </TenantProvider>
            </DemoAccessProvider>
          </AuthProvider>
        </SecurityProvider>
       </QueryClientProvider>
     </ErrorBoundary>
   );
 };
 
 export default App;
