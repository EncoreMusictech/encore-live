import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Download, TrendingUp, TrendingDown, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuarterlyBalanceReports } from '@/hooks/useQuarterlyBalanceReports';
import { useClientPortalIdentity } from '@/contexts/ClientPortalContext';

interface ClientAccountBalanceProps {
  permissions: Record<string, any>;
}

export const ClientAccountBalance = ({ permissions }: ClientAccountBalanceProps) => {
  const { user } = useAuth();
  const { effectiveUserId } = useClientPortalIdentity();
  const quarterlyReportsHook = useQuarterlyBalanceReports(effectiveUserId);
  const { reports, loading, exportToCSV } = quarterlyReportsHook;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [accountSummary, setAccountSummary] = useState({
    totalBalance: 0,
    totalRoyalties: 0,
    totalExpenses: 0,
    totalPayments: 0
  });

  useEffect(() => {
    if (reports.length > 0) {
      const summary = reports.reduce((acc, report) => ({
        totalBalance: acc.totalBalance + report.closing_balance,
        totalRoyalties: acc.totalRoyalties + report.royalties_amount,
        totalExpenses: acc.totalExpenses + report.expenses_amount,
        totalPayments: acc.totalPayments + report.payments_amount
      }), {
        totalBalance: 0,
        totalRoyalties: 0,
        totalExpenses: 0,
        totalPayments: 0
      });
      
      setAccountSummary(summary);
    }
  }, [reports]);

  // Get unique years and quarters for filters
  const availableYears = [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);
  const availableQuarters = [1, 2, 3, 4];

  // Apply filters
  let filteredReports = reports;
  
  if (searchTerm) {
    filteredReports = filteredReports.filter(report => 
      report.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.contracts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `Q${report.quarter} ${report.year}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedYear !== 'all') {
    filteredReports = filteredReports.filter(r => r.year === parseInt(selectedYear));
  }
  
  if (selectedQuarter !== 'all') {
    filteredReports = filteredReports.filter(r => r.quarter === parseInt(selectedQuarter));
  }

  const handleExportStatements = () => {
    if (filteredReports.length > 0) {
      exportToCSV(filteredReports);
    }
  };

  if (loading) {
    return <div>Loading account balance...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountSummary.totalBalance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Royalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${accountSummary.totalRoyalties.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${accountSummary.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${accountSummary.totalPayments.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search payees, agreements, periods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Quarters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            {availableQuarters.map(quarter => (
              <SelectItem key={quarter} value={quarter.toString()}>Q{quarter}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleExportStatements} variant="outline" disabled={filteredReports.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Quarterly Balance Reports Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Quarterly Balance Reports</h2>
          <p className="text-muted-foreground">
            Running account balances for each payee across quarterly periods
          </p>
        </div>

        {filteredReports.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Royalties</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Closing Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        Q{report.quarter} {report.year}
                      </TableCell>
                      <TableCell>
                        {report.contacts?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {report.contracts?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${report.opening_balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        ${report.royalties_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        ${report.expenses_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        ${report.payments_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ${report.closing_balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No balance reports found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedYear !== 'all' || selectedQuarter !== 'all' 
                  ? 'No reports match your current filters.' 
                  : 'Quarterly balance reports will appear here once your account has activity.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};