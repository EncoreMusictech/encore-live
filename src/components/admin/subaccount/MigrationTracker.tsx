import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { AddWriterDialog } from './AddWriterDialog';
import { ImportMigrationCsvDialog } from './ImportMigrationCsvDialog';
import { MissingDataReportDialog } from './MissingDataReportDialog';
import { RefreshCw, Trash2, Database, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MigrationTrackerProps {
  companyId: string;
  companyName: string;
  readOnly?: boolean;
}

const CHECKPOINTS = [
  { key: 'contract_entered', label: 'Contract' },
  { key: 'copyrights_entered', label: 'Copyrights' },
  { key: 'schedules_attached', label: 'Schedules' },
  { key: 'payees_created', label: 'Payees' },
  { key: 'contract_terms_confirmed', label: 'Terms' },
  { key: 'payee_splits_confirmed', label: 'Splits' },
  { key: 'beginning_balance_entered', label: 'Balance' },
  { key: 'client_portal_created', label: 'Portal' },
  { key: 'client_assets_granted', label: 'Assets' },
] as const;

type CheckpointKey = typeof CHECKPOINTS[number]['key'];

interface TrackingItem {
  id: string;
  company_id: string;
  entity_name: string | null;
  administrator: string | null;
  original_publisher: string | null;
  writer_name: string;
  contract_entered: boolean;
  copyrights_entered: boolean;
  schedules_attached: boolean;
  payees_created: boolean;
  contract_terms_confirmed: boolean;
  payee_splits_confirmed: boolean;
  beginning_balance_entered: boolean;
  client_portal_created: boolean;
  client_assets_granted: boolean;
  created_at: string;
  updated_at: string;
}

const getBarColor = (pct: number) => {
  if (pct >= 80) return 'hsl(142, 71%, 45%)';
  if (pct >= 50) return 'hsl(48, 96%, 53%)';
  return 'hsl(0, 84%, 60%)';
};

export function MigrationTracker({ companyId, companyName, readOnly = false }: MigrationTrackerProps) {
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [entities, setEntities] = useState<{ id: string; entity_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('migration_tracking_items')
      .select('*')
      .eq('company_id', companyId)
      .order('entity_name', { ascending: true })
      .order('writer_name', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setItems((data as TrackingItem[]) || []);
    }
    setLoading(false);
  }, [companyId, toast]);

  const fetchEntities = useCallback(async () => {
    const { data } = await supabase
      .from('publishing_entities')
      .select('id, name')
      .eq('company_id', companyId);
    setEntities((data || []).map(e => ({ id: e.id, entity_name: e.name })));
  }, [companyId]);

  useEffect(() => {
    fetchItems();
    fetchEntities();
  }, [fetchItems, fetchEntities]);

  const toggleCheckpoint = async (itemId: string, key: CheckpointKey, currentValue: boolean) => {
    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [key]: !currentValue } : item
    ));

    const { error } = await supabase
      .from('migration_tracking_items')
      .update({ [key]: !currentValue })
      .eq('id', itemId);

    if (error) {
      // Revert
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, [key]: currentValue } : item
      ));
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('migration_tracking_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const syncFromDatabase = async () => {
    setSyncing(true);
    try {
      // Fetch contracts for this company
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, counterparty_name')
        .eq('client_company_id', companyId);

      // Fetch payees for this company
      const { data: payees } = await supabase
        .from('payees')
        .select('id, payee_name')
        .eq('client_company_id', companyId);

      const contractNames = (contracts || []).map(c => c.counterparty_name?.toLowerCase());
      const payeeNames = (payees || []).map(p => p.payee_name?.toLowerCase());

      let updatedCount = 0;

      for (const item of items) {
        const writerLower = item.writer_name.toLowerCase();
        const updates: Partial<TrackingItem> = {};

        // Check contract_entered
        if (!item.contract_entered && contractNames.some(n => n?.includes(writerLower) || writerLower.includes(n || ''))) {
          updates.contract_entered = true;
        }

        // Check payees_created
        if (!item.payees_created && payeeNames.some(n => n?.includes(writerLower) || writerLower.includes(n || ''))) {
          updates.payees_created = true;
        }

        // Find matching contract for schedule/copyright checks
        const matchingContract = (contracts || []).find(c =>
          c.counterparty_name?.toLowerCase().includes(writerLower) ||
          writerLower.includes(c.counterparty_name?.toLowerCase() || '')
        );

        if (matchingContract) {
          // Check schedules_attached
          if (!item.schedules_attached) {
            const { count } = await supabase
              .from('contract_schedule_works')
              .select('*', { count: 'exact', head: true })
              .eq('contract_id', matchingContract.id);
            if ((count || 0) > 0) updates.schedules_attached = true;
          }

          // Check copyrights_entered
          if (!item.copyrights_entered) {
            const { count } = await supabase
              .from('contract_schedule_works')
              .select('*', { count: 'exact', head: true })
              .eq('contract_id', matchingContract.id);
            if ((count || 0) > 0) updates.copyrights_entered = true;
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('migration_tracking_items')
            .update(updates)
            .eq('id', item.id);
          updatedCount++;
        }
      }

      toast({ title: 'Sync Complete', description: `Updated ${updatedCount} tracking item(s) from live data` });
      fetchItems();
    } catch (err: any) {
      toast({ title: 'Sync Error', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const filteredItems = entityFilter === 'all'
    ? items
    : items.filter(i => i.entity_name === entityFilter);

  const uniqueEntities = [...new Set(items.map(i => i.entity_name).filter(Boolean))] as string[];

  // Calculate overall stats
  const totalCheckpoints = items.length * CHECKPOINTS.length;
  const completedCheckpoints = items.reduce((acc, item) => {
    return acc + CHECKPOINTS.filter(cp => item[cp.key]).length;
  }, 0);
  const overallProgress = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  // Per-checkpoint stats
  const checkpointStats = CHECKPOINTS.map(cp => {
    const completed = items.filter(i => i[cp.key]).length;
    return { ...cp, completed, total: items.length, pct: items.length > 0 ? Math.round((completed / items.length) * 100) : 0 };
  });

  // Group items by entity for display
  const groupedItems = filteredItems.reduce<Record<string, TrackingItem[]>>((acc, item) => {
    const group = item.entity_name || 'Unassigned';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  // Donut chart data
  const donutData = [
    { name: 'Complete', value: completedCheckpoints },
    { name: 'Remaining', value: totalCheckpoints - completedCheckpoints },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Migration Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-[120px] h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                      >
                        <Cell fill="hsl(142, 71%, 45%)" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-3xl font-bold">{overallProgress}%</div>
                  <p className="text-xs text-muted-foreground">
                    {completedCheckpoints} / {totalCheckpoints} checkpoints
                  </p>
                  <p className="text-xs text-muted-foreground">{items.length} writers</p>
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold">0%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checkpoint Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pr-4 pb-4">
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={checkpointStats} layout="vertical" margin={{ left: 60, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="label" fontSize={11} width={55} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Complete']} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                    {checkpointStats.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredItems.length} writers</Badge>
        </div>
        <div className="flex items-center gap-2">
          <MissingDataReportDialog items={items} companyName={companyName} />
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={syncFromDatabase} disabled={syncing || items.length === 0}>
                <Database className="h-4 w-4 mr-1" />
                {syncing ? 'Syncing...' : 'Sync from DB'}
              </Button>
              <ImportMigrationCsvDialog companyId={companyId} onAdded={fetchItems} />
              <AddWriterDialog companyId={companyId} entities={entities} onAdded={fetchItems} />
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tracking Table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No writers tracked yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add writers to begin tracking data migration progress for {companyName}.
            </p>
            {!readOnly && <AddWriterDialog companyId={companyId} entities={entities} onAdded={fetchItems} />}
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([entityName, entityItems]) => (
          <Card key={entityName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{entityName}</CardTitle>
                <Badge variant="outline">{entityItems.length} writers</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Writer</TableHead>
                      <TableHead className="min-w-[120px]">Administrator</TableHead>
                      {CHECKPOINTS.map(cp => (
                        <TableHead key={cp.key} className="text-center min-w-[70px] text-xs">
                          {cp.label}
                        </TableHead>
                      ))}
                      {!readOnly && <TableHead className="w-[50px]" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entityItems.map(item => {
                      const itemCompleted = CHECKPOINTS.filter(cp => item[cp.key]).length;
                      const itemPct = Math.round((itemCompleted / CHECKPOINTS.length) * 100);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{item.writer_name}</div>
                            {item.original_publisher && (
                              <div className="text-xs text-muted-foreground">{item.original_publisher}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.administrator || '—'}
                          </TableCell>
                          {CHECKPOINTS.map(cp => (
                            <TableCell key={cp.key} className="text-center">
                              <Checkbox
                                checked={item[cp.key]}
                                disabled={readOnly}
                                onCheckedChange={() => !readOnly && toggleCheckpoint(item.id, cp.key, item[cp.key])}
                              />
                            </TableCell>
                          ))}
                          {!readOnly && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
