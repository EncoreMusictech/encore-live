import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calculator,
  TrendingUp,
  FileText,
  Copyright,
  Film,
  DollarSign,
  Users,
  Home,
  Settings,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";

interface ModuleItem {
  id: string;
  title: string;
  url: string;
  icon: any;
  description?: string;
  adminOnly?: boolean;
}

const mainModules: ModuleItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/crm",
    icon: LayoutDashboard,
    description: "Overview & Analytics"
  },
  {
    id: "catalog-valuation",
    title: "Catalog Valuation",
    url: "/crm/catalog-valuation",
    icon: TrendingUp,
    description: "AI-powered catalog assessment"
  },
  {
    id: "contract-management",
    title: "Contracts",
    url: "/crm/contracts",
    icon: FileText,
    description: "Agreement management"
  },
  {
    id: "copyright-management",
    title: "Copyright",
    url: "/crm/copyright",
    icon: Copyright,
    description: "Rights management"
  },
  {
    id: "sync-licensing",
    title: "Sync Licensing",
    url: "/crm/sync",
    icon: Film,
    description: "Sync deal tracking"
  },
  {
    id: "royalties-processing",
    title: "Royalties",
    url: "/crm/royalties",
    icon: DollarSign,
    description: "Processing & payouts"
  },
];

const adminModules: ModuleItem[] = [
  {
    id: "client-portal",
    title: "Client Portal",
    url: "/crm/clients",
    icon: Users,
    description: "Client management",
    adminOnly: true
  }
];

export function CRMSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const location = useLocation();
  const [userModules, setUserModules] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

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

  const isAdministrator = user?.email === 'info@encoremusic.tech' || isAdmin;
  
  // Include admin modules if user is admin
  const availableModules = isAdmin ? [...mainModules, ...adminModules] : mainModules;
  
  // Filter modules based on user access
  const accessibleModules = isAdministrator 
    ? availableModules 
    : availableModules.filter(module => 
        module.id === 'dashboard' || userModules.includes(module.id)
      );

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg">ENCORE</h2>
              <p className="text-xs text-muted-foreground">Music Rights CRM</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleModules.map((module) => {
                const IconComponent = module.icon;
                const active = isActive(module.url);
                
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton asChild className={active ? "bg-sidebar-accent" : ""}>
                      <Link to={module.url} className="flex items-center">
                        <IconComponent className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <span className="font-medium">{module.title}</span>
                        )}
                        {module.adminOnly && !collapsed && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            Admin
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {accessibleModules.length} of {mainModules.length + (isAdmin ? adminModules.length : 0)} modules active
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}