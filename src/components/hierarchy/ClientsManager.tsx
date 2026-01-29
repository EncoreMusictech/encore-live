import { useState } from 'react';
import { Building2, Plus, MoreHorizontal, Eye, Trash2, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';
import { useToast } from '@/hooks/use-toast';
import { useViewMode } from '@/contexts/ViewModeContext';

interface ClientsManagerProps {
  parentCompanyId: string;
  parentCompanyName: string;
}

export function ClientsManager({ parentCompanyId, parentCompanyName }: ClientsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDisplayName, setNewClientDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { childCompanies, loading, createClientLabel, refetch } = useClientHierarchy(parentCompanyId);
  const { switchToClientView } = useViewMode();
  const { toast } = useToast();

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientDisplayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Both name and display name are required.',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    const result = await createClientLabel(parentCompanyId, newClientName.trim(), newClientDisplayName.trim());
    setIsCreating(false);

    if (result) {
      setIsCreateDialogOpen(false);
      setNewClientName('');
      setNewClientDisplayName('');
    }
  };

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client Label</DialogTitle>
              <DialogDescription>
                Add a new client label under {parentCompanyName}. This will create a separate data scope for this client's works, contracts, and royalties.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Internal Name</Label>
                <Input
                  id="client-name"
                  placeholder="e.g., empire-records"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for system identification. Lowercase, no spaces.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-display-name">Display Name</Label>
                <Input
                  id="client-display-name"
                  placeholder="e.g., Empire Records"
                  value={newClientDisplayName}
                  onChange={(e) => setNewClientDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the UI and reports.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Client Label'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                        <DropdownMenuItem>
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
    </Card>
  );
}
