import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, Edit, Power } from 'lucide-react';
import { useState } from 'react';
import { EditSubAccountDialog } from './EditSubAccountDialog';

interface Company {
  id: string;
  name: string;
  display_name: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  slug: string;
}

interface SubAccountOverviewProps {
  company: Company;
  onUpdate: () => void;
}

export function SubAccountOverview({ company, onUpdate }: SubAccountOverviewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Company Information</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <CardDescription>Basic company details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-base font-medium">{company.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <p className="text-base font-medium">{company.display_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Slug</label>
              <p className="text-base font-mono text-sm">{company.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{company.contact_email}</span>
            </div>
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{company.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Created {new Date(company.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Current subscription tier and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subscription Tier</label>
              <div className="mt-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-2 flex items-center gap-3">
                <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                  <Power className="h-3 w-3 mr-1" />
                  {company.subscription_status.charAt(0).toUpperCase() + company.subscription_status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {company.subscription_status === 'active'
                  ? 'This sub-account has full access to enabled modules.'
                  : 'This sub-account is currently inactive and cannot access any modules.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditSubAccountDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        onSuccess={onUpdate}
      />
    </>
  );
}
