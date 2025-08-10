import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Download, Search, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortal } from '@/hooks/useClientPortal';
interface ClientContractsProps {
  permissions: Record<string, any>;
}

export const ClientContracts = ({ permissions }: ClientContractsProps) => {
  const { user } = useAuth();
  const { isClient } = useClientPortal();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;

      try {
        const clientMode = await isClient();
        if (clientMode) {
          const { data: assoc, error: assocError } = await supabase
            .from('client_data_associations')
            .select('data_id')
            .eq('client_user_id', user.id)
            .eq('data_type', 'contract');
          if (assocError) throw assocError;
          const ids = (assoc || []).map((a: any) => a.data_id);
          if (!ids.length) {
            setContracts([]);
          } else {
            const { data, error } = await supabase
              .from('contracts')
              .select('*')
              .in('id', ids)
              .order('created_at', { ascending: false });
            if (error) throw error;
            setContracts(data || []);
          }
        } else {
          const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setContracts(data || []);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [user, isClient]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'draft': 'secondary',
      'pending_signature': 'warning',
      'fully_executed': 'success',
      'terminated': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.counterparty_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading contracts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">My Contracts</h2>
        <p className="text-muted-foreground">
          View and manage your publishing contracts and agreements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Contract List</CardTitle>
              <CardDescription>
                Track the status of your contracts and download executed agreements.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Title</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.title}</TableCell>
                    <TableCell>{contract.counterparty_name}</TableCell>
                    <TableCell>{getStatusBadge(contract.contract_status)}</TableCell>
                    <TableCell>
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {contract.generated_pdf_url && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any contracts assigned yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};