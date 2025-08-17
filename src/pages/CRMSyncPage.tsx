import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Film, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

export default function CRMSyncPage() {
  const [syncDeals, setSyncDeals] = useState([
    {
      id: 1,
      title: "Netflix Series - 'Midnight Dreams'",
      artist: "Luna Bay",
      project: "Dark Waters S2E5",
      status: "negotiating",
      value: 15000,
      dueDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Commercial - 'Summer Vibes'",
      artist: "The Collective",
      project: "Nike Summer Campaign",
      status: "approved",
      value: 25000,
      dueDate: "2024-01-10"
    },
    {
      id: 3,
      title: "Film Score - 'Revolution'",
      artist: "Marcus Steel",
      project: "Independent Film",
      status: "pending",
      value: 8000,
      dueDate: "2024-01-20"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-success-foreground";
      case "negotiating": return "bg-orange-500 text-white";
      case "pending": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const totalValue = syncDeals.reduce((sum, deal) => sum + deal.value, 0);
  const approvedDeals = syncDeals.filter(deal => deal.status === "approved").length;
  const pendingDeals = syncDeals.filter(deal => deal.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Sync Licensing</h1>
          <p className="text-muted-foreground">
            Track sync opportunities and manage licensing deals
          </p>
        </div>
        <Button asChild>
          <Link to="/sync-licensing">
            <Plus className="mr-2 h-4 w-4" />
            New Sync Deal
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Film className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+3</span>
            </div>
            <CardTitle className="text-2xl font-bold">{syncDeals.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Deals</p>
            <p className="text-xs text-muted-foreground">Total sync opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+15%</span>
            </div>
            <CardTitle className="text-2xl font-bold">${totalValue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Value</p>
            <p className="text-xs text-muted-foreground">Combined deal value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+2</span>
            </div>
            <CardTitle className="text-2xl font-bold">{approvedDeals}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Approved</p>
            <p className="text-xs text-muted-foreground">Ready for execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm text-orange-600 font-medium">{pendingDeals}</span>
            </div>
            <CardTitle className="text-2xl font-bold">{pendingDeals}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Pending</p>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sync Deals</CardTitle>
              <CardDescription>
                Current sync licensing opportunities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncDeals.map((deal) => (
                  <div key={deal.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">by {deal.artist}</p>
                        <p className="text-sm">{deal.project}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status}
                        </Badge>
                        <div className="text-lg font-bold">${deal.value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Due: {deal.dueDate}</span>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Calendar</CardTitle>
              <CardDescription>
                Upcoming deadlines and important dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Calendar view coming soon</p>
                <p className="text-sm">Track sync deal deadlines and milestones</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">67%</div>
                <p className="text-muted-foreground text-sm">Deals closed successfully</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Deal Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${Math.round(totalValue / syncDeals.length).toLocaleString()}</div>
                <p className="text-muted-foreground text-sm">Per sync license</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                Sync licensing revenue and deal volume trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>Analytics charts coming soon</p>
                <p className="text-sm">Track performance metrics and trends</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}