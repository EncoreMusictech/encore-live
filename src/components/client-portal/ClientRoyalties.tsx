import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Download, Filter, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClientAccountBalance } from './ClientAccountBalance';
import { ClientPaymentInfo } from './ClientPaymentInfo';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useClientVisibilityScope } from '@/hooks/useClientVisibilityScope';
import { useClientPortalIdentity } from '@/contexts/ClientPortalContext';

interface ClientRoyaltiesProps {
  permissions: Record<string, any>;
}

export const ClientRoyalties = ({ permissions }: ClientRoyaltiesProps) => {
  const { user } = useAuth();
  const { effectiveUserId } = useClientPortalIdentity();
  const { isClient } = useClientPortal();
  const { scope, applyRoyaltyScopeFilter } = useClientVisibilityScope();
  const [royalties, setRoyalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedWork, setSelectedWork] = useState('all');
  const [selectedRightType, setSelectedRightType] = useState('all');
  const [selectedTerritory, setSelectedTerritory] = useState('all');

  useEffect(() => {
    const fetchRoyalties = async () => {
      if (!effectiveUserId) return;

      try {
        const clientMode = await isClient();
        if (clientMode || effectiveUserId !== user?.id) {
          if (scope.scope_type === 'custom' || scope.scope_type === 'all') {
            const { data: assoc, error: assocError } = await supabase
              .from('client_data_associations')
              .select('data_id')
              .eq('client_user_id', effectiveUserId)
              .eq('data_type', 'royalty_allocation');
            if (assocError) throw assocError;
            const ids = (assoc || []).map((a: any) => a.data_id);
            if (!ids.length) {
              setRoyalties([]);
            } else {
              const { data, error } = await supabase
                .from('royalty_allocations')
                .select('*')
                .in('id', ids)
                .order('created_at', { ascending: false });
              if (error) throw error;
              setRoyalties(data || []);
            }
          } else {
            let query = supabase
              .from('royalty_allocations')
              .select('*')
              .order('created_at', { ascending: false });
            
            query = applyRoyaltyScopeFilter(query);
            const { data, error } = await query;
            if (error) throw error;
            setRoyalties(data || []);
          }
        } else {
          const { data, error } = await supabase
            .from('royalty_allocations')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setRoyalties(data || []);
        }
      } catch (error) {
        console.error('Error fetching royalties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoyalties();
  }, [effectiveUserId, isClient, scope]);

  // Calculate totals
  const totalEarnings = royalties.reduce((sum, royalty) => sum + (royalty.gross_royalty_amount || 0), 0);
  const paidEarnings = royalties
    .filter(r => r.status === 'paid')
    .reduce((sum, royalty) => sum + (royalty.gross_royalty_amount || 0), 0);
  const unpaidEarnings = totalEarnings - paidEarnings;

  // Get unique values for filters
  const works = [...new Set(royalties.map(r => r.song_title))].filter(Boolean);
  const rightTypes = [...new Set(royalties.map(r => r.revenue_source))].filter(Boolean);
  const territories = [...new Set(royalties.map(r => r.country))].filter(Boolean);

  // Apply filters
  let filteredRoyalties = royalties;
  if (selectedWork && selectedWork !== 'all') {
    filteredRoyalties = filteredRoyalties.filter(r => r.song_title === selectedWork);
  }
  if (selectedRightType && selectedRightType !== 'all') {
    filteredRoyalties = filteredRoyalties.filter(r => r.revenue_source === selectedRightType);
  }
  if (selectedTerritory && selectedTerritory !== 'all') {
    filteredRoyalties = filteredRoyalties.filter(r => r.country === selectedTerritory);
  }

  if (loading) {
    return <div>Loading royalties...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Royalties & Payouts</h2>
        <p className="text-muted-foreground">
          Manage your royalties, account balance, and payment information.
        </p>
      </div>

      <Tabs defaultValue="statements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Royalty Statements
          </TabsTrigger>
          <TabsTrigger value="account-balance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Account Balance
          </TabsTrigger>
          <TabsTrigger value="payment-info" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  All time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${paidEarnings.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {((paidEarnings / totalEarnings) * 100 || 0).toFixed(1)}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">${unpaidEarnings.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Pending payment
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Royalties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Work</label>
                  <Select value={selectedWork} onValueChange={setSelectedWork}>
                    <SelectTrigger>
                      <SelectValue placeholder="All works" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All works</SelectItem>
                      {works.map(work => (
                        <SelectItem key={work} value={work}>{work}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Right Type</label>
                  <Select value={selectedRightType} onValueChange={setSelectedRightType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {rightTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Territory</label>
                  <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All territories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All territories</SelectItem>
                      {territories.map(territory => (
                        <SelectItem key={territory} value={territory}>{territory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Royalties Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Royalty Statements</CardTitle>
                  <CardDescription>
                    Detailed breakdown of your earnings by work and territory.
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRoyalties.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Title</TableHead>
                      <TableHead>Right Type</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoyalties.map((royalty) => (
                      <TableRow key={royalty.id}>
                        <TableCell className="font-medium">{royalty.song_title}</TableCell>
                        <TableCell>{royalty.revenue_source || 'N/A'}</TableCell>
                        <TableCell>{royalty.country || 'N/A'}</TableCell>
                        <TableCell>{royalty.quarter || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${royalty.gross_royalty_amount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={royalty.status === 'paid' ? 'default' : 'secondary'}>
                            {royalty.status || 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No royalties found</h3>
                  <p className="text-muted-foreground">
                    No royalty data matches your current filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-balance">
          <ClientAccountBalance permissions={permissions} />
        </TabsContent>

        <TabsContent value="payment-info">
          <ClientPaymentInfo permissions={permissions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};