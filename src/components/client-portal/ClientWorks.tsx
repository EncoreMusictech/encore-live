import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Music, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useClientVisibilityScope } from '@/hooks/useClientVisibilityScope';

interface ClientWorksProps {
  permissions: Record<string, any>;
}

export const ClientWorks = ({ permissions }: ClientWorksProps) => {
  const { user } = useAuth();
  const { isClient } = useClientPortal();
  const { scope, applyCopyrightScopeFilter } = useClientVisibilityScope();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWorks = async () => {
      if (!user) return;

      try {
        const clientMode = await isClient();
        if (clientMode) {
          // If scope is 'custom' or 'all', fall back to data associations
          if (scope.scope_type === 'custom' || scope.scope_type === 'all') {
            const { data: assoc, error: assocError } = await supabase
              .from('client_data_associations')
              .select('data_id')
              .eq('client_user_id', user.id)
              .eq('data_type', 'copyright');
            if (assocError) throw assocError;
            const ids = (assoc || []).map((a: any) => a.data_id);
            if (!ids.length) {
              setWorks([]);
            } else {
              const { data, error } = await supabase
                .from('copyrights')
                .select('*')
                .in('id', ids)
                .order('created_at', { ascending: false });
              if (error) throw error;
              setWorks(data || []);
            }
          } else {
            // Use visibility scope filtering (artist or label)
            let query = supabase
              .from('copyrights')
              .select('*')
              .order('created_at', { ascending: false });
            
            query = await applyCopyrightScopeFilter(query);
            const { data, error } = await query;
            if (error) throw error;
            setWorks(data || []);
          }
        } else {
          const { data, error } = await supabase
            .from('copyrights')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setWorks(data || []);
        }
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, [user, isClient, scope]);

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, any> = {
      'awaiting_review': 'warning',
      'approved': 'success',
      'rejected': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
      </Badge>
    );
  };

  const getRegistrationBadge = (status: string) => {
    const variants: Record<string, any> = {
      'not_registered': 'secondary',
      'pending': 'warning',
      'in_dispute': 'destructive',
      'needs_amending': 'warning',
      'registered': 'success'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status?.replace('_', ' ').toUpperCase() || 'NOT REGISTERED'}
      </Badge>
    );
  };

  const filteredWorks = works.filter(work =>
    work.work_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading works...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">My Works</h2>
        <p className="text-muted-foreground">
          Submit new works and track registration status with performing rights organizations.
        </p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Work Registry</CardTitle>
              <CardDescription>
                Track your musical works and their registration status.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search works..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              {permissions?.canSubmit && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Work
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Title</TableHead>
                  <TableHead>Work ID</TableHead>
                  <TableHead>Work Approval</TableHead>
                  <TableHead>PRO Registration</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.work_title}</TableCell>
                    <TableCell className="font-mono text-sm">{work.work_id}</TableCell>
                    <TableCell>{getApprovalBadge(work.status)}</TableCell>
                    <TableCell>{getRegistrationBadge(work.registration_status)}</TableCell>
                    <TableCell>
                      {new Date(work.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No works found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any works registered yet.'}
              </p>
              {permissions?.canSubmit && (
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Work
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};