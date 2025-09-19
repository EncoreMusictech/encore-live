import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubAccountManager } from '@/components/admin/SubAccountManager';
import { DataImportManager } from '@/components/admin/DataImportManager';
import { Users, Upload, Shield, Database } from 'lucide-react';

const AdminDashboard = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState('sub-accounts');

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
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sub-Accounts Management</h1>
          <p className="text-muted-foreground">
            Manage sub-accounts, team members, modules, and customer data migration
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Admin Navigation</CardTitle>
              <CardDescription>Quick access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('sub-accounts')}
                className={`w-full text-left px-3 py-2 rounded-md transition border ${activeTab === 'sub-accounts' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Sub Account Management
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data-import')}
                className={`w-full text-left px-3 py-2 rounded-md transition border ${activeTab === 'data-import' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
              >
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Data Import & Migration
                </span>
              </button>
            </CardContent>
          </Card>
        </aside>

        <div className="md:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:hidden">
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
              <SubAccountManager />
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
      </div>
    </div>
  );
};

export default AdminDashboard;