import { useEffect, useState } from 'react';
import { Building2, DollarSign, FileText, Music, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/contexts/ViewModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  worksCount: number;
  contractsCount: number;
  payeesCount: number;
  unregisteredWorks: number;
  pendingBalance: number;
}

export default function ClientLabelDashboard() {
  const { viewContext, isViewingAsClient, exitViewMode } = useViewMode();
  const [stats, setStats] = useState<DashboardStats>({
    worksCount: 0,
    contractsCount: 0,
    payeesCount: 0,
    unregisteredWorks: 0,
    pendingBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (viewContext?.companyId) {
      fetchStats();
    }
  }, [viewContext?.companyId]);

  const fetchStats = async () => {
    if (!viewContext?.companyId) return;
    
    setLoading(true);
    try {
      // Fetch works count
      const { count: worksCount } = await supabase
        .from('copyrights')
        .select('*', { count: 'exact', head: true })
        .eq('client_company_id', viewContext.companyId);

      // Fetch contracts count
      const { count: contractsCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('client_company_id', viewContext.companyId);

      // Fetch payees count
      const { count: payeesCount } = await supabase
        .from('payees')
        .select('*', { count: 'exact', head: true })
        .eq('client_company_id', viewContext.companyId);

      // Fetch unregistered works
      const { count: unregisteredCount } = await supabase
        .from('copyrights')
        .select('*', { count: 'exact', head: true })
        .eq('client_company_id', viewContext.companyId)
        .or('registration_status.is.null,registration_status.eq.pending');

      setStats({
        worksCount: worksCount || 0,
        contractsCount: contractsCount || 0,
        payeesCount: payeesCount || 0,
        unregisteredWorks: unregisteredCount || 0,
        pendingBalance: 0
      });
    } catch (error) {
      console.error('Error fetching client dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isViewingAsClient || !viewContext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Client View Required</h3>
            <p className="text-muted-foreground mb-4">
              This dashboard is only available when viewing as a specific client label.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Main Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{viewContext.companyName}</h1>
              <p className="text-sm text-muted-foreground">
                {viewContext.parentCompanyName && (
                  <>Managed by {viewContext.parentCompanyName}</>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Client Label</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/dashboard/copyright')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Works</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.worksCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Copyrighted works</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/dashboard/contracts')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contractsCount}</div>
              <p className="text-xs text-muted-foreground">Active agreements</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/dashboard/royalties')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pending payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payees</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.payeesCount}</div>
              <p className="text-xs text-muted-foreground">Registered payees</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {stats.unregisteredWorks > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Action Required
            </CardTitle>
            <CardDescription>
              You have {stats.unregisteredWorks} works that need PRO registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/copyright')}>
              View Unregistered Works
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/dashboard/copyright')}>
              <Music className="h-5 w-5 mb-2" />
              <span>View Works</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/dashboard/contracts')}>
              <FileText className="h-5 w-5 mb-2" />
              <span>Contracts</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/dashboard/royalties')}>
              <DollarSign className="h-5 w-5 mb-2" />
              <span>Royalties</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => navigate('/dashboard/sync')}>
              <BarChart3 className="h-5 w-5 mb-2" />
              <span>Sync Licenses</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
