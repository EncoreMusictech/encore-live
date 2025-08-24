import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseCommandCenter } from "../phase5/EnterpriseCommandCenter";
import { MLOperationsCenter } from "../phase5/MLOperationsCenter";
import { GlobalOperationsManager } from "../phase5/GlobalOperationsManager";
import { IntelligentResourceOptimizer } from "../phase5/IntelligentResourceOptimizer";
import { AdvancedComplianceDashboard } from "../phase5/AdvancedComplianceDashboard";
import { StrategicPlanningEngine } from "../phase5/StrategicPlanningEngine";
import { Building, Crown, Zap } from "lucide-react";

export function EnterpriseTab() {
  return (
    <div className="space-y-6">
      {/* Enterprise Overview Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="mr-2 h-6 w-6 text-primary" />
            Enterprise Command & Control Center
          </CardTitle>
          <CardDescription className="text-lg">
            Phase 5: Advanced enterprise-grade operations management with AI-powered insights, 
            global coordination, and strategic planning capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Global Operations</p>
                <p className="text-xs text-muted-foreground">Multi-region coordination</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">AI-Powered Insights</p>
                <p className="text-xs text-muted-foreground">Machine learning operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Strategic Planning</p>
                <p className="text-xs text-muted-foreground">Long-term optimization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Command Center */}
      <EnterpriseCommandCenter />

      {/* Phase 5 Advanced Components Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ML Operations Center */}
        <MLOperationsCenter />

        {/* Global Operations Manager */}
        <GlobalOperationsManager />
      </div>

      {/* Resource Optimization & Compliance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Intelligent Resource Optimizer */}
        <IntelligentResourceOptimizer />

        {/* Advanced Compliance Dashboard */}
        <AdvancedComplianceDashboard />
      </div>

      {/* Strategic Planning Engine */}
      <StrategicPlanningEngine />
    </div>
  );
}