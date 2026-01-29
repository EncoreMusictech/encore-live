import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientsManager } from '@/components/hierarchy/ClientsManager';
import { useUserCompany } from '@/hooks/useUserCompany';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';

const ClientManagementPage = () => {
  const navigate = useNavigate();
  const { userCompany, loading: companyLoading, isPublishingFirm } = useUserCompany();
  const { childCompanies, loading: hierarchyLoading } = useClientHierarchy(userCompany?.id);

  // Update page metadata
  useEffect(() => {
    document.title = 'Client Management | Encore';
  }, []);

  if (companyLoading || hierarchyLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't belong to a company
  if (!userCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage your client labels</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Company Found</AlertTitle>
          <AlertDescription>
            You are not currently associated with any company. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user's company is not a publishing firm
  if (!isPublishingFirm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage your client labels</p>
          </div>
        </div>

        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertTitle>Publishing Firm Required</AlertTitle>
          <AlertDescription>
            Client management is available for publishing firms. Your account ({userCompany.display_name}) 
            is currently set as a "{userCompany.company_type || 'standard'}" account. 
            Contact your administrator to upgrade to a publishing firm account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Client Management
          </h1>
          <p className="text-muted-foreground">
            Manage client labels under {userCompany.display_name}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary">
              {childCompanies.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-emerald-600">
              {userCompany.display_name}
            </div>
            <p className="text-sm text-muted-foreground">Your Company</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold capitalize">
              {userCompany.company_type?.replace('_', ' ') || 'Standard'}
            </div>
            <p className="text-sm text-muted-foreground">Account Type</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Labels Manager */}
      <ClientsManager 
        parentCompanyId={userCompany.id} 
        parentCompanyName={userCompany.display_name} 
      />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Client Labels</CardTitle>
          <CardDescription>
            Understanding how client labels work in your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">What are Client Labels?</h4>
              <p className="text-sm text-muted-foreground">
                Client labels are separate accounts under your publishing firm. Each client label 
                has its own isolated data for copyrights, contracts, and royalties.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Data Isolation</h4>
              <p className="text-sm text-muted-foreground">
                When you create a client label, their works, contracts, and financial data 
                are kept separate while still being managed under your firm.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManagementPage;
