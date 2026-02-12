import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Power, Trash2, AlertCircle, Save } from 'lucide-react';

interface ClientSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onUpdate?: () => void;
}

export function ClientSettingsDialog({ open, onOpenChange, clientId, clientName, onUpdate }: ClientSettingsDialogProps) {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && clientId) {
      fetchCompany();
    }
  }, [open, clientId]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setCompany(data);
      setDisplayName(data.display_name || '');
      setContactEmail(data.contact_email || '');
      setPhone(data.phone || '');
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({ title: 'Error', description: 'Failed to load client settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('companies')
        .update({
          display_name: displayName,
          contact_email: contactEmail,
          phone: phone,
        })
        .eq('id', clientId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Client settings updated' });
      onUpdate?.();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!company) return;
    try {
      const newStatus = company.subscription_status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: newStatus })
        .eq('id', clientId);

      if (error) throw error;
      toast({ title: 'Success', description: `Client ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
      fetchCompany();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Client label deleted' });
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error', description: 'Failed to delete client label', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings — {clientName}
          </DialogTitle>
          <DialogDescription>
            Manage settings for this client label.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">General</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client-display-name">Display Name</Label>
                  <Input
                    id="client-display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-email">Contact Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input
                    id="client-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Account Status */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">Account Status</h4>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {company?.subscription_status === 'active'
                    ? 'This client is active and can access enabled modules.'
                    : 'This client is inactive.'}
                </p>
                <Badge variant={company?.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {company?.subscription_status || 'unknown'}
                </Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant={company?.subscription_status === 'active' ? 'destructive' : 'default'}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {company?.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {company?.subscription_status === 'active' ? 'Deactivate' : 'Activate'} Client?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {company?.subscription_status === 'active'
                        ? 'This will prevent all users from accessing this client label.'
                        : 'This will restore access to all enabled modules for this client.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleStatus}>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
              <div className="flex items-start gap-3 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this client label and all associated data. This cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client Label?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{clientName}</strong> and all associated data.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
