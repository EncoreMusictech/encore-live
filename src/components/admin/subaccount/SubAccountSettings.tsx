import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Power, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Company {
  id: string;
  name: string;
  subscription_status: string;
}

interface SubAccountSettingsProps {
  company: Company;
  onUpdate: () => void;
}

export function SubAccountSettings({ company, onUpdate }: SubAccountSettingsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleToggleStatus = async () => {
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

      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-account status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Sub-account deleted successfully',
      });

      navigate('/dashboard/operations');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sub-account',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Control whether this sub-account can access the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Status</p>
              <p className="text-sm text-muted-foreground">
                {company.subscription_status === 'active'
                  ? 'This account is active and can access all enabled modules'
                  : 'This account is inactive and cannot access any modules'}
              </p>
            </div>
            <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
              {company.subscription_status}
            </Badge>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={company.subscription_status === 'active' ? 'destructive' : 'default'}
              >
                <Power className="h-4 w-4 mr-2" />
                {company.subscription_status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {company.subscription_status === 'active' ? 'Deactivate' : 'Activate'} Sub-Account?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {company.subscription_status === 'active'
                    ? 'This will prevent all users from accessing the account and its modules.'
                    : 'This will restore access to all enabled modules for this account.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleStatus}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect this sub-account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 border border-destructive rounded-lg bg-destructive/5">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive mb-1">Delete Sub-Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this sub-account, all associated users, and their access permissions.
                This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Sub-Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>{company.name}</strong> and all associated data.
                      <br /><br />
                      This action cannot be undone. Are you absolutely sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
