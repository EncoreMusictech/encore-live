import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, DollarSign, Users, TrendingUp } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { EnhancedPayoutForm } from "@/components/royalties/EnhancedPayoutForm";
import { PayoutList } from "@/components/royalties/PayoutList";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";

export default function PayoutsPage() {
  const [showForm, setShowForm] = useState(false);
  const { payouts, loading } = usePayouts();

  useEffect(() => {
    updatePageMetadata('payouts');
  }, []);

  const totalPayouts = payouts.reduce((sum, payout) => sum + payout.net_payable, 0);
  const pendingPayouts = payouts.filter(payout => payout.status === 'pending').length;
  const paidPayouts = payouts.filter(payout => payout.status === 'paid').length;
  const approvedPayouts = payouts.filter(payout => payout.status === 'approved').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payouts & Client Accounting</h1>
            <p className="text-muted-foreground mt-2">
              Handle periodic statements and payments for clients
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Payout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{approvedPayouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayouts.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Payout</CardTitle>
                <CardDescription>
                  Generate a new payout statement for a client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedPayoutForm onCancel={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Client Payouts</CardTitle>
              <CardDescription>
                Manage periodic statements and payments for clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}