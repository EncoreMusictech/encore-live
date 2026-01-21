import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Calculator, TrendingUp, FileText, Copyright, Film, DollarSign, Users, Settings, CreditCard, LayoutDashboard, HelpCircle, Monitor, Coins } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import encoreLogo from "@/assets/encore-logo.png";
interface ModuleItem {
  id: string;
  title: string;
  url: string;
  icon: any;
  description?: string;
  adminOnly?: boolean;
}
const mainModules: ModuleItem[] = [{
  id: "dashboard",
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard,
  description: "Overview & Analytics"
}, {
  id: "catalog-valuation",
  title: "Catalog Valuation",
  url: "/dashboard/catalog-valuation",
  icon: TrendingUp,
  description: "AI-powered catalog assessment"
}, {
  id: "contract-management",
  title: "Contracts",
  url: "/dashboard/contracts",
  icon: FileText,
  description: "Agreement management"
}, {
  id: "copyright-management",
  title: "Copyright",
  url: "/dashboard/copyright",
  icon: Copyright,
  description: "Rights management"
}, {
  id: "sync-licensing",
  title: "Sync Licensing",
  url: "/dashboard/sync",
  icon: Film,
  description: "Sync deal tracking"
}, {
  id: "royalties-processing",
  title: "Royalties",
  url: "/dashboard/royalties",
  icon: DollarSign,
  description: "Processing & payouts"
}];
const adminModules: ModuleItem[] = [{
  id: "client-portal",
  title: "Client Portal",
  url: "/dashboard/client-admin",
  icon: Users,
  description: "Client management",
  adminOnly: true
}, {
  id: "operations",
  title: "Operations",
  url: "/dashboard/operations",
  icon: Monitor,
  description: "Business analytics",
  adminOnly: true
}, {
  id: "digital-rights-blockchain",
  title: "NFT Minting",
  url: "/dashboard/blockchain",
  icon: Coins,
  description: "Blockchain asset management",
  adminOnly: true
}];

const quickActions: ModuleItem[] = [
  {
    id: "walkthroughs",
    title: "Module Walkthroughs",
    url: "/dashboard/walkthroughs",
    icon: HelpCircle,
    description: "Interactive tutorials for each module"
  }
];
export function CRMSidebar() {
  const {
    user
  } = useAuth();
  const {
    isAdmin
  } = useUserRoles();
  const {
    canAccess: canAccessDemo,
    isDemo
  } = useDemoAccess();
  const { isSuperAdmin } = useSuperAdmin();
  const location = useLocation();
  const [userModules, setUserModules] = useState<string[]>([]);
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  useEffect(() => {
    const fetchUserModules = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_module_access')
          .select('module_id')
          .eq('user_id', user.id);
        setUserModules(data?.map(item => item.module_id) || []);
      } catch (error) {
        console.error('Error fetching user modules:', error);
      }
    };
    fetchUserModules();
  }, [user]);
  // Regular admin modules (without Super Admin)
  const regularAdminModules = adminModules.filter(module => module.id !== 'platform-admin');
  
  // Super admin modules (only platform-admin)
  const superAdminModules = adminModules.filter(module => module.id === 'platform-admin');

  // Include modules based on user privileges
  let availableModules = [...mainModules];
  
  // Add regular admin modules for admins
  if (isAdmin) {
    availableModules = [...availableModules, ...regularAdminModules];
  }
  
  // Add super admin modules only for super admins (Encore team)
  if (isSuperAdmin) {
    availableModules = [...availableModules, ...superAdminModules];
  }

  // Filter modules based on user access or demo access
  const accessibleModules = (isAdmin || isSuperAdmin) ? availableModules : availableModules.filter(module => {
    if (module.id === 'dashboard') return true;
    // Check if user has database access or demo access
    // Map module IDs to demo access keys
    const demoKey = module.id === 'royalties-processing' ? 'royaltiesProcessing' : module.id === 'catalog-valuation' ? 'catalogValuation' : module.id === 'contract-management' ? 'contractManagement' : module.id === 'copyright-management' ? 'copyrightManagement' : module.id === 'sync-licensing' ? 'syncLicensing' : module.id === 'client-portal' ? 'clientPortal' : module.id;
    return userModules.includes(module.id) || canAccessDemo(demoKey);
  });
  const isActive = (path: string) => location.pathname === path;
  return <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && <div className="flex items-center space-x-2">
            <img src={encoreLogo} alt="Encore Logo" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="font-headline font-bold text-lg">ENCORE</h2>
              <p className="text-xs text-muted-foreground">Rights Management System</p>
            </div>
          </div>}
        {collapsed && <img src={encoreLogo} alt="Encore Logo" className="w-8 h-8 object-contain mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleModules.map(module => {
              const IconComponent = module.icon;
              const active = isActive(module.url);
              return <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton asChild className={active ? "bg-sidebar-accent" : ""}>
                      <Link to={module.url} className="flex items-center">
                        <IconComponent className="mr-2 h-4 w-4" />
                        {!collapsed && <span className="font-medium">{module.title}</span>}
                        {module.adminOnly && !collapsed && <Badge variant="outline" className="text-xs ml-auto">
                            Admin
                          </Badge>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isDemo && <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/dashboard/walkthroughs" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Module Walkthroughs
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/pricing" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/contact" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Support
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {accessibleModules.length} of {mainModules.length + (isAdmin ? regularAdminModules.length : 0) + (isSuperAdmin ? superAdminModules.length : 0)} modules active
            </p>
          </div>}
      </SidebarFooter>
    </Sidebar>;
}