import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
}

interface EditSubAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
}

export function EditSubAccountDialog({ open, onOpenChange, company, onSuccess }: EditSubAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name,
    display_name: company.display_name,
    slug: company.slug,
    contact_email: company.contact_email,
    phone: company.phone || '',
    subscription_tier: company.subscription_tier,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          display_name: formData.display_name,
          slug: formData.slug,
          contact_email: formData.contact_email,
          phone: formData.phone,
          subscription_tier: formData.subscription_tier,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Sub-account updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating sub-account:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Sub-Account</DialogTitle>
          <DialogDescription>Update company information and settings</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                required
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription_tier">Subscription Tier *</Label>
            <Select
              value={formData.subscription_tier}
              onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}
            >
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
