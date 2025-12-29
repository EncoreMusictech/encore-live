import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, DollarSign, Users, AlertCircle } from "lucide-react";
import { BeginningBalancesDialog } from "./BeginningBalancesDialog";
import { usePayees } from "@/hooks/usePayees";

export function BeginningBalancesManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { payees, loading, refetch } = usePayees();

  const stats = useMemo(() => {
    const total = payees.length;
    const withBalance = payees.filter(p => (p.beginning_balance ?? 0) !== 0).length;
    const withoutBalance = total - withBalance;
    const totalBalance = payees.reduce((sum, p) => sum + (p.beginning_balance ?? 0), 0);

    return { total, withBalance, withoutBalance, totalBalance };
  }, [payees]);

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      refetch();
    }
  };

  if (loading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Beginning Balances</CardTitle>
                <CardDescription>
                  Set starting account balances for payees migrating from another system
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Manage Balances
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Payees:</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">With Balance:</span>
              <Badge variant="default" className="bg-green-600">{stats.withBalance}</Badge>
            </div>
            
            {stats.withoutBalance > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Without Balance:</span>
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {stats.withoutBalance}
                </Badge>
              </div>
            )}
            
            {stats.totalBalance !== 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-muted-foreground">Total Beginning Balance:</span>
                <span className={`font-semibold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BeginningBalancesDialog 
        open={dialogOpen} 
        onOpenChange={handleDialogClose}
        payees={payees}
      />
    </>
  );
}
