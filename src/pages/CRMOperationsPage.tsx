import { OperationsDashboard } from "@/components/operations/OperationsDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useUserCompany } from "@/hooks/useUserCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";

export default function CRMOperationsPage() {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRoles();
  const { userCompany, loading: companyLoading, canManageClients } = useUserCompany();

  // Check if user has ENCORE admin access
  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
  const isAdministrator = adminEmails.includes(user?.email?.toLowerCase() || '') || isAdmin;

  if (loading || companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading operations dashboard...</p>
        </div>
      </div>
    );
  }

  // ENCORE admins see the full operations dashboard
  if (isAdministrator) {
    return <OperationsDashboard />;
  }

  // Sub-account users (publishing firms) see their client management view
  if (canManageClients && userCompany) {
    return <Navigate to={`/dashboard/operations/sub-accounts/${userCompany.id}`} replace />;
  }

  // Non-admin, non-publishing-firm users see access denied
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Operations Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Access to the Operations Dashboard is restricted to ENCORE administrators and operations team members.
          </p>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
