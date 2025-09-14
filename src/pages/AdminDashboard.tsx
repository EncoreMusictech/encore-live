import { Navigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubAccountManager } from '@/components/admin/SubAccountManager';
import { DataImportManager } from '@/components/admin/DataImportManager';
import { Users, Upload, Shield, Database } from 'lucide-react';

const AdminDashboard = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground">
            Super admin dashboard for ENCORE RMS platform management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active Management</div>
            <p className="text-xs text-muted-foreground">
              Manage platform sub-accounts and permissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Import</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CSV/PDF Processing</div>
            <p className="text-xs text-muted-foreground">
              Bulk import and migration tools
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">
              All systems running normally
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sub-accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sub-accounts" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Sub Account Management</span>
          </TabsTrigger>
          <TabsTrigger value="data-import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Data Import & Migration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sub-accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sub Account Management</CardTitle>
              <CardDescription>
                Manage platform sub-accounts, permissions, and access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubAccountManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Import & Migration</CardTitle>
              <CardDescription>
                Import existing rights management data via CSV or PDF upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataImportManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;