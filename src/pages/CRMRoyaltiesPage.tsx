import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, FileText, CreditCard, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";
import { Link } from "react-router-dom";

export default function CRMRoyaltiesPage() {
  const [royaltyStats, setRoyaltyStats] = useState({
    totalEarnings: 125000,
    pendingPayouts: 45000,
    processedStatements: 156,
    activePayees: 23
  });

  const recentActivity = [
    {
      id: 1,
      type: "payout",
      description: "Quarterly payout processed for Artist XYZ",
      amount: 5000,
      date: "2024-01-10"
    },
    {
      id: 2,
      type: "statement",
      description: "Spotify royalty statement processed",
      amount: 12000,
      date: "2024-01-09"
    },
    {
      id: 3,
      type: "allocation",
      description: "New royalty allocation created",
      amount: 8000,
      date: "2024-01-08"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Royalties Processing</h1>
          <p className="text-muted-foreground">
            Manage royalty reconciliation, allocation, and payouts
          </p>
        </div>
        <Button asChild>
          <Link to="/royalties">
            <Plus className="mr-2 h-4 w-4" />
            New Allocation
          </Link>
        </Button>
      </div>

      {/* Module Navigation */}
      <RoyaltiesModuleNav />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+15%</span>
            </div>
            <CardTitle className="text-2xl font-bold">${royaltyStats.totalEarnings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Earnings</p>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm text-orange-600 font-medium">Pending</span>
            </div>
            <CardTitle className="text-2xl font-bold">${royaltyStats.pendingPayouts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Pending Payouts</p>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+12</span>
            </div>
            <CardTitle className="text-2xl font-bold">{royaltyStats.processedStatements}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Statements Processed</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+3</span>
            </div>
            <CardTitle className="text-2xl font-bold">{royaltyStats.activePayees}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Payees</p>
            <p className="text-xs text-muted-foreground">Receiving royalties</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest royalty processing activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${activity.amount.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common royalty processing tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/reconciliation">
                    <FileText className="mr-2 h-4 w-4" />
                    Import Royalty Statement
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/royalties">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Create Allocation
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/payouts">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Process Payout
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statement Reconciliation</CardTitle>
              <CardDescription>
                Import and reconcile royalty statements from DSPs and PROs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No statements to reconcile</h3>
                <p className="text-muted-foreground mb-4">
                  Import royalty statements to begin reconciliation process
                </p>
                <Button asChild>
                  <Link to="/reconciliation">
                    Go to Reconciliation Module
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Royalty Allocations</CardTitle>
              <CardDescription>
                Manage how royalties are split between rights holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No allocations found</h3>
                <p className="text-muted-foreground mb-4">
                  Create allocations to distribute royalties to rights holders
                </p>
                <Button asChild>
                  <Link to="/royalties">
                    Create First Allocation
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>
                Process payments to artists, writers, and rights holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pending payouts</h3>
                <p className="text-muted-foreground mb-4">
                  Process royalty allocations to generate payouts
                </p>
                <Button asChild>
                  <Link to="/payouts">
                    Go to Payouts Module
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}