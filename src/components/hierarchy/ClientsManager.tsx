import { useState } from 'react';
import { Building2, Plus, MoreHorizontal, Eye, Trash2, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';
import { useToast } from '@/hooks/use-toast';
import { useViewMode } from '@/contexts/ViewModeContext';
import { CreateClientDialog } from './CreateClientDialog';
import { ClientUsersDialog } from './ClientUsersDialog';

interface ClientsManagerProps {
  parentCompanyId: string;
  parentCompanyName: string;
}

export function ClientsManager({ parentCompanyId, parentCompanyName }: ClientsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [manageUsersClient, setManageUsersClient] = useState<{ id: string; name: string } | null>(null);
  
  const { childCompanies, loading, refetch } = useClientHierarchy(parentCompanyId);
  const { switchToClientView } = useViewMode();
  const { toast } = useToast();

  const handleViewAsClient = (companyId: string, companyName: string) => {
    switchToClientView(companyId, companyName);
    toast({
      title: 'View Switched',
      description: `Now viewing as ${companyName}`
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Client Labels
          </CardTitle>
          <CardDescription>
            Manage client labels under {parentCompanyName}
          </CardDescription>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
        <CreateClientDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          parentCompanyId={parentCompanyId}
          parentCompanyName={parentCompanyName}
          onClientCreated={refetch}
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : childCompanies.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Client Labels</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first client label to start organizing works by client.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {childCompanies.map((client) => (
                <TableRow key={client.company_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.display_name}</p>
                        <p className="text-xs text-muted-foreground">{client.company_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {client.company_type?.replace('_', ' ') || 'client label'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleViewAsClient(client.company_id, client.display_name)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View as Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setManageUsersClient({ id: client.company_id, name: client.display_name })}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {manageUsersClient && (
        <ClientUsersDialog
          open={!!manageUsersClient}
          onOpenChange={(open) => { if (!open) setManageUsersClient(null); }}
          clientId={manageUsersClient.id}
          clientName={manageUsersClient.name}
        />
      )}
    </Card>
  );
}
