import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Download, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortal } from '@/hooks/useClientPortal';
interface ClientSyncDealsProps {
  permissions: Record<string, any>;
}

export const ClientSyncDeals = ({ permissions }: ClientSyncDealsProps) => {
  const { user } = useAuth();
  const { isClient } = useClientPortal();
  const [syncDeals, setSyncDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
useEffect(() => {
    const fetchSyncDeals = async () => {
      if (!user) return;

      try {
        const clientMode = await isClient();
        if (clientMode) {
          const { data: assoc, error: assocError } = await supabase
            .from('client_data_associations')
            .select('data_id')
            .eq('client_user_id', user.id)
            .eq('data_type', 'sync_license');
          if (assocError) throw assocError;
          const ids = (assoc || []).map((a: any) => a.data_id);
          if (!ids.length) {
            setSyncDeals([]);
          } else {
            const { data, error } = await supabase
              .from('sync_licenses')
              .select('*')
              .in('id', ids)
              .order('created_at', { ascending: false });
            if (error) throw error;
            setSyncDeals(data || []);
          }
        } else {
          const { data, error } = await supabase
            .from('sync_licenses')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setSyncDeals(data || []);
        }
      } catch (error) {
        console.error('Error fetching sync deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSyncDeals();
  }, [user, isClient]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'inquiry': 'secondary',
      'negotiating': 'warning',
      'licensed': 'success',
      'rejected': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status?.toUpperCase() || 'INQUIRY'}
      </Badge>
    );
  };

  const filteredDeals = syncDeals.filter(deal =>
    deal.project_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading sync deals...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Sync Deals</h2>
        <p className="text-muted-foreground">
          Track sync licensing opportunities and manage deal negotiations.
        </p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Sync License Tracker</CardTitle>
              <CardDescription>
                View deals associated with your works and their current status.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDeals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Sync Fee</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.project_title}</TableCell>
                    <TableCell>{getStatusBadge(deal.synch_status)}</TableCell>
                    <TableCell>{deal.media_type || 'N/A'}</TableCell>
                    <TableCell>
                      {deal.pub_fee ? `$${deal.pub_fee.toLocaleString()}` : 'TBD'}
                    </TableCell>
                    <TableCell>{deal.territory_of_licensee || 'Worldwide'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {permissions?.canComment && (
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        {deal.fe_license_url && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sync deals found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any sync licensing deals yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};