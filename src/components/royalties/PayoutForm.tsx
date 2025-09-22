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
    getPayeeAgreements,
    getAgreementWriters,
    calculateAgreementBasedRoyalties,
    calculateManualRoyalties
  } = useAgreementCalculation();
  
  const [calculating, setCalculating] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<string>("");
  const [availableAgreements, setAvailableAgreements] = useState<AgreementTerms[]>([]);
  const [agreementWriters, setAgreementWriters] = useState<ContractWriter[]>([]);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculationMethod, setCalculationMethod] = useState<'agreement' | 'manual'>('agreement');

  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      client_id: String(payout?.client_id ?? ''),
      period: payout?.period || '',
      period_start: payout?.period_start || null,
      period_end: payout?.period_end || null,
      gross_royalties: payout?.gross_royalties || 0,
      total_royalties: payout?.total_royalties || payout?.gross_royalties || 0,
      commissions_amount: payout?.commissions_amount || 0,
      net_royalties: payout?.net_royalties || 0,
      total_expenses: payout?.total_expenses || 0,
      net_payable: payout?.net_payable || 0,
      royalties_to_date: payout?.royalties_to_date || 0,
      payments_to_date: payout?.payments_to_date || 0,
      amount_due: payout?.amount_due || 0,
      payment_date: payout?.payment_date || null,
      payment_method: payout?.payment_method || '',
      payment_reference: payout?.payment_reference || '',
      notes: payout?.notes || '',
      status: payout?.status || 'pending',
    }
  });

  // Set form values when editing existing payout
  useEffect(() => {
    if (payout) {
      setValue('client_id', String(payout.client_id ?? ''));
      setValue('period', payout.period || '');
      setValue('period_start', payout.period_start || null);
      setValue('period_end', payout.period_end || null);
      setValue('gross_royalties', payout.gross_royalties || 0);
      setValue('total_royalties', payout.total_royalties || payout.gross_royalties || 0);
      setValue('commissions_amount', payout.commissions_amount || 0);
      setValue('net_royalties', payout.net_royalties || 0);
      setValue('total_expenses', payout.total_expenses || 0);
      setValue('net_payable', payout.net_payable || 0);
      setValue('royalties_to_date', payout.royalties_to_date || 0);
      setValue('payments_to_date', payout.payments_to_date || 0);
      setValue('amount_due', payout.amount_due || 0);
      setValue('payment_date', payout.payment_date || null);
      setValue('payment_method', payout.payment_method || '');
      setValue('payment_reference', payout.payment_reference || '');
      setValue('notes', payout.notes || '');
      setValue('status', payout.status || 'pending');
    }
  }, [payout, setValue]);

  const clientContacts = contacts.filter(c => 
    payout ? String(c.id) === String(payout.client_id) : c.contact_type === 'client'
  );
  // Agreement-based calculations should be available to all users with contracts
  const hasAgreementModule = true;
  const hasRoyaltiesModule = true; // Always available since we're in the royalties module

  const onSubmit = async (data: any) => {
    try {
      // Start with existing value or calculated result
      let commissions = data.commissions_amount ?? (calculationResult?.commission_deduction || 0);
      const totalRoyalties = data.total_royalties ?? data.gross_royalties ?? 0;
      const amountDue = data.amount_due ?? data.net_payable ?? 0;

      // Fallback: if commissions are still zero/empty, derive from selected agreement's commission % and gross
      if ((!commissions || commissions === 0) && (availableAgreements.length > 0)) {
        const activeAgreement = availableAgreements.find(a => a.id === selectedAgreement) || availableAgreements[0];
        const commissionRate = Number(activeAgreement?.commission_percentage) || 0;
        const gross = Number(data.gross_royalties ?? data.total_royalties ?? 0) || 0;
        if (commissionRate > 0 && gross > 0) {
          commissions = parseFloat(((gross * commissionRate) / 100).toFixed(2));
        }
      }

      // Convert empty date strings to null to avoid database errors
      const cleanDateField = (dateValue: string) => {
        if (!dateValue || dateValue.trim() === '') return null;
        return dateValue;
      };

      const payoutData = {
        ...data,
        // Clean date fields - convert empty strings to null
        period_start: cleanDateField(data.period_start),
        period_end: cleanDateField(data.period_end),
        payment_date: cleanDateField(data.payment_date),
        // Financial fields
        total_royalties: totalRoyalties,
        commissions_amount: commissions,
        amount_due: amountDue,
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
      
      // Always try agreement-based calculation first if agreements are available
      if (calculationMethod === 'agreement' && availableAgreements.length > 0 && selectedAgreement) {
        console.log('Using agreement-based calculation with agreement:', selectedAgreement);
        result = await calculateAgreementBasedRoyalties(selectedAgreement, clientId, periodStart, periodEnd);
      } else if (calculationMethod === 'manual' || availableAgreements.length === 0) {
        // Use manual calculation as fallback or when explicitly selected
        console.log('Using manual calculation');
        result = await calculateManualRoyalties(clientId, periodStart, periodEnd);
      }
      
      if (result) {
        setCalculationResult(result);
        // Map result fields to form
        setValue('gross_royalties', result.gross_royalties || 0);
        setValue('net_royalties', result.net_royalties || 0);
        setValue('total_expenses', result.total_expenses || 0);
        // commissions_amount is used by list UI
        setValue('commissions_amount', (result as any).commission_deduction || 0);
        // total_royalties shown in list - align with gross by default
        setValue('total_royalties', result.gross_royalties || 0);
        // amount_due should mirror net_payable by default
        setValue('net_payable', result.net_payable || 0);
        setValue('amount_due', result.net_payable || 0);
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
      const clientContact = contacts.find(c => c.id === clientId);
      if (clientContact) {
        console.log('Loading agreements for client:', clientContact.name);
        
        // Try both direct contract lookup and payee hierarchy lookup
        Promise.all([
          getClientAgreements(clientId),
          getPayeeAgreements(clientContact.name)
        ]).then(([directAgreements, payeeAgreements]) => {
          // Combine and deduplicate agreements
          const allAgreements = [...directAgreements];
          payeeAgreements.forEach(payeeAgreement => {
            if (!allAgreements.find(a => a.id === payeeAgreement.id)) {
              allAgreements.push(payeeAgreement);
            }
          });
          
          console.log('Total agreements found:', allAgreements.length);
          setAvailableAgreements(allAgreements);
          
          // Auto-select first agreement and set to agreement method
          if (allAgreements.length > 0) {
            setSelectedAgreement(allAgreements[0].id);
            setCalculationMethod('agreement');
            console.log('Auto-selected agreement:', allAgreements[0].title);
            
            // Auto-calculate for existing payouts to populate commissions
            if (payout) {
              const periodStart = watch('period_start');
              const periodEnd = watch('period_end');
              if (periodStart && periodEnd) {
                calculateAgreementBasedRoyalties(allAgreements[0].id, clientId, periodStart, periodEnd)
                  .then(result => {
                    if (result) {
                      setCalculationResult(result);
                      setValue('commissions_amount', (result as any).commission_deduction || 0);
                    } else {
                      // Fallback if result is empty
                      const gross = Number(watch('gross_royalties') ?? watch('total_royalties') ?? 0) || 0;
                      const rate = Number(allAgreements[0]?.commission_percentage) || 0;
                      if (gross > 0 && rate > 0) {
                        setValue('commissions_amount', parseFloat(((gross * rate) / 100).toFixed(2)));
                      }
                    }
                  })
                  .catch(error => console.error('Auto-calculation error:', error));
              } else {
                // No explicit dates: derive commission from agreement % and current gross
                const gross = Number(watch('gross_royalties') ?? watch('total_royalties') ?? 0) || 0;
                const rate = Number(allAgreements[0]?.commission_percentage) || 0;
                if (gross > 0 && rate > 0) {
                  setValue('commissions_amount', parseFloat(((gross * rate) / 100).toFixed(2)));
                }
              }
            }
          } else {
            setCalculationMethod('manual');
            console.log('No agreements found, using manual calculation');
          }
        }).catch(error => {
          console.error('Error loading agreements:', error);
          setAvailableAgreements([]);
          setCalculationMethod('manual');
        });
      }
    } else {
      setAvailableAgreements([]);
      setCalculationMethod('manual');
    }
  }, [watch('client_id'), hasAgreementModule, contacts]);

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
          <Label htmlFor="client_id">Payee Name *</Label>
          <Select 
            onValueChange={(value) => setValue('client_id', value)} 
            value={watch('client_id') ? String(watch('client_id')) : ''}
            defaultValue={payout?.client_id ? String(payout.client_id) : ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payee" />
            </SelectTrigger>
            <SelectContent>
              {clientContacts.map((contact) => (
                <SelectItem key={contact.id} value={String(contact.id)}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.client_id && (
            <p className="text-sm text-red-600">Payee is required</p>
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
          disabled={calculating || calculationLoading || !watch('client_id') || !watch('period_start') || !watch('period_end') || (calculationMethod === 'agreement' && availableAgreements.length === 0)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {calculating || calculationLoading ? 'Calculating...' : 
           calculationMethod === 'agreement' ? 'Calculate with Agreement Terms' : 'Calculate Totals'}
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
            <Label htmlFor="total_royalties">Total Royalties</Label>
            <Input
              id="total_royalties"
              type="number"
              step="0.01"
              {...register('total_royalties', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissions_amount">Commission (Agreement)</Label>
            <Input
              id="commissions_amount"
              type="number"
              step="0.01"
              {...register('commissions_amount', { valueAsNumber: true })}
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