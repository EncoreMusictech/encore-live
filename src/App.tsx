import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleProtectedRoute from "@/components/ModuleProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import CatalogValuationPage from "./pages/CatalogValuation";
import DealSimulatorPage from "./pages/DealSimulatorPage";
import ModulesPage from "./pages/ModulesPage";
import ContractManagement from "./pages/ContractManagement";
import CopyrightManagement from "./pages/CopyrightManagement";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route 
              path="/catalog-valuation" 
              element={
                <ProtectedRoute>
                  <ModuleProtectedRoute moduleId="catalog-valuation" moduleName="Catalog Valuation">
                    <CatalogValuationPage />
                  </ModuleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/deal-simulator" 
              element={
                <ProtectedRoute>
                  <ModuleProtectedRoute moduleId="deal-simulator" moduleName="Deal Simulator">
                    <DealSimulatorPage />
                  </ModuleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contract-management" 
              element={
                <ProtectedRoute>
                  <ModuleProtectedRoute moduleId="contract-management" moduleName="Contract Management">
                    <ContractManagement />
                  </ModuleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/copyright-management" 
              element={
                <ProtectedRoute>
                  <ModuleProtectedRoute moduleId="copyright-management" moduleName="Copyright Management">
                    <CopyrightManagement />
                  </ModuleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
