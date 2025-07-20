import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ClientAccountBalance } from "@/hooks/usePayouts";

export function AccountBalancesTable() {
  const [balances, setBalances] = useState<ClientAccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const fetchBalances = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('client_account_balances')
        .select(`
          *,
          contacts!client_account_balances_client_id_fkey(name, email)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setBalances(data || []);
    } catch (error: any) {
      console.error('Error fetching account balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch account balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (clientId: string) => {
    // Simply refresh the data from the database
    await fetchBalances();
    toast({
      title: "Success",
      description: "Balance refreshed successfully",
    });
  };

  const filteredBalances = balances.filter(balance =>
    (balance as any).contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (balance as any).contacts?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { color: 'bg-green-100 text-green-800', text: 'Positive' };
    if (balance < 0) return { color: 'bg-red-100 text-red-800', text: 'Negative' };
    return { color: 'bg-gray-100 text-gray-800', text: 'Zero' };
  };

  useEffect(() => {
    fetchBalances();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center">Loading account balances...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchBalances} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Total Earned</TableHead>
              <TableHead>Total Paid</TableHead>
              <TableHead>Last Statement</TableHead>
              <TableHead>Next Statement Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBalances.map((balance) => {
              const status = getBalanceStatus(balance.current_balance);
              return (
                <TableRow key={balance.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{(balance as any).contacts?.name || 'Unknown Client'}</div>
                      <div className="text-sm text-muted-foreground">
                        {(balance as any).contacts?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${balance.current_balance.toLocaleString()}
                  </TableCell>
                  <TableCell>${balance.total_earned.toLocaleString()}</TableCell>
                  <TableCell>${balance.total_paid.toLocaleString()}</TableCell>
                  <TableCell>
                    {balance.last_statement_date
                      ? new Date(balance.last_statement_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {balance.next_statement_due
                      ? new Date(balance.next_statement_due).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      {status.text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshBalance(balance.client_id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredBalances.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No account balances found matching your search."
            : "No account balances found. Client balances will appear here after creating payouts."}
        </div>
      )}
    </div>
  );
}