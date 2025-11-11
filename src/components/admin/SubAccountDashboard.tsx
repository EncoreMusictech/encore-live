import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Building2, Eye, Settings, Shield } from 'lucide-react';
import { CreateSubAccountDialog } from './CreateSubAccountDialog';
import { ManageSubAccountUsersDialog } from './ManageSubAccountUsersDialog';
import { ManageSubAccountModulesDialog } from './ManageSubAccountModulesDialog';

interface Company {
  id: string;
  name: string;
  display_name: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  user_count?: number;
  module_count?: number;
}

export function SubAccountDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch user counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count: userCount } = await supabase
            .from('company_users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('status', 'active');

          const { count: moduleCount } = await supabase
            .from('company_module_access')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('enabled', true);

          return {
            ...company,
            user_count: userCount || 0,
            module_count: moduleCount || 0,
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sub-accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const newStatus = company.subscription_status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: newStatus })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Sub-account ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });

      fetchCompanies();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-account status',
        variant: 'destructive',
      });
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.subscription_status === 'active').length,
    inactive: companies.filter((c) => c.subscription_status === 'inactive').length,
    totalUsers: companies.reduce((sum, c) => sum + (c.user_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sub-Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Accounts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sub-Account Management</CardTitle>
              <CardDescription>Create and manage sub-accounts with module access control</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sub-Account
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, email, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No sub-accounts found matching your search' : 'No sub-accounts yet'}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground">{company.display_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{company.contact_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.subscription_tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {company.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {company.user_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {company.module_count || 0}
                        </div>
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `/dashboard/operations/sub-accounts/${company.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateSubAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchCompanies}
      />

      {selectedCompany && (
        <>
          <ManageSubAccountUsersDialog
            open={usersDialogOpen}
            onOpenChange={setUsersDialogOpen}
            company={selectedCompany}
            onSuccess={fetchCompanies}
          />
          <ManageSubAccountModulesDialog
            open={modulesDialogOpen}
            onOpenChange={setModulesDialogOpen}
            company={selectedCompany}
            onSuccess={fetchCompanies}
          />
        </>
      )}
    </div>
  );
}
