import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'read' | 'write' | 'admin';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

export function AccessControlMatrix() {
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [searchTerm, setSearchTerm] = useState('');

  const permissions: Permission[] = [
    // Operations Permissions
    { id: 'ops_view_dashboard', name: 'View Operations Dashboard', description: 'Access to operations overview', category: 'Operations', level: 'read' },
    { id: 'ops_manage_workflows', name: 'Manage Workflows', description: 'Create and modify automation workflows', category: 'Operations', level: 'write' },
    { id: 'ops_view_analytics', name: 'View Analytics', description: 'Access to detailed analytics and reports', category: 'Operations', level: 'read' },
    
    // Customer Success Permissions
    { id: 'cs_view_customers', name: 'View Customer Data', description: 'Access to customer profiles and health scores', category: 'Customer Success', level: 'read' },
    { id: 'cs_manage_support', name: 'Manage Support Tickets', description: 'Create, assign, and resolve support tickets', category: 'Customer Success', level: 'write' },
    { id: 'cs_proactive_outreach', name: 'Proactive Customer Outreach', description: 'Initiate customer success communications', category: 'Customer Success', level: 'write' },
    
    // Financial Permissions
    { id: 'fin_view_revenue', name: 'View Revenue Data', description: 'Access to financial metrics and reports', category: 'Financial', level: 'read' },
    { id: 'fin_manage_billing', name: 'Manage Billing', description: 'Handle billing operations and disputes', category: 'Financial', level: 'write' },
    { id: 'fin_financial_reports', name: 'Generate Financial Reports', description: 'Create and export financial reports', category: 'Financial', level: 'admin' },
    
    // Sales & Marketing Permissions
    { id: 'sm_view_leads', name: 'View Sales Leads', description: 'Access to prospect and lead data', category: 'Sales & Marketing', level: 'read' },
    { id: 'sm_manage_campaigns', name: 'Manage Campaigns', description: 'Create and manage marketing campaigns', category: 'Sales & Marketing', level: 'write' },
    { id: 'sm_manage_pricing', name: 'Manage Pricing', description: 'Modify pricing and promotional offers', category: 'Sales & Marketing', level: 'admin' },
    
    // System Administration
    { id: 'sys_user_management', name: 'User Management', description: 'Create, modify, and deactivate users', category: 'System', level: 'admin' },
    { id: 'sys_role_management', name: 'Role Management', description: 'Create and modify user roles', category: 'System', level: 'admin' },
    { id: 'sys_audit_logs', name: 'View Audit Logs', description: 'Access to system audit trails', category: 'System', level: 'admin' },
  ];

  const roles: Role[] = [
    {
      id: 'admin',
      name: 'System Administrator',
      description: 'Full system access with all permissions',
      permissions: permissions.map(p => p.id),
      userCount: 3,
      isSystem: true
    },
    {
      id: 'operations_manager',
      name: 'Operations Manager',
      description: 'Manages day-to-day operations and workflows',
      permissions: [
        'ops_view_dashboard', 'ops_manage_workflows', 'ops_view_analytics',
        'cs_view_customers', 'cs_manage_support',
        'fin_view_revenue', 'sys_audit_logs'
      ],
      userCount: 5,
      isSystem: false
    },
    {
      id: 'customer_success',
      name: 'Customer Success Representative',
      description: 'Focuses on customer health and support',
      permissions: [
        'ops_view_dashboard', 'cs_view_customers', 'cs_manage_support', 'cs_proactive_outreach'
      ],
      userCount: 12,
      isSystem: false
    },
    {
      id: 'financial_analyst',
      name: 'Financial Analyst',
      description: 'Handles financial operations and reporting',
      permissions: [
        'ops_view_dashboard', 'fin_view_revenue', 'fin_manage_billing', 'fin_financial_reports'
      ],
      userCount: 4,
      isSystem: false
    },
    {
      id: 'sales_marketing',
      name: 'Sales & Marketing',
      description: 'Manages sales processes and marketing campaigns',
      permissions: [
        'ops_view_dashboard', 'sm_view_leads', 'sm_manage_campaigns', 'cs_view_customers'
      ],
      userCount: 8,
      isSystem: false
    }
  ];

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionLevel = (permission: Permission) => {
    switch (permission.level) {
      case 'read': return { color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Eye };
      case 'write': return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Edit };
      case 'admin': return { color: 'bg-red-500/10 text-red-600 border-red-200', icon: Shield };
    }
  };

  const getPermissionsByCategory = (category: string) => {
    return filteredPermissions.filter(p => p.category === category);
  };

  const categories = [...new Set(permissions.map(p => p.category))];

  const hasPermission = (permissionId: string) => {
    return selectedRoleData?.permissions.includes(permissionId) || false;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Access Control Matrix</CardTitle>
              <CardDescription>
                Manage role-based permissions and access control across all platform features
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="permissions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="users">User Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant={role.isSystem ? "default" : "secondary"} className="w-2 h-2 p-0" />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {categories.map(category => {
                const categoryPermissions = getPermissionsByCategory(category);
                if (categoryPermissions.length === 0) return null;

                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryPermissions.map(permission => {
                          const level = getPermissionLevel(permission);
                          const LevelIcon = level.icon;
                          const hasAccess = hasPermission(permission.id);

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <LevelIcon className="h-4 w-4" />
                                  <Badge variant="outline" className={level.color}>
                                    {permission.level}
                                  </Badge>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{permission.name}</h4>
                                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={hasAccess}
                                  disabled={selectedRoleData?.isSystem}
                                />
                                {hasAccess ? (
                                  <Unlock className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Lock className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4">
              {roles.map(role => (
                <Card key={role.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={role.isSystem ? "default" : "secondary"}>
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{role.userCount} users</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {role.permissions.length} permissions
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.isSystem && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">User Assignment Management</h3>
              <p className="text-muted-foreground mb-4">
                Assign users to roles and manage individual access permissions
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Users to Roles
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}