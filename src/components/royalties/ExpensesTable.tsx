import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PayoutExpense } from "@/hooks/usePayouts";

export function ExpensesTable() {
  const [expenses, setExpenses] = useState<PayoutExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payout_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payout_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setExpenses(expenses.filter(e => e.id !== id));
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpenseTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'admin_fee': return 'bg-blue-100 text-blue-800';
      case 'processing_fee': return 'bg-green-100 text-green-800';
      case 'bank_charges': return 'bg-yellow-100 text-yellow-800';
      case 'currency_conversion': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (expense: PayoutExpense) => {
    if (expense.is_percentage) {
      return `${expense.percentage_rate}%`;
    }
    return `$${expense.amount.toLocaleString()}`;
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center">Loading expenses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Linked Payout</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>
                  <Badge className={getExpenseTypeColor(expense.expense_type)}>
                    {expense.expense_type}
                  </Badge>
                </TableCell>
                <TableCell>{formatAmount(expense)}</TableCell>
                <TableCell>
                  {expense.payout_id ? (
                    <Badge variant="secondary">Linked</Badge>
                  ) : (
                    <Badge variant="outline">Unlinked</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(expense.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredExpenses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No expenses found matching your search."
            : "No expenses found. Add your first expense to get started."}
        </div>
      )}
    </div>
  );
}