import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Music, DollarSign, Calendar } from 'lucide-react';

interface ClientDashboardOverviewProps {
  permissions: Record<string, any>;
}

export const ClientDashboardOverview = ({ permissions }: ClientDashboardOverviewProps) => {
  const modules = [
    {
      id: 'contracts',
      title: 'Contract Management',
      description: 'View and manage your publishing contracts',
      icon: FileText,
      enabled: permissions.contracts?.enabled
    },
    {
      id: 'copyright',
      title: 'Copyright Management',
      description: 'Submit and track your musical works',
      icon: Music,
      enabled: permissions.copyright?.enabled
    },
    {
      id: 'sync-licensing',
      title: 'Sync Licensing',
      description: 'Track sync opportunities and licensing deals',
      icon: Calendar,
      enabled: permissions['sync-licensing']?.enabled
    },
    {
      id: 'royalties',
      title: 'Royalties Processing',
      description: 'View royalty statements and earnings analytics',
      icon: DollarSign,
      enabled: permissions.royalties?.enabled
    }
  ];

  const enabledModules = modules.filter(module => module.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Welcome to Your Client Portal</h2>
        <p className="text-muted-foreground">
          Access your rights management information and track the status of your works and contracts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {enabledModules.map((module) => (
          <Card key={module.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <module.icon className="h-6 w-6 text-primary" />
                <Badge variant="secondary">Active</Badge>
              </div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{module.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {enabledModules.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Modules Available</CardTitle>
            <CardDescription>
              You don't have access to any modules yet. Please contact your administrator to request access.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • View your latest royalty statements
            </p>
            <p className="text-sm text-muted-foreground">
              • Check contract status updates
            </p>
            <p className="text-sm text-muted-foreground">
              • Submit new works for registration
            </p>
            <p className="text-sm text-muted-foreground">
              • Download available documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};