import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Mail, Shield, Users } from 'lucide-react';

interface CompanyUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface ClientUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function ClientUsersDialog({ open, onOpenChange, clientId, clientName }: ClientUsersDialogProps) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'user' });
  const { toast } = useToast();

  useEffect(() => {
    if (open && clientId) {
      fetchUsers();
    }
  }, [open, clientId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: companyUsers, error: companyUsersError } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', clientId)
        .order('created_at', { ascending: false });

      if (companyUsersError) throw companyUsersError;

      if (!companyUsers || companyUsers.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = companyUsers.map(cu => cu.user_id);
      const { data: userDetailsResponse, error: userDetailsError } = await supabase.functions.invoke('get-user-details', {
        body: { userIds }
      });

      if (userDetailsError) {
        console.error('Error fetching user details:', userDetailsError);
      }

      const userDetailsMap = new Map<string, { email: string; name: string }>();
      if (userDetailsResponse?.users) {
        userDetailsResponse.users.forEach((u: { id: string; email: string; name: string }) => {
          userDetailsMap.set(u.id, { email: u.email, name: u.name });
        });
      }

      const usersWithData = companyUsers.map(cu => {
        const details = userDetailsMap.get(cu.user_id);
        return {
          ...cu,
          email: details?.email || 'N/A',
          full_name: details?.name || 'N/A'
        };
      });

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email) {
      toast({ title: 'Validation Error', description: 'Email is required', variant: 'destructive' });
      return;
    }

    try {
      setAdding(true);

      // Look up user by email via profiles or auth
      const { data, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;

      const user = data.users?.find((u: any) => u.email === newUser.email);
      if (!user) {
        toast({ title: 'Error', description: 'User with this email not found. They must sign up first.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('company_users')
        .insert({
          company_id: clientId,
          user_id: user.id,
          role: newUser.role,
          status: 'active',
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'User added successfully' });
      setNewUser({ email: '', role: 'user' });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add user', variant: 'destructive' });
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
      toast({ title: 'Success', description: 'User removed successfully' });
      fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({ title: 'Error', description: 'Failed to remove user', variant: 'destructive' });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: 'Success', description: 'User role updated' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Users — {clientName}
          </DialogTitle>
          <DialogDescription>
            Add, remove, or update user roles for this client label.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {showAddForm && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
              <h4 className="text-sm font-medium">Add New User</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-user-email">Email</Label>
                  <Input
                    id="client-user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-user-role">Role</Label>
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
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddUser} disabled={adding}>
                  {adding ? 'Adding...' : 'Add User'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No users assigned to this client label yet.</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
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
                        <Select value={user.role} onValueChange={(value) => handleUpdateRole(user.id, value)}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Admin
                              </div>
                            </SelectItem>
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
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveUser(user.id)}>
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
      </DialogContent>
    </Dialog>
  );
}
