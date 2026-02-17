import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Filter, Settings, Upload, FileText, Users, Building2, Plus, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Company {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  contact_email: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_end: string | null;
  created_at: string;
  user_count?: number;
  module_access?: any;
}

interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  user_email?: string;
  user_name?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
}

interface CompanyModuleAccess {
  id: string;
  company_id: string;
  module_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const SubAccountManager = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [moduleAccess, setModuleAccess] = useState<CompanyModuleAccess[]>([]);
  const [totalSystemUsers, setTotalSystemUsers] = useState<number>(0);
  const [pendingMigrations, setPendingMigrations] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    display_name: '',
    contact_email: '',
    subscription_tier: 'basic'
  });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showManageModules, setShowManageModules] = useState(false);
  const [companyModules, setCompanyModules] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch companies data
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch user counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('company_users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          
          return {
            ...company,
            user_count: count || 0
          };
        })
      );

      setCompanies(companiesWithCounts);

      // Fetch company users with company details
      const { data: usersData, error: usersError } = await supabase
        .from('company_users')
        .select(`
          *,
          companies(name, display_name)
        `)
        .order('joined_at', { ascending: false });

      if (usersError) throw usersError;

      // Get user details (names and emails) from edge function
      let processedUsers = usersData || [];
      
      if (usersData && usersData.length > 0) {
        try {
          const userIds = usersData.map(user => user.user_id);
          const { data: userDetailsResponse, error: userDetailsError } = await supabase.functions.invoke('get-user-details', {
            body: { userIds }
          });

          if (userDetailsError) {
            console.error('Error fetching user details:', userDetailsError);
          } else if (userDetailsResponse?.users) {
            processedUsers = usersData.map(user => {
              const userDetail = userDetailsResponse.users.find((u: any) => u.id === user.user_id);
              return {
                ...user,
                company_name: user.companies?.display_name || user.companies?.name,
                user_name: userDetail?.name || `User ${user.user_id.slice(0, 8)}...`,
                user_email: userDetail?.email || `${user.user_id.slice(0, 8)}@system.local`,
                first_name: userDetail?.first_name || '',
                last_name: userDetail?.last_name || ''
              };
            });
          }
        } catch (error) {
          console.error('Error calling get-user-details function:', error);
          // Fallback to basic processing
          processedUsers = usersData.map(user => ({
            ...user,
            company_name: user.companies?.display_name || user.companies?.name,
            user_name: `User ${user.user_id.slice(0, 8)}...`,
            user_email: `${user.user_id.slice(0, 8)}@system.local`,
            first_name: '',
            last_name: ''
          }));
        }
      }

      setCompanyUsers(processedUsers);

      // Fetch module access
      const { data: moduleData, error: moduleError } = await supabase
        .from('company_module_access')
        .select('*')
        .order('granted_at', { ascending: false });

      if (moduleError) throw moduleError;
      setModuleAccess(moduleData || []);

      // Get total system users count from company users we already fetched
      setTotalSystemUsers(processedUsers.length);

      // Get pending migrations count (using royalties_import_staging as a proxy for migrations)
      const { count: migrationsCount } = await supabase
        .from('royalties_import_staging')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'pending');
      
      setPendingMigrations(migrationsCount || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompany.name || !newCompany.display_name || !newCompany.contact_email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const slug = newCompany.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: newCompany.name,
          display_name: newCompany.display_name,
          slug,
          contact_email: newCompany.contact_email,
          subscription_tier: newCompany.subscription_tier,
          subscription_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      // Add the current user as the owner of the new company
      const { error: userError } = await supabase
        .from('company_users')
        .insert([{
          company_id: data.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'owner',
          status: 'active'
        }]);

      if (userError) throw userError;

      toast({
        title: "Success",
        description: "Company created successfully",
      });

      setShowCreateCompany(false);
      setNewCompany({ name: '', display_name: '', contact_email: '', subscription_tier: 'basic' });
      fetchData();

    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    }
  };

  const updateCompanyStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: status })
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? { ...company, subscription_status: status } : company
        )
      );

      toast({
        title: "Success",
        description: `Company ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive",
      });
    }
  };

  const handleManageUsers = (company: Company) => {
    setSelectedCompany(company);
    setShowManageUsers(true);
  };

  const handleManageModules = async (company: Company) => {
    setSelectedCompany(company);
    
    // Fetch current modules for this company
    try {
      const { data, error } = await supabase
        .from('company_module_access')
        .select('module_id')
        .eq('company_id', company.id);
      
      if (error) throw error;
      setCompanyModules(data?.map(m => m.module_id) || []);
    } catch (error) {
      console.error('Error fetching company modules:', error);
      setCompanyModules([]);
    }
    
    setShowManageModules(true);
  };

  const updateCompanyModules = async (moduleIds: string[]) => {
    if (!selectedCompany) return;

    try {
      // Remove existing modules
      await supabase
        .from('company_module_access')
        .delete()
        .eq('company_id', selectedCompany.id);

      // Add new modules
      if (moduleIds.length > 0) {
        const moduleData = moduleIds.map(moduleId => ({
          company_id: selectedCompany.id,
          module_id: moduleId,
          access_source: 'admin_assigned',
          granted_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('company_module_access')
          .insert(moduleData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Company modules updated successfully",
      });

      setShowManageModules(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating company modules:', error);
      toast({
        title: "Error",
        description: "Failed to update company modules",
        variant: "destructive",
      });
    }
  };

  const removeUserFromCompany = async (userId: string, companyId: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed from company successfully",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from company",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, companyId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || company.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Active Accounts</h3>
            </div>
            <div className="text-2xl font-bold mt-2">
              {companies.filter(c => c.subscription_status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sub-accounts with active subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
            </div>
            <div className="text-2xl font-bold mt-2">
              {totalSystemUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total team members across accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Data Migration</h3>
            </div>
            <div className="text-2xl font-bold mt-2">
              0
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending migration requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">System Health</h3>
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-600">
              Healthy
            </div>
            <p className="text-xs text-muted-foreground mt-1">All services operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {companies.filter(c => c.subscription_status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {companies.filter(c => c.subscription_tier === 'enterprise').length}
            </div>
            <p className="text-sm text-muted-foreground">Enterprise Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {companyUsers.filter(u => u.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {companies.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Companies</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="companies" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="migration" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Migration</span>
            </TabsTrigger>
          </TabsList>

          <Dialog open={showCreateCompany} onOpenChange={setShowCreateCompany}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="e.g., Encore Music"
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={newCompany.display_name}
                    onChange={(e) => setNewCompany({ ...newCompany, display_name: e.target.value })}
                    placeholder="e.g., Encore Music LLC"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newCompany.contact_email}
                    onChange={(e) => setNewCompany({ ...newCompany, contact_email: e.target.value })}
                    placeholder="contact@encoremusic.com"
                  />
                </div>
                <div>
                  <Label htmlFor="subscription_tier">Subscription Tier</Label>
                  <Select value={newCompany.subscription_tier} onValueChange={(value) => 
                    setNewCompany({ ...newCompany, subscription_tier: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateCompany(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCompany}>
                    Create Company
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="companies" className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>
                Manage companies, their subscriptions, and user access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Subscription Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.display_name}</div>
                          <div className="text-sm text-muted-foreground">{company.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{company.contact_email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          company.subscription_tier === 'enterprise' ? 'default' :
                          company.subscription_tier === 'professional' ? 'secondary' : 'outline'
                        }>
                          {company.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.subscription_status === 'active' ? 'default' : 'destructive'}>
                          {company.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{company.user_count || 0} members</span>
                      </TableCell>
                      <TableCell>
                        {new Date(company.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => updateCompanyStatus(
                                company.id, 
                                company.subscription_status === 'active' ? 'inactive' : 'active'
                              )}
                            >
                              {company.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageUsers(company)}>
                              Manage Users
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageModules(company)}>
                              Manage Modules
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredCompanies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No companies found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Users</CardTitle>
              <CardDescription>
                View and manage users across all companies with their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyUsers.map((user) => (
                    <TableRow key={user.id}>
                       <TableCell>
                         <div>
                           <div className="font-medium">{user.user_name}</div>
                           <div className="text-sm text-muted-foreground">{user.user_email}</div>
                         </div>
                       </TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'owner' ? 'default' :
                          user.role === 'admin' ? 'secondary' : 'outline'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Access Management</CardTitle>
              <CardDescription>
                Configure module access and permissions at the company level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Module access management interface - Coming soon
                <p className="text-sm mt-2">
                  Module access is now managed at the company level. Each company can be assigned specific modules or bundles.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Data Migration</CardTitle>
              <CardDescription>
                Import and migrate customer data into the new company-based structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Migrate Existing Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Migrate existing individual accounts to company-based structure
                    </p>
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Start User Migration
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Import Companies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Bulk import companies and their user assignments
                    </p>
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Company Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manage Users Dialog */}
      <Dialog open={showManageUsers} onOpenChange={setShowManageUsers}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Users - {selectedCompany?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers
                  .filter(user => user.company_id === selectedCompany?.id)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.user_name}</div>
                          <div className="text-sm text-muted-foreground">{user.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(newRole) => updateUserRole(user.user_id, user.company_id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin – Full sub-account access</SelectItem>
                            <SelectItem value="user">User – Limited visibility (custom)</SelectItem>
                            <SelectItem value="client">Client – Invited user, select data visible</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeUserFromCompany(user.user_id, user.company_id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Modules Dialog */}
      <Dialog open={showManageModules} onOpenChange={setShowManageModules}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Modules - {selectedCompany?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                'catalog-valuation',
                'deal-simulator',
                'contract-management',
                'copyright-management',
                'royalties-processing',
                'sync-licensing'
              ].map((moduleId) => (
                <div key={moduleId} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={moduleId}
                    checked={companyModules.includes(moduleId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCompanyModules([...companyModules, moduleId]);
                      } else {
                        setCompanyModules(companyModules.filter(m => m !== moduleId));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={moduleId} className="text-sm">
                    {moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowManageModules(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateCompanyModules(companyModules)}>
                Update Modules
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};