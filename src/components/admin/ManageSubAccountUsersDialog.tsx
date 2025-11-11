import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Mail } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface CompanyUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface ManageSubAccountUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
}

export function ManageSubAccountUsersDialog({ open, onOpenChange, company, onSuccess }: ManageSubAccountUsersDialogProps) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'user' });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, company.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch company users with their auth user data
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (companyUsersError) throw companyUsersError;

      // Fetch user data from auth.users for each company user
      const usersWithData = await Promise.all(
        (companyUsers || []).map(async (cu) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(cu.user_id);
          
          // Get profile data for name
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', cu.user_id)
            .single();

          return {
            ...cu,
            email: user?.email || 'N/A',
            full_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A' : 'N/A'
          };
        })
      );

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);
      
      // Get user by email from auth.users
      const { data, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const user = data.users?.find((u: any) => u.email === newUser.email);

      if (!user) {
        toast({
          title: 'Error',
          description: 'User with this email not found. They must sign up first.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: newUser.role,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User added successfully',
      });

      setNewUser({ email: '', full_name: '', role: 'user' });
      fetchUsers();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add user',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User removed successfully',
      });

      fetchUsers();
      onSuccess();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      fetchUsers();
      onSuccess();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Users - {company.name}</DialogTitle>
          <DialogDescription>Add and manage users for this sub-account</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add User Form */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
            <h3 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New User
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddUser} disabled={adding} size="sm">
              {adding ? 'Adding...' : 'Add User'}
            </Button>
          </div>

          {/* Users Table */}
          <div>
            <h3 className="font-medium mb-4">Current Users ({users.length})</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email || 'N/A'}
                        </div>
                      </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
