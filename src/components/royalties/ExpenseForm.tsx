import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useExpenses, PayoutExpense } from '@/hooks/useExpenses';
import { useContracts } from '@/hooks/useContracts';
import { useCopyright } from '@/hooks/useCopyright';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ExpenseFormProps {
  expense?: PayoutExpense;
  onSuccess?: () => void;
  onCancel?: () => void;
  payoutId?: string;
}

export function ExpenseForm({ expense, onSuccess, onCancel, payoutId }: ExpenseFormProps) {
  const { user } = useAuth();
  const { createExpense, updateExpense } = useExpenses();
  const { contracts } = useContracts();
  const { copyrights } = useCopyright();
  const [payees, setPayees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    expense_type: expense?.expense_type || '',
    description: expense?.description || '',
    amount: expense?.amount || 0,
    is_percentage: expense?.is_percentage || false,
    percentage_rate: expense?.percentage_rate || 0,
    agreement_id: expense?.agreement_id || '',
    payee_id: expense?.payee_id || '',
    expense_behavior: expense?.expense_behavior || 'direct' as 'crossed' | 'direct',
    is_commission_fee: expense?.is_commission_fee || false,
    is_finder_fee: expense?.is_finder_fee || false,
    valid_from_date: expense?.valid_from_date ? new Date(expense.valid_from_date) : undefined,
    valid_to_date: expense?.valid_to_date ? new Date(expense.valid_to_date) : undefined,
    expense_cap: expense?.expense_cap || undefined,
    work_id: expense?.work_id || '',
    is_recoupable: expense?.is_recoupable || false,
    invoice_url: expense?.invoice_url || '',
    date_incurred: expense?.date_incurred ? new Date(expense.date_incurred) : new Date(),
    expense_status: expense?.expense_status || 'pending' as 'pending' | 'approved' | 'rejected',
    payout_id: expense?.payout_id || payoutId || ''
  });

  useEffect(() => {
    const fetchPayees = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('payees')
          .select('*')
          .eq('user_id', user.id)
          .order('payee_name');

        if (error) throw error;
        setPayees(data || []);
      } catch (error) {
        console.error('Error fetching payees:', error);
      }
    };

    fetchPayees();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
        percentage_rate: formData.is_percentage ? Number(formData.percentage_rate) : 0,
        expense_cap: formData.expense_cap ? Number(formData.expense_cap) : undefined,
        agreement_id: formData.agreement_id === 'none' ? undefined : formData.agreement_id || undefined,
        payee_id: formData.payee_id === 'none' ? undefined : formData.payee_id || undefined,
        work_id: formData.work_id === 'none' ? undefined : formData.work_id || undefined,
        payout_id: formData.payout_id || undefined,
        valid_from_date: formData.valid_from_date ? format(formData.valid_from_date, 'yyyy-MM-dd') : undefined,
        valid_to_date: formData.valid_to_date ? format(formData.valid_to_date, 'yyyy-MM-dd') : undefined,
        date_incurred: formData.date_incurred ? format(formData.date_incurred, 'yyyy-MM-dd') : undefined
      };

      if (expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const expenseTypes = [
    'admin_fee',
    'processing_fee',
    'legal_fee',
    'recording_cost',
    'marketing_expense',
    'travel_expense',
    'studio_rental',
    'equipment_rental',
    'advance',
    'other'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_type">Expense Type</Label>
              <Select value={formData.expense_type} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Incurred</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_incurred && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_incurred ? format(formData.date_incurred, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_incurred}
                    onSelect={(date) => setFormData(prev => ({ ...prev, date_incurred: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the expense..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_percentage"
                  checked={formData.is_percentage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_percentage: !!checked }))}
                />
                <Label htmlFor="is_percentage">Percentage-based</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{formData.is_percentage ? 'Percentage Rate' : 'Amount'}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.is_percentage ? formData.percentage_rate : formData.amount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (formData.is_percentage) {
                    setFormData(prev => ({ ...prev, percentage_rate: value }));
                  } else {
                    setFormData(prev => ({ ...prev, amount: value }));
                  }
                }}
                placeholder={formData.is_percentage ? "0.00%" : "$0.00"}
                required
              />
            </div>

            {formData.is_percentage && (
              <div className="space-y-2">
                <Label htmlFor="expense_cap">Expense Cap ($)</Label>
                <Input
                  id="expense_cap"
                  type="number"
                  step="0.01"
                  value={formData.expense_cap || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_cap: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Optional cap amount"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_behavior">Expense Behavior</Label>
              <Select value={formData.expense_behavior} onValueChange={(value: 'crossed' | 'direct') => setFormData(prev => ({ ...prev, expense_behavior: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="crossed">Crossed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_status">Status</Label>
              <Select value={formData.expense_status} onValueChange={(value: 'pending' | 'approved' | 'rejected') => setFormData(prev => ({ ...prev, expense_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.valid_from_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.valid_from_date ? format(formData.valid_from_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.valid_from_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, valid_from_date: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valid To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.valid_to_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.valid_to_date ? format(formData.valid_to_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.valid_to_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, valid_to_date: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreement_id">Agreement (Optional)</Label>
              <Select value={formData.agreement_id} onValueChange={(value) => setFormData(prev => ({ ...prev, agreement_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agreement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Agreement</SelectItem>
                  {contracts.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.title} - {contract.counterparty_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payee_id">Payee (Optional)</Label>
              <Select value={formData.payee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, payee_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Payee</SelectItem>
                  {payees.map(payee => (
                    <SelectItem key={payee.id} value={payee.id}>
                      {payee.payee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_id">Work (Optional)</Label>
              <Select value={formData.work_id} onValueChange={(value) => setFormData(prev => ({ ...prev, work_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Work</SelectItem>
                  {copyrights.map(work => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.work_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_url">Invoice URL (Optional)</Label>
            <Input
              id="invoice_url"
              type="url"
              value={formData.invoice_url}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recoupable"
                checked={formData.is_recoupable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recoupable: !!checked }))}
              />
              <Label htmlFor="is_recoupable">Recoupable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_commission_fee"
                checked={formData.is_commission_fee}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_commission_fee: !!checked }))}
              />
              <Label htmlFor="is_commission_fee">Commission Fee</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_finder_fee"
                checked={formData.is_finder_fee}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_finder_fee: !!checked }))}
              />
              <Label htmlFor="is_finder_fee">Finder Fee</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}