import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BarChart3, Calculator, TrendingUp, FileText, Copyright, Film, DollarSign, Lock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ModuleType {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: string;
  path: string;
  subModules?: { title: string; path: string; }[];
  adminOnly?: boolean;
}

const ModulesPage = () => {
  const { user } = useAuth();
  const { subscribed, subscription_tier, loading: subscriptionLoading } = useSubscription();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  const [userModules, setUserModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updatePageMetadata('modules');
  }, []);

  useEffect(() => {
    const fetchUserModules = async () => {
      if (!user) {
        setUserModules([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_module_access')
          .select('module_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user modules:', error);
          toast({
            title: "Error",
            description: "Failed to load your modules",
            variant: "destructive",
          });
          return;
        }

        setUserModules(data?.map(item => item.module_id) || []);
      } catch (error) {
        console.error('Error fetching user modules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserModules();
  }, [user, toast]);

  const allModules: ModuleType[] = [
    {
      id: "catalog-valuation",
      title: "Catalog Valuation",
      description: "AI-powered catalog assessment with 3-5 year forecasting and deal simulation tools",
      icon: TrendingUp,
      status: "Active",
      path: "/catalog-valuation",
      subModules: [
        { title: "Catalog Valuation", path: "/catalog-valuation" },
        { title: "Deal Simulator", path: "/deal-simulator" }
      ]
    },
    {
      id: "contract-management",
      title: "Contract Management",
      description: "Manage music industry agreements with smart contract features",
      icon: FileText,
      status: "Active",
      path: "/contract-management"
    },
    {
      id: "copyright-management",
      title: "Copyright Management",
      description: "Register and track copyrights with split assignments and metadata management",
      icon: Copyright,
      status: "Active",
      path: "/copyright-management"
    },
    {
      id: "sync-licensing",
      title: "Sync Licensing Tracker",
      description: "Comprehensive sync deal pipeline with pitch tracking and deal memo generation",
      icon: Film,
      status: "Active",
      path: "/sync-licensing"
    },
    {
      id: "royalties-processing",
      title: "Royalties Processing",
      description: "Complete royalty management system from reconciliation to payouts",
      icon: DollarSign,
      status: "Active",
      path: "/reconciliation",
      subModules: [
        { title: "Reconciliation", path: "/reconciliation" },
        { title: "Royalties Allocation", path: "/royalties" },
        { title: "Payouts & Client Accounting", path: "/payouts" }
      ]
    }
  ];

  // Admin-only modules
  const adminModules: ModuleType[] = [
    {
      id: "client-portal",
      title: "Client Portal",
      description: "Secure tier-based access for artists, managers, and vendors with custom views",
      icon: Users,
      status: "Active",
      path: "/client-portal",
      adminOnly: true
    }
  ];

  // Check if user has paid subscription access
  const isAdministrator = user?.email === 'info@encoremusic.tech' || isAdmin;
  const hasPaidAccess = isAdministrator || subscribed;
  
  // Include admin modules if user is admin
  const availableModules = isAdmin ? [...allModules, ...adminModules] : allModules;
  
  const subscribedModules = isAdministrator ? availableModules : availableModules.filter(module => 
    userModules.includes(module.id)
  );

  if (loading || subscriptionLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your modules...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">My Modules</h1>
            <p className="text-muted-foreground mb-4">Please sign in to view your modules.</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-subscribers to pricing page
  if (!hasPaidAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Subscription Required</h1>
              <p className="text-muted-foreground mb-6">
                Access to modules is restricted to paid subscribers. Upgrade your account to unlock powerful music industry tools.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link to="/pricing">View Pricing Plans</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Modules</h1>
              <p className="text-muted-foreground">Manage your subscribed modules and access powerful music industry tools.</p>
            </div>
            {subscription_tier && (
              <Badge className="bg-gradient-primary text-primary-foreground">
                {subscription_tier} Plan
              </Badge>
            )}
          </div>
        </div>

        {subscribedModules.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No modules found</h2>
            <p className="text-muted-foreground mb-6">You don't have access to any modules yet.</p>
            <Button asChild>
              <Link to="/pricing">Browse Modules</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscribedModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-primary rounded-lg p-2 w-fit">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {module.status}
                      </Badge>
                      {module.adminOnly && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Admin Only
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={module.path}>
                      Open Module
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesPage;