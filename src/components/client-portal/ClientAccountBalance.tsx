import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuarterlyBalanceReports } from '@/hooks/useQuarterlyBalanceReports';

interface ClientAccountBalanceProps {
  permissions: Record<string, any>;
}

export const ClientAccountBalance = ({ permissions }: ClientAccountBalanceProps) => {
  const { user } = useAuth();
  const quarterlyReportsHook = useQuarterlyBalanceReports();
  const { reports, loading, exportToCSV } = quarterlyReportsHook;
  const [accountSummary, setAccountSummary] = useState({
    currentBalance: 0,
    totalEarned: 0,
    totalPaid: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    const fetchAccountBalance = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('client_account_balances')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error is okay
          console.error('Error fetching account balance:', error);
          return;
        }

        if (data) {
          setAccountSummary({
            currentBalance: data.current_balance || 0,
            totalEarned: data.total_earned || 0,
            totalPaid: data.total_paid || 0,
            pendingAmount: (data.total_earned || 0) - (data.total_paid || 0)
          });
        }
      } catch (error) {
        console.error('Error fetching account balance:', error);
      }
    };

    fetchAccountBalance();
  }, [user]);

  const handleExportStatements = () => {
    if (reports.length > 0) {
      exportToCSV(reports);
    }
  };

  if (loading) {
    return <div>Loading account balance...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Account Balance</h2>
        <p className="text-muted-foreground">
          View your current account balance and quarterly statements.
        </p>
      </div>

      {/* Account Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountSummary.currentBalance.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              Available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${accountSummary.totalEarned.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountSummary.totalPaid.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-4 w-4 mr-1" />
              Disbursed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${accountSummary.pendingAmount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Awaiting payment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Statements */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quarterly Statements
              </CardTitle>
              <CardDescription>
                Your quarterly balance reports and earnings statements.
              </CardDescription>
            </div>
            <Button onClick={handleExportStatements} variant="outline" disabled={reports.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Royalties</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.slice(0, 8).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      Q{report.quarter} {report.year}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${report.opening_balance.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-green-600">
                      +${report.royalties_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      -${report.expenses_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-blue-600">
                      -${report.payments_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${report.closing_balance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.is_calculated ? 'default' : 'secondary'}>
                        {report.is_calculated ? 'Final' : 'Provisional'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No statements available</h3>
              <p className="text-muted-foreground">
                Quarterly statements will appear here once your account has activity.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};