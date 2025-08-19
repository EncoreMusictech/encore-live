import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoAccessProvider } from "@/hooks/useDemoAccess";
import { ThemeProvider } from "@/components/ThemeProvider";
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
import DemoModulesPage from "./pages/DemoModulesPage";
import FeaturesPage from "./pages/FeaturesPage";
import UserCasePage from "./pages/UserCasePage";
import PricingPage from "./pages/PricingPage";
import ClientPortal from "./components/ClientPortal";
import ClientAdminPage from "./pages/ClientAdminPage";
import ContactPage from "./pages/ContactPage";
import DocumentationPage from "./pages/DocumentationPage";
import CRMPage from "./pages/CRMPage";
import CRMCatalogValuationPage from "./pages/CRMCatalogValuationPage";
import CRMContractsPage from "./pages/CRMContractsPage";
import CRMCopyrightPage from "./pages/CRMCopyrightPage";
import CRMSyncPage from "./pages/CRMSyncPage";
import CRMRoyaltiesPage from "./pages/CRMRoyaltiesPage";
import CRMClientsPage from "./pages/CRMClientsPage";


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
                    <TourProvider>
                      <TourOverlay />
                      <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route index element={<LandingPage />} />
                        <Route path="/home" element={<Index />} />
                        
                        {/* Dashboard Routes */}
                        <Route path="/dashboard" element={<CRMLayout />}>
                          <Route index element={<CRMPage />} />
                          <Route path="catalog-valuation" element={<CRMCatalogValuationPage />} />
                          <Route path="contracts" element={<CRMContractsPage />} />
                          <Route path="copyright" element={<CRMCopyrightPage />} />
                          <Route path="sync" element={<CRMSyncPage />} />
                          <Route path="royalties" element={<CRMRoyaltiesPage />} />
                          <Route path="client-admin" element={<CRMClientsPage />} />
                        </Route>
                        
                        {/* Client Portal - Accessible to invited clients */}
                        <Route path="/client-portal" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <ClientPortal />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
        {/* Legacy Routes - Redirects to CRM */}
                        <Route path="/demo-modules" element={<DemoModulesPage />} />
                        <Route path="/features/:moduleId" element={<FeaturesPage />} />
                        <Route path="/use-cases/:userCaseId" element={<UserCasePage />} />
                        
                        
                        
                        
                        <Route path="/sync-licensing-preview" element={<Navigate to="/dashboard/sync" replace />} />
                        <Route path="/reconciliation" element={<Navigate to="/dashboard/royalties" replace />} />
                        <Route path="/royalties" element={<Navigate to="/dashboard/royalties" replace />} />
                        <Route path="/payouts" element={<Navigate to="/dashboard/royalties" replace />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/documentation" element={<DocumentationPage />} />
                        <Route path="/client-admin" element={
                          <ProtectedRoute>
                            <EmailRestrictedRoute allowedEmails={["info@encoremusic.tech"]}>
                              <ErrorBoundary>
                                <ClientAdminPage />
                              </ErrorBoundary>
                            </EmailRestrictedRoute>
                          </ProtectedRoute>
        } />
        
        {/* Demo Routes */}
        
        
         {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                         <Route path="*" element={<NotFound />} />
                       </Routes>
                     </TourProvider>
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
