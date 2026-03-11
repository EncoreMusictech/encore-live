import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Building2 } from 'lucide-react';

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
  entity_name: string | null;
  writer_name: string;
  [key: string]: any;
}

interface CompanyOption {
  id: string;
  name: string;
  display_name: string;
}

export function SuccessAnalyticsDashboard() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch companies that have onboarding progress
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('client_onboarding_progress')
        .select('company_id, companies:company_id(id, name, display_name)')
        .order('created_at', { ascending: false });

      if (data) {
        const mapped = data
          .map((d: any) => d.companies)
          .filter(Boolean)
          .filter((v: any, i: number, a: any[]) => a.findIndex((x: any) => x.id === v.id) === i);
        setCompanies(mapped);
        if (mapped.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(mapped[0].id);
        }
      }
    };
    fetchCompanies();
  }, []);

  // Fetch tracking items for selected company
  const fetchItems = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('migration_tracking_items')
      .select('*')
      .eq('company_id', selectedCompanyId)
      .order('entity_name')
      .order('writer_name');
    setItems((data as TrackingItem[]) || []);
    setLoading(false);
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Stats
  const totalCheckpoints = items.length * CHECKPOINTS.length;
  const completedCheckpoints = items.reduce((acc, item) => {
    return acc + CHECKPOINTS.filter(cp => item[cp.key]).length;
  }, 0);
  const overallPct = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  const checkpointStats = CHECKPOINTS.map(cp => {
    const completed = items.filter(i => i[cp.key]).length;
    return { ...cp, completed, total: items.length, pct: items.length > 0 ? Math.round((completed / items.length) * 100) : 0 };
  });

  // Entity breakdown
  const entityGroups = items.reduce<Record<string, TrackingItem[]>>((acc, item) => {
    const group = item.entity_name || 'Unassigned';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No onboarding clients with migration tracking data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Sub-Account:</span>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select sub-account..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.display_name || c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No migration tracking items for this sub-account.</p>
          <p className="text-xs mt-1">Add writers via the sub-account's Migration Tracker tab.</p>
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Migration Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{overallPct}%</div>
              <Progress value={overallPct} className="h-3 mb-2" />
              <p className="text-xs text-muted-foreground">
                {completedCheckpoints} / {totalCheckpoints} checkpoints across {items.length} writers
              </p>
            </CardContent>
          </Card>

          {/* Checkpoint breakdown */}
          <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
            {checkpointStats.map(cp => (
              <Card key={cp.key}>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">{cp.pct}%</div>
                  <div className="text-xs text-muted-foreground">{cp.label}</div>
                  <div className="text-xs text-muted-foreground">{cp.completed}/{cp.total}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entity breakdown */}
          {Object.entries(entityGroups).map(([entityName, entityItems]) => {
            const entityTotal = entityItems.length * CHECKPOINTS.length;
            const entityCompleted = entityItems.reduce((acc, item) => acc + CHECKPOINTS.filter(cp => item[cp.key]).length, 0);
            const entityPct = entityTotal > 0 ? Math.round((entityCompleted / entityTotal) * 100) : 0;

            return (
              <Card key={entityName}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{entityName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entityItems.length} writers</Badge>
                      <Badge variant={entityPct === 100 ? 'default' : 'secondary'}>{entityPct}%</Badge>
                    </div>
                  </div>
                  <Progress value={entityPct} className="h-1.5" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Writer</TableHead>
                          {CHECKPOINTS.map(cp => (
                            <TableHead key={cp.key} className="text-center text-xs px-1">{cp.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entityItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs font-medium">{item.writer_name}</TableCell>
                            {CHECKPOINTS.map(cp => (
                              <TableCell key={cp.key} className="text-center px-1">
                                {item[cp.key] ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive/40 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
