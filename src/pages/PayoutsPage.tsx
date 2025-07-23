import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, DollarSign, Users, TrendingUp } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { useExpenses } from "@/hooks/useExpenses";
import { EnhancedPayoutForm } from "@/components/royalties/EnhancedPayoutForm";
import { PayoutList } from "@/components/royalties/PayoutList";
import { PayoutListDemo } from "@/components/royalties/PayoutListDemo";
import { PayeesTable } from "@/components/royalties/PayeesTable";
import { ExpensesTable } from "@/components/royalties/ExpensesTable";
import { AccountBalancesTable } from "@/components/royalties/AccountBalancesTable";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PayoutsPage() {
  const [showForm, setShowForm] = useState(false);
  const { payouts, loading, createPayout } = usePayouts();
  const { expenses } = useExpenses();

  const createDemoData = async () => {
    // First, let's check if we have any contacts to use as clients
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('contact_type', 'client')
      .limit(2);

    if (!contacts || contacts.length === 0) {
      toast({
        title: "No Clients Found",
        description: "Please create some client contacts first in the Contracts module",
        variant: "destructive",
      });
      return;
    }

    const demoPayouts = [
      {
        client_id: contacts[0]?.id, 
        period: 'Q4 2024', 
        gross_royalties: 15000, 
        total_expenses: 2250, 
        net_payable: 12750, 
        amount_due: 12750,
        payment_method: 'ACH', 
        workflow_stage: 'pending_review'
      },
      {
        client_id: contacts[1]?.id || contacts[0]?.id, 
        period: 'Q3 2024', 
        gross_royalties: 8500,
        total_expenses: 1275, 
        net_payable: 7225, 
        amount_due: 7225,
        payment_method: 'Wire', 
        workflow_stage: 'approved'
      }
    ];
    
    for (const payout of demoPayouts) {
      try { 
        await createPayout(payout); 
        toast({
          title: "Demo Data Created",
          description: `Sample payout for ${payout.period} created successfully`,
        });
      } catch (e) { 
        console.log('Demo payout creation failed:', e); 
        toast({
          title: "Demo Creation Failed", 
          description: "Some demo data may already exist",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    updatePageMetadata('payouts');
  }, []);

  const totalPayouts = payouts.reduce((sum, payout) => sum + payout.net_payable, 0);
  const pendingPayouts = payouts.filter(payout => payout.workflow_stage === 'pending_review').length;
  const processingPayouts = payouts.filter(payout => payout.workflow_stage === 'processing').length;
  const paidPayouts = payouts.filter(payout => payout.workflow_stage === 'paid').length;
  const approvedPayouts = payouts.filter(payout => payout.workflow_stage === 'approved').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.expense_status === 'pending').length;

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
          <div className="flex gap-2">
            <Button 
              onClick={() => createDemoData()} 
              variant="outline"
              className="gap-2"
            >
              Create Demo Data
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Payout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
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
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{processingPayouts}</div>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {pendingExpenses} pending approval
              </p>
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
              <CardTitle>Payouts Management</CardTitle>
              <CardDescription>
                Comprehensive oversight of payees, expenses, account balances, and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payouts" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="payees">Payees</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="balances">Account Balances</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payees" className="mt-6">
                  <PayeesTable />
                </TabsContent>
                
                <TabsContent value="expenses" className="mt-6">
                  <ExpensesTable />
                </TabsContent>
                
                <TabsContent value="balances" className="mt-6">
                  <AccountBalancesTable />
                </TabsContent>
                
                <TabsContent value="payouts" className="mt-6">
                  <PayoutList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}