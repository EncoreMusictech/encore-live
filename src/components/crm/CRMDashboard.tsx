import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  FileText, 
  Copyright, 
  Film, 
  DollarSign, 
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { QuickStartGuide } from "@/components/tour/QuickStartGuide";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  contracts: number;
  copyrights: number;
  syncDeals: number;
  totalRevenue: number;
  catalogValue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'urgent';
}

export function CRMDashboard() {
  const { user } = useAuth();
  const { subscription_tier } = useSubscription();
  const { isAdmin } = useUserRoles();
  const { isDemo } = useDemoAccess();
  
  // Debug logging for isDemo status
  console.log('🔍 CRMDashboard - Debug Info:', {
    userEmail: user?.email,
    isDemo,
    isAdmin,
    shouldShowQuickStart: isDemo
  });
  const [stats, setStats] = useState<DashboardStats>({
    contracts: 0,
    copyrights: 0,
    syncDeals: 0,
    totalRevenue: 0,
    catalogValue: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userModules, setUserModules] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch user modules
        const { data: moduleData } = await supabase
          .from('user_module_access')
          .select('module_id')
          .eq('user_id', user.id);

        setUserModules(moduleData?.map(item => item.module_id) || []);

        // Fetch real stats from user's data
        const [contractsResult, copyrightsResult, syncResult, royaltiesResult, catalogResult] = await Promise.all([
          // Count contracts
          supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          
          // Count copyrights
          supabase
            .from('copyrights')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          
          // Count sync licenses
          supabase
            .from('sync_licenses')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          
          // Sum total royalties
          supabase
            .from('royalty_allocations')
            .select('gross_royalty_amount')
            .eq('user_id', user.id),
          
          // Get catalog valuations total
          supabase
            .from('catalog_valuations')
            .select('valuation_amount')
            .eq('user_id', user.id)
        ]);

        // Calculate total revenue from royalties
        const totalRevenue = royaltiesResult.data?.reduce((sum, allocation) => 
          sum + (Number(allocation.gross_royalty_amount) || 0), 0) || 0;

        // Calculate total catalog value
        const totalCatalogValue = catalogResult.data?.reduce((sum, valuation) => 
          sum + (Number(valuation.valuation_amount) || 0), 0) || 0;

        setStats({
          contracts: contractsResult.count || 0,
          copyrights: copyrightsResult.count || 0,
          syncDeals: syncResult.count || 0,
          totalRevenue: Math.round(totalRevenue),
          catalogValue: Math.round(totalCatalogValue)
        });

        // Fetch recent activity from actual data
        const { data: recentContracts } = await supabase
          .from('contracts')
          .select('id, title, counterparty_name, created_at, contract_status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const activities: RecentActivity[] = [];
        
        // Add recent contracts
        recentContracts?.forEach(contract => {
          activities.push({
            id: contract.id,
            type: 'contract',
            title: `${contract.title} - ${contract.counterparty_name}`,
            description: `Contract status: ${contract.contract_status}`,
            timestamp: new Date(contract.created_at).toLocaleDateString(),
            status: contract.contract_status === 'signed' ? 'completed' : 'pending'
          });
        });

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const modules = [
    {
      id: 'contract-management',
      title: 'Contracts',
      description: 'Active agreements',
      icon: FileText,
      url: '/dashboard/contracts',
      value: stats.contracts.toString(),
      change: '+3'
    },
    {
      id: 'copyright-management',
      title: 'Copyright',
      description: 'Registered works',
      icon: Copyright,
      url: '/dashboard/copyright',
      value: stats.copyrights.toString(),
      change: '+8'
    },
    {
      id: 'sync-licensing',
      title: 'Sync Licensing',
      description: 'Active deals',
      icon: Film,
      url: '/dashboard/sync',
      value: stats.syncDeals.toString(),
      change: '+2'
    },
    {
      id: 'royalties-processing',
      title: 'Royalties',
      description: 'Total revenue this month',
      icon: DollarSign,
      url: '/dashboard/royalties',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: '+15%'
    }
  ];

  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
  const isAdministrator = adminEmails.includes(user?.email?.toLowerCase() || '') || isAdmin;
  const accessibleModules = isAdministrator 
    ? modules 
    : modules.filter(module => userModules.includes(module.id));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract': return FileText;
      case 'sync': return Film;
      case 'royalty': return DollarSign;
      default: return Calendar;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'urgent': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'urgent': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            {isDemo 
              ? "Explore full-featured demo data including contracts, royalties, and sync licensing tools"
              : "Manage your music business operations, track contracts, process royalties, and grow your catalog"
            }
          </p>
        </div>
        {subscription_tier && (
          <Badge className="bg-gradient-primary text-primary-foreground">
            {subscription_tier} Plan
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Users: Show Quick Start Guide */}
        {isDemo && (
          <div className="lg:col-span-2 flex justify-center">
            <QuickStartGuide />
          </div>
        )}
      </div>

      {/* Module Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {accessibleModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={module.url}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="text-sm text-success font-medium">
                      {module.change}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {module.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{module.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {module.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across all modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const StatusIcon = getStatusIcon(activity.status);
              const statusColor = getStatusColor(activity.status);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <ActivityIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/contracts">
                <FileText className="mr-2 h-4 w-4" />
                Create New Contract
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/copyright">
                <Copyright className="mr-2 h-4 w-4" />
                Register Copyright
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/sync">
                <Film className="mr-2 h-4 w-4" />
                Log Sync Opportunity
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/royalties">
                <DollarSign className="mr-2 h-4 w-4" />
                Process Royalties
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/catalog-valuation">
                <TrendingUp className="mr-2 h-4 w-4" />
                Run Catalog Valuation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}