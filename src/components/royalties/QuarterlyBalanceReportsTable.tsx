import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useQuarterlyBalanceReports, QuarterlyBalanceReport } from "@/hooks/useQuarterlyBalanceReports";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import DemoLimitBanner from "@/components/DemoLimitBanner";

export function QuarterlyBalanceReportsTable() {
  const { reports, loading, createReport, generateReportsFromData, exportToCSV } = useQuarterlyBalanceReports();
  const { user } = useAuth();
  const { isDemo } = useDemoAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterQuarter, setFilterQuarter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    payee_id: "",
    contact_id: "",
    agreement_id: "",
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    opening_balance: 0,
    royalties_amount: 0,
    expenses_amount: 0,
    payments_amount: 0,
  });

  // Get unique years from all reports
  const uniqueYears = useMemo(() => {
    return [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);
  }, [reports]);

  // Filter reports based on search and filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchTerm || 
        report.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.contracts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.period_label.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYear = filterYear === "all" || report.year.toString() === filterYear;
      const matchesQuarter = filterQuarter === "all" || report.quarter.toString() === filterQuarter;

      return matchesSearch && matchesYear && matchesQuarter;
    });
  }, [reports, searchTerm, filterYear, filterQuarter]);

  // Calculate summary stats from filtered reports
  const summaryStats = useMemo(() => {
    const totalBalance = filteredReports.reduce((sum, r) => sum + r.closing_balance, 0);
    const totalRoyalties = filteredReports.reduce((sum, r) => sum + r.royalties_amount, 0);
    const totalExpenses = filteredReports.reduce((sum, r) => sum + r.expenses_amount, 0);
    const totalPayments = filteredReports.reduce((sum, r) => sum + r.payments_amount, 0);
    
    return {
      totalBalance,
      totalRoyalties,
      totalExpenses,
      totalPayments,
      reportCount: filteredReports.length
    };
  }, [filteredReports]);

  const handleCreateReport = async () => {
    const created = await createReport(newReport);
    if (created) {
      setShowCreateDialog(false);
      setNewReport({
        payee_id: "",
        contact_id: "",
        agreement_id: "",
        year: new Date().getFullYear(),
        quarter: Math.ceil((new Date().getMonth() + 1) / 3),
        opening_balance: 0,
        royalties_amount: 0,
        expenses_amount: 0,
        payments_amount: 0,
      });
    }
  };

  const getBalanceIndicator = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = current - previous;
    const isPositive = change > 0;
    
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          ${Math.abs(change).toFixed(2)}
        </span>
      </div>
    );
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 1000) return { color: 'bg-green-100 text-green-800', text: 'Healthy' };
    if (balance > 0) return { color: 'bg-yellow-100 text-yellow-800', text: 'Low' };
    if (balance < 0) return { color: 'bg-red-100 text-red-800', text: 'Deficit' };
    return { color: 'bg-gray-100 text-gray-800', text: 'Zero' };
  };

  if (loading) {
    return <div className="p-8 text-center">Loading quarterly balance reports...</div>;
  }

  return (
    <div className="space-y-6">
      {isDemo && (
        <DemoLimitBanner 
          module="accountBalances"
        />
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">${summaryStats.totalBalance.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Royalties</CardDescription>
            <CardTitle className="text-2xl text-green-600">${summaryStats.totalRoyalties.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">${summaryStats.totalExpenses.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payments</CardDescription>
            <CardTitle className="text-2xl text-blue-600">${summaryStats.totalPayments.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payees, agreements, periods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterQuarter} onValueChange={setFilterQuarter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => exportToCSV(filteredReports)} 
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Quarterly Balance Report</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newReport.year}
                      onChange={(e) => setNewReport(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quarter">Quarter</Label>
                    <Select value={newReport.quarter.toString()} onValueChange={(value) => setNewReport(prev => ({ ...prev, quarter: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1</SelectItem>
                        <SelectItem value="2">Q2</SelectItem>
                        <SelectItem value="3">Q3</SelectItem>
                        <SelectItem value="4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="payee_id">Payee ID</Label>
                  <Input
                    id="payee_id"
                    value={newReport.payee_id}
                    onChange={(e) => setNewReport(prev => ({ ...prev, payee_id: e.target.value }))}
                    placeholder="Enter payee ID"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="royalties">Royalties</Label>
                    <Input
                      id="royalties"
                      type="number"
                      step="0.01"
                      value={newReport.royalties_amount}
                      onChange={(e) => setNewReport(prev => ({ ...prev, royalties_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenses">Expenses</Label>
                    <Input
                      id="expenses"
                      type="number"
                      step="0.01"
                      value={newReport.expenses_amount}
                      onChange={(e) => setNewReport(prev => ({ ...prev, expenses_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <Button onClick={handleCreateReport}>Create Report</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Balance Reports</CardTitle>
          <CardDescription>
            Running account balances for each payee across quarterly periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
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
                  <TableHead>Status</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report, index) => {
                  const status = getBalanceStatus(report.closing_balance);
                  const previousReport = filteredReports[index + 1];
                  const hasCalculationMismatch = !report.is_calculated;
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.period_label}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.contacts?.name || 'Unknown Payee'}</div>
                          <div className="text-sm text-muted-foreground">
                            {report.contacts?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.contracts?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${report.opening_balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        +${report.royalties_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        -${report.expenses_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        -${report.payments_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          ${report.closing_balance.toFixed(2)}
                          {hasCalculationMismatch && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getBalanceIndicator(report.closing_balance, previousReport?.closing_balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterYear !== "all" || filterQuarter !== "all"
                ? "No quarterly balance reports found matching your filters."
                : "No quarterly balance reports found. Create your first report to get started."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}