import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, DollarSign } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { useContacts } from "@/hooks/useContacts";

interface PayoutFormProps {
  onCancel: () => void;
  payout?: any;
}

export function PayoutForm({ onCancel, payout }: PayoutFormProps) {
  const { createPayout, updatePayout, calculatePayoutTotals } = usePayouts();
  const { contacts } = useContacts();
  const [calculating, setCalculating] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
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
      status: payout?.status || 'pending',
    }
  });

  const clientContacts = contacts.filter(c => c.contact_type === 'client');

  const onSubmit = async (data: any) => {
    try {
      if (payout) {
        await updatePayout(payout.id, data);
      } else {
        await createPayout(data);
      }
      onCancel();
    } catch (error) {
      console.error('Error saving payout:', error);
    }
  };

  const handleCalculateTotals = async () => {
    const clientId = watch('client_id');
    const periodStart = watch('period_start');
    const periodEnd = watch('period_end');

    if (!clientId || !periodStart || !periodEnd) {
      return;
    }

    setCalculating(true);
    try {
      const totals = await calculatePayoutTotals(clientId, periodStart, periodEnd);
      if (totals) {
        Object.entries(totals).forEach(([key, value]) => {
          setValue(key as any, value);
        });
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
    } finally {
      setCalculating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const quarters = [
    { value: `Q1 ${currentYear}`, label: `Q1 ${currentYear}` },
    { value: `Q2 ${currentYear}`, label: `Q2 ${currentYear}` },
    { value: `Q3 ${currentYear}`, label: `Q3 ${currentYear}` },
    { value: `Q4 ${currentYear}`, label: `Q4 ${currentYear}` },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-sm text-red-600">Client is required</p>
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
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleCalculateTotals}
          disabled={calculating || !watch('client_id') || !watch('period_start') || !watch('period_end')}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {calculating ? 'Calculating...' : 'Calculate Totals'}
        </Button>
      </div>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gross_royalties">Gross Royalties</Label>
            <Input
              id="gross_royalties"
              type="number"
              step="0.01"
              {...register('gross_royalties', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_expenses">Total Expenses</Label>
            <Input
              id="total_expenses"
              type="number"
              step="0.01"
              {...register('total_expenses', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="net_payable">Net Payable</Label>
            <Input
              id="net_payable"
              type="number"
              step="0.01"
              {...register('net_payable', { valueAsNumber: true })}
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="royalties_to_date">Royalties to Date</Label>
            <Input
              id="royalties_to_date"
              type="number"
              step="0.01"
              {...register('royalties_to_date', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payments_to_date">Payments to Date</Label>
            <Input
              id="payments_to_date"
              type="number"
              step="0.01"
              {...register('payments_to_date', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input
              id="amount_due"
              type="number"
              step="0.01"
              {...register('amount_due', { valueAsNumber: true })}
              className="font-bold text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
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

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {payout ? 'Update Payout' : 'Create Payout'}
        </Button>
      </div>
    </form>
  );
}