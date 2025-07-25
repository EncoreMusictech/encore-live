import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useExpenses, PayoutExpense } from '@/hooks/useExpenses';
import { ExpenseForm } from './ExpenseForm';

export function ExpensesTable() {
  const { expenses, loading, deleteExpense, fetchExpenses } = useExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<PayoutExpense | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
    }
  };

  const handleEditSuccess = () => {
    setSelectedExpense(null);
    setShowForm(false);
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'admin_fee':
        return 'bg-blue-100 text-blue-800';
      case 'processing_fee':
        return 'bg-green-100 text-green-800';
      case 'legal_fee':
        return 'bg-yellow-100 text-yellow-800';
      case 'recording_cost':
        return 'bg-red-100 text-red-800';
      case 'advance':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatAmount = (expense: PayoutExpense) => {
    if (expense.is_percentage) {
      const cap = expense.expense_cap ? ` (cap: $${expense.expense_cap})` : '';
      return `${expense.percentage_rate}%${cap}`;
    }
    return `$${expense.amount.toFixed(2)}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading expenses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Dialog open={showForm && !selectedExpense} onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setSelectedExpense(null);
          } else {
            setShowForm(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              onSuccess={handleEditSuccess}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

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
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Behavior</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {expense.payees?.payee_name || '-'}
                </TableCell>
                <TableCell>
                  <Badge className={getExpenseTypeColor(expense.expense_type)}>
                    {expense.expense_type.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-1 mt-1">
                    {expense.is_recoupable && (
                      <Badge variant="outline" className="text-xs">Recoupable</Badge>
                    )}
                    {expense.is_commission_fee && (
                      <Badge variant="outline" className="text-xs">Commission</Badge>
                    )}
                    {expense.is_finder_fee && (
                      <Badge variant="outline" className="text-xs">Finder</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {expense.description}
                    {expense.date_incurred && (
                      <div className="text-sm text-muted-foreground">
                        Incurred: {new Date(expense.date_incurred).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatAmount(expense)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(expense.expense_status)}>
                    {expense.expense_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {expense.expense_behavior}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(expense.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog open={selectedExpense?.id === expense.id} onOpenChange={(open) => {
                      if (!open) setSelectedExpense(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Expense</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                          expense={selectedExpense!}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setSelectedExpense(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
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