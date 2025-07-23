import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, Plus, Trash2, Calculator } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "@/hooks/use-toast";

interface ExpenseItem {
  expense_type: string;
  description: string;
  amount: number;
  is_percentage: boolean;
  percentage_rate: number;
}

interface EnhancedPayoutFormProps {
  onCancel: () => void;
  payout?: any;
}

export function EnhancedPayoutForm({ onCancel, payout }: EnhancedPayoutFormProps) {
  const { createPayout, updatePayout, calculatePayoutTotals } = usePayouts();
  const { contacts } = useContacts();
  const [calculating, setCalculating] = useState(false);
  const [autoCalculateExpenses, setAutoCalculateExpenses] = useState(true);
  
  const form = useForm({
    defaultValues: {
      client_id: payout?.client_id || '',
      period: payout?.period || '',
      period_start: payout?.period_start || '',
      period_end: payout?.period_end || '',
      gross_royalties: payout?.gross_royalties || 0,
      total_expenses: payout?.total_expenses || 0,
      net_payable: payout?.net_payable || 0,
      royalties_to_date: payout?.royalties_to_date || 0,
      payments_to_date: payout?.payments_to_date || 0,
      amount_due: payout?.amount_due || 0,
      payment_date: payout?.payment_date || '',
      payment_method: payout?.payment_method || '',
      payment_reference: payout?.payment_reference || '',
      notes: payout?.notes || '',
      statement_notes: payout?.statement_notes || '',
      status: payout?.status || 'pending',
      approval_status: payout?.approval_status || 'draft',
      admin_fee_percentage: payout?.admin_fee_percentage || 10,
      admin_fee_amount: payout?.admin_fee_amount || 0,
      processing_fee_amount: payout?.processing_fee_amount || 0,
      expenses: payout?.expenses || []
    }
  });

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = form;
  const { fields: expenseFields, append: addExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenses"
  });

  const watchedValues = watch();
  const clientContacts = contacts.filter(c => c.contact_type === 'client');

  // Auto-calculate amounts when relevant fields change
  useEffect(() => {
    if (autoCalculateExpenses) {
      const grossRoyalties = Number(watchedValues.gross_royalties) || 0;
      const adminFeePercentage = Number(watchedValues.admin_fee_percentage) || 0;
      const processingFee = Number(watchedValues.processing_fee_amount) || 0;
      
      // Calculate admin fee
      const adminFeeAmount = (grossRoyalties * adminFeePercentage) / 100;
      setValue('admin_fee_amount', adminFeeAmount);
      
      // Calculate total expenses from individual expense items
      const expenseItemsTotal = watchedValues.expenses?.reduce((total: number, expense: ExpenseItem) => {
        if (expense.is_percentage) {
          return total + (grossRoyalties * (expense.percentage_rate || 0)) / 100;
        }
        return total + (Number(expense.amount) || 0);
      }, 0) || 0;
      
      const totalExpenses = adminFeeAmount + processingFee + expenseItemsTotal;
      setValue('total_expenses', totalExpenses);
      
      // Calculate net payable
      const netPayable = grossRoyalties - totalExpenses;
      setValue('net_payable', netPayable);
      setValue('amount_due', netPayable);
    }
  }, [
    watchedValues.gross_royalties, 
    watchedValues.admin_fee_percentage, 
    watchedValues.processing_fee_amount,
    watchedValues.expenses,
    autoCalculateExpenses,
    setValue
  ]);

  const onSubmit = async (data: any) => {
    try {
      const payoutData = {
        ...data,
        expenses: data.expenses || []
      };

      if (payout) {
        await updatePayout(payout.id, payoutData);
        toast({
          title: "Success",
          description: "Payout updated successfully. Dashboard will reflect changes.",
        });
      } else {
        await createPayout(payoutData);
        toast({
          title: "Success", 
          description: "Payout created successfully. Check the dashboard for updated statistics.",
        });
      }
      onCancel();
    } catch (error) {
      console.error('Error saving payout:', error);
      toast({
        title: "Error",
        description: "Failed to save payout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCalculateTotals = async () => {
    const clientId = watch('client_id');
    const periodStart = watch('period_start');
    const periodEnd = watch('period_end');

    if (!clientId || !periodStart || !periodEnd) {
      toast({
        title: "Missing Information",
        description: "Please select a client and date range before calculating totals.",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    try {
      const totals = await calculatePayoutTotals(clientId, periodStart, periodEnd);
      if (totals) {
        Object.entries(totals).forEach(([key, value]) => {
          setValue(key as any, value);
        });
        toast({
          title: "Success",
          description: "Totals calculated successfully.",
        });
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
      toast({
        title: "Error",
        description: "Failed to calculate totals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleAddExpense = () => {
    addExpense({
      expense_type: 'other',
      description: '',
      amount: 0,
      is_percentage: false,
      percentage_rate: 0
    });
  };

  const currentYear = new Date().getFullYear();
  const quarters = [
    { value: `Q1 ${currentYear}`, label: `Q1 ${currentYear}` },
    { value: `Q2 ${currentYear}`, label: `Q2 ${currentYear}` },
    { value: `Q3 ${currentYear}`, label: `Q3 ${currentYear}` },
    { value: `Q4 ${currentYear}`, label: `Q4 ${currentYear}` },
  ];

  const expenseTypes = [
    { value: 'admin_fee', label: 'Administrative Fee' },
    { value: 'processing_fee', label: 'Processing Fee' },
    { value: 'service_charge', label: 'Service Charge' },
    { value: 'bank_fee', label: 'Bank Fee' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{payout ? 'Edit Payout' : 'Create New Payout'}</h2>
          <p className="text-muted-foreground">Manage royalty payouts and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {watchedValues.approval_status && (
            <Badge variant={watchedValues.approval_status === 'approved' ? 'default' : 'secondary'}>
              {watchedValues.approval_status}
            </Badge>
          )}
          {watchedValues.status && (
            <Badge variant={watchedValues.status === 'paid' ? 'default' : 'outline'}>
              {watchedValues.status}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select onValueChange={(value) => setValue('client_id', value)} defaultValue={watch('client_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clientContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-destructive">Client is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period *</Label>
            <Select onValueChange={(value) => setValue('period', value)} defaultValue={watch('period')}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period_start">Period Start</Label>
            <Input
              id="period_start"
              type="date"
              {...register('period_start')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period_end">Period End</Label>
            <Input
              id="period_end"
              type="date"
              {...register('period_end')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculate Totals Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleCalculateTotals}
          disabled={calculating || !watch('client_id') || !watch('period_start') || !watch('period_end')}
          className="gap-2"
          size="lg"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? 'Calculating...' : 'Calculate Totals from Royalties'}
        </Button>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gross_royalties">Gross Royalties</Label>
            <Input
              id="gross_royalties"
              type="number"
              step="0.01"
              {...register('gross_royalties', { valueAsNumber: true })}
              className="font-medium text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_expenses">Total Expenses</Label>
            <Input
              id="total_expenses"
              type="number"
              step="0.01"
              {...register('total_expenses', { valueAsNumber: true })}
              className="font-medium text-lg"
              readOnly={autoCalculateExpenses}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input
              id="amount_due"
              type="number"
              step="0.01"
              {...register('amount_due', { valueAsNumber: true })}
              className="font-bold text-xl bg-primary/5"
              readOnly={autoCalculateExpenses}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Management */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses & Fees</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="admin_fee_percentage">Admin Fee %</Label>
              <Input
                id="admin_fee_percentage"
                type="number"
                step="0.1"
                className="w-20"
                {...register('admin_fee_percentage', { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="processing_fee_amount">Processing Fee</Label>
              <Input
                id="processing_fee_amount"
                type="number"
                step="0.01"
                className="w-32"
                {...register('processing_fee_amount', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Additional Expenses</h4>
            <Button type="button" onClick={handleAddExpense} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {expenseFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  onValueChange={(value) => setValue(`expenses.${index}.expense_type`, value)}
                  defaultValue={watch(`expenses.${index}.expense_type`)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Description"
                  {...register(`expenses.${index}.description`)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount/Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`expenses.${index}.${watch(`expenses.${index}.is_percentage`) ? 'percentage_rate' : 'amount'}`, { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  onValueChange={(value) => setValue(`expenses.${index}.is_percentage`, value === 'percentage')}
                  defaultValue={watch(`expenses.${index}.is_percentage`) ? 'percentage' : 'fixed'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeExpense(index)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              {...register('payment_date')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select onValueChange={(value) => setValue('payment_method', value)} defaultValue={watch('payment_method')}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACH">ACH</SelectItem>
                <SelectItem value="Wire">Wire Transfer</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_reference">Payment Reference</Label>
            <Input
              id="payment_reference"
              placeholder="Transaction ID or reference number"
              {...register('payment_reference')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setValue('status', value)} defaultValue={watch('status')}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any internal notes..."
              {...register('notes')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement_notes">Statement Notes</Label>
            <Textarea
              id="statement_notes"
              placeholder="Notes to appear on the statement..."
              {...register('statement_notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2">
          <DollarSign className="h-4 w-4" />
          {payout ? 'Update Payout' : 'Create Payout'}
        </Button>
      </div>
    </form>
  );
}