import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserCheck, Clock, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";

export default function CRMClientsPage() {
  const { isAdmin } = useUserRoles();
  
  const [clientStats] = useState({
    totalClients: 45,
    activeClients: 38,
    pendingInvites: 7,
    totalRevenue: 850000
  });

  const recentClients = [
    {
      id: 1,
      name: "Midnight Records",
      type: "Label",
      status: "active",
      modules: ["copyright", "royalties"],
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      type: "Artist",
      status: "pending",
      modules: ["contracts", "sync-licensing"],
      lastActive: "Never"
    },
    {
      id: 3,
      name: "Harmony Publishing",
      type: "Publisher",
      status: "active",
      modules: ["copyright", "contracts", "royalties"],
      lastActive: "1 day ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "pending": return "bg-orange-500 text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Only administrators can access client management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Portal Management</h1>
          <p className="text-muted-foreground">
            Manage client access and portal permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/client-portal">
            <Plus className="mr-2 h-4 w-4" />
            Invite Client
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+5</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.totalClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Clients</p>
            <p className="text-xs text-muted-foreground">All registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">Active</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.activeClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Clients</p>
            <p className="text-xs text-muted-foreground">Currently using portal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm text-orange-600 font-medium">Pending</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.pendingInvites}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Pending Invites</p>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+12%</span>
            </div>
            <CardTitle className="text-2xl font-bold">${clientStats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Client Revenue</p>
            <p className="text-xs text-muted-foreground">Total managed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Client List</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>
                Latest client portal activity and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{client.name}</h4>
                          <Badge variant="outline">{client.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Modules: {client.modules.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {client.lastActive}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                        <div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link to="/client-portal">
                    View All Clients
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Permissions</CardTitle>
              <CardDescription>
                Configure which modules clients can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Available Modules</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Copyright Management</span>
                      <Badge variant="secondary">38 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Contract Management</span>
                      <Badge variant="secondary">25 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Royalties Processing</span>
                      <Badge variant="secondary">42 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Sync Licensing</span>
                      <Badge variant="secondary">15 clients</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Permission Levels</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded">
                      <div className="font-medium">View Only</div>
                      <div className="text-sm text-muted-foreground">Read-only access to data</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Full Access</div>
                      <div className="text-sm text-muted-foreground">Complete module functionality</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Custom</div>
                      <div className="text-sm text-muted-foreground">Granular permission control</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Portal Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">84%</div>
                <p className="text-muted-foreground text-sm">Active client usage rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Most Used Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Royalties</div>
                <p className="text-muted-foreground text-sm">42 clients accessing</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Client Engagement</CardTitle>
              <CardDescription>
                Portal usage trends and client activity metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>Client analytics dashboard coming soon</p>
                <p className="text-sm">Track portal usage and engagement metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}