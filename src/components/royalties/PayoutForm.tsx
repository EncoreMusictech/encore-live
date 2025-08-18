import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, FileTextIcon } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { useContacts } from "@/hooks/useContacts";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgreementCalculation, AgreementTerms, ContractWriter } from "@/hooks/useAgreementCalculation";
import { AgreementTermsPreview } from "./AgreementTermsPreview";

interface PayoutFormProps {
  onCancel: () => void;
  payout?: any;
}

export function PayoutForm({ onCancel, payout }: PayoutFormProps) {
  const { createPayout, updatePayout, calculatePayoutTotals } = usePayouts();
  const { contacts } = useContacts();
  const subscription = useSubscription();
  const { 
    loading: calculationLoading,
    getClientAgreements,
    getAgreementWriters,
    calculateAgreementBasedRoyalties,
    calculateManualRoyalties
  } = useAgreementCalculation();
  
  const [calculating, setCalculating] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<string>("");
  const [availableAgreements, setAvailableAgreements] = useState<AgreementTerms[]>([]);
  const [agreementWriters, setAgreementWriters] = useState<ContractWriter[]>([]);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculationMethod, setCalculationMethod] = useState<'agreement' | 'manual'>('manual');
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      client_id: payout?.client_id || '',
      agreement_id: payout?.agreement_id || '',
      period: payout?.period || '',
      period_start: payout?.period_start || '',
      period_end: payout?.period_end || '',
      gross_royalties: payout?.gross_royalties || 0,
      net_royalties: payout?.net_royalties || 0,
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
      calculation_method: payout?.calculation_method || 'manual',
    }
  });

  const clientContacts = contacts.filter(c => c.contact_type === 'client');
  const hasAgreementModule = subscription?.subscribed && 
                             (subscription?.subscription_tier === 'enterprise' || 
                              subscription?.subscription_tier === 'professional');
  const hasRoyaltiesModule = true; // Always available since we're in the royalties module

  const onSubmit = async (data: any) => {
    try {
      const payoutData = {
        ...data,
        calculation_method: calculationMethod,
        agreement_id: calculationMethod === 'agreement' ? selectedAgreement : null,
      };
      
      if (payout) {
        await updatePayout(payout.id, payoutData);
      } else {
        await createPayout(payoutData);
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
      let result = null;
      
      if (calculationMethod === 'agreement' && selectedAgreement) {
        // Use agreement-based calculation
        result = await calculateAgreementBasedRoyalties(selectedAgreement, clientId, periodStart, periodEnd);
      } else {
        // Use manual calculation (legacy method)
        result = await calculateManualRoyalties(clientId, periodStart, periodEnd);
      }
      
      if (result) {
        setCalculationResult(result);
        Object.entries(result).forEach(([key, value]) => {
          if (key !== 'calculation_method' && key !== 'agreement_id' && key !== 'territory_adjustments') {
            setValue(key as any, value);
          }
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

  // Load client agreements when client changes
  useEffect(() => {
    const clientId = watch('client_id');
    if (clientId && hasAgreementModule) {
      getClientAgreements(clientId).then(agreements => {
        setAvailableAgreements(agreements);
        if (agreements.length > 0) {
          setCalculationMethod('agreement');
        }
      });
    } else {
      setAvailableAgreements([]);
      setCalculationMethod('manual');
    }
  }, [watch('client_id'), hasAgreementModule]);

  // Load agreement writers when agreement changes
  useEffect(() => {
    if (selectedAgreement) {
      getAgreementWriters(selectedAgreement).then(setAgreementWriters);
    } else {
      setAgreementWriters([]);
    }
  }, [selectedAgreement]);

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

      {/* Calculation Method Selection */}
      {hasAgreementModule && availableAgreements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Calculation Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="method-agreement"
                  name="calculation-method"
                  checked={calculationMethod === 'agreement'}
                  onChange={() => setCalculationMethod('agreement')}
                />
                <Label htmlFor="method-agreement">Agreement-Based Calculation</Label>
                <Badge variant="outline">Recommended</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="method-manual"
                  name="calculation-method"
                  checked={calculationMethod === 'manual'}
                  onChange={() => setCalculationMethod('manual')}
                />
                <Label htmlFor="method-manual">Manual Calculation</Label>
              </div>
            </div>

            {calculationMethod === 'agreement' && (
              <div className="space-y-2">
                <Label htmlFor="agreement_id">Select Agreement</Label>
                <Select value={selectedAgreement} onValueChange={setSelectedAgreement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agreement for calculation" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgreements.map((agreement) => (
                      <SelectItem key={agreement.id} value={agreement.id}>
                        {agreement.title} ({agreement.commission_percentage || 0}% commission)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleCalculateTotals}
          disabled={calculating || calculationLoading || !watch('client_id') || !watch('period_start') || !watch('period_end') || (calculationMethod === 'agreement' && !selectedAgreement)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {calculating || calculationLoading ? 'Calculating...' : 'Calculate Totals'}
        </Button>
      </div>

      {/* Agreement Terms Preview */}
      {calculationMethod === 'agreement' && selectedAgreement && availableAgreements.length > 0 && (
        <AgreementTermsPreview
          agreement={availableAgreements.find(a => a.id === selectedAgreement) || null}
          writers={agreementWriters}
          calculationResult={calculationResult}
        />
      )}

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
            <Label htmlFor="net_royalties">Net Royalties</Label>
            <Input
              id="net_royalties"
              type="number"
              step="0.01"
              {...register('net_royalties', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_expenses">Total Expenses</Label>
            <Input
              id="total_expenses"
              type="number"
              step="0.01"
              {...register('total_expenses', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payments_to_date">Payments to Date</Label>
            <Input
              id="payments_to_date"
              type="number"
              step="0.01"
              {...register('payments_to_date', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="net_payable">Net Payable</Label>
            <Input
              id="net_payable"
              type="number"
              step="0.01"
              {...register('net_payable', { valueAsNumber: true })}
              className="font-medium bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="royalties_to_date">Royalties to Date</Label>
            <Input
              id="royalties_to_date"
              type="number"
              step="0.01"
              {...register('royalties_to_date', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input
              id="amount_due"
              type="number"
              step="0.01"
              {...register('amount_due', { valueAsNumber: true })}
              className="font-bold text-lg bg-muted"
              readOnly
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