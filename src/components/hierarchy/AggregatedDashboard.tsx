import { useEffect, useState } from 'react';
import { Building2, DollarSign, FileText, AlertTriangle, Music, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ClientStats {
  companyId: string;
  companyName: string;
  worksCount: number;
  contractsCount: number;
  totalBalance: number;
  unregisteredWorks: number;
  missingMetadata: number;
}

interface AggregatedDashboardProps {
  className?: string;
}

export function AggregatedDashboard({ className }: AggregatedDashboardProps) {
  const { viewContext, isAggregateView } = useViewMode();
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalWorks: 0,
    totalContracts: 0,
    totalBalance: 0,
    totalUnregistered: 0,
    totalMissingMetadata: 0
  });

  const parentCompanyId = viewContext?.parentCompanyId || viewContext?.companyId;
  const { childCompanies } = useClientHierarchy(parentCompanyId || undefined);

  useEffect(() => {
    if (isAggregateView && childCompanies.length > 0) {
      fetchAggregatedStats();
    }
  }, [isAggregateView, childCompanies]);

  const fetchAggregatedStats = async () => {
    setLoading(true);
    
    try {
      const stats: ClientStats[] = [];
      
      for (const client of childCompanies) {
        // Fetch works count
        const { count: worksCount } = await supabase
          .from('copyrights')
          .select('*', { count: 'exact', head: true })
          .eq('client_company_id', client.company_id);

        // Fetch contracts count
        const { count: contractsCount } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('client_company_id', client.company_id);

        // Fetch unregistered works (missing PRO registration)
        const { count: unregisteredCount } = await supabase
          .from('copyrights')
          .select('*', { count: 'exact', head: true })
          .eq('client_company_id', client.company_id)
          .or('registration_status.is.null,registration_status.eq.pending');

        stats.push({
          companyId: client.company_id,
          companyName: client.display_name || client.company_name,
          worksCount: worksCount || 0,
          contractsCount: contractsCount || 0,
          totalBalance: 0, // Would need to join with payout data
          unregisteredWorks: unregisteredCount || 0,
          missingMetadata: 0 // Would need more complex query
        });
      }

      setClientStats(stats);
      
      // Calculate totals
      const totalWorks = stats.reduce((sum, s) => sum + s.worksCount, 0);
      const totalContracts = stats.reduce((sum, s) => sum + s.contractsCount, 0);
      const totalBalance = stats.reduce((sum, s) => sum + s.totalBalance, 0);
      const totalUnregistered = stats.reduce((sum, s) => sum + s.unregisteredWorks, 0);
      const totalMissingMetadata = stats.reduce((sum, s) => sum + s.missingMetadata, 0);

      setTotals({
        totalWorks,
        totalContracts,
        totalBalance,
        totalUnregistered,
        totalMissingMetadata
      });
    } catch (error) {
      console.error('Error fetching aggregated stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAggregateView) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalWorks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalContracts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined payables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unregistered</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totals.totalUnregistered}</div>
            <p className="text-xs text-muted-foreground">Need PRO registration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childCompanies.length}</div>
            <p className="text-xs text-muted-foreground">Under management</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Works by Client
          </CardTitle>
          <CardDescription>
            Distribution of copyrighted works across client labels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientStats.map((client) => {
              const percentage = totals.totalWorks > 0 
                ? (client.worksCount / totals.totalWorks) * 100 
                : 0;
              
              return (
                <div key={client.companyId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{client.companyName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{client.worksCount} works</span>
                      <span className="w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attention Required */}
      {totals.totalUnregistered > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
            <CardDescription>
              Works that need attention across your client labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientStats.filter(c => c.unregisteredWorks > 0).map((client) => (
                <div 
                  key={client.companyId}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{client.companyName}</span>
                  </div>
                  <div className="text-sm text-warning font-medium">
                    {client.unregisteredWorks} unregistered
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
