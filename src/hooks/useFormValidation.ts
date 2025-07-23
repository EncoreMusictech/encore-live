import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schemas for different form types
const payoutValidationSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  period: z.string().min(1, 'Period is required'),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  gross_royalties: z.number().min(0, 'Gross royalties must be non-negative'),
  total_expenses: z.number().min(0, 'Total expenses must be non-negative'),
  net_payable: z.number(),
  amount_due: z.number(),
  payment_method: z.enum(['ACH', 'Wire', 'PayPal', 'Check']).optional(),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
  statement_notes: z.string().optional(),
});

const expenseValidationSchema = z.object({
  expense_type: z.string().min(1, 'Expense type is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  percentage_rate: z.number().min(0).max(100, 'Percentage must be between 0 and 100').optional(),
  is_percentage: z.boolean(),
});

const contractValidationSchema = z.object({
  title: z.string().min(1, 'Contract title is required'),
  counterparty_name: z.string().min(1, 'Counterparty name is required'),
  contract_type: z.enum(['artist', 'producer', 'publishing', 'distribution', 'sync']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  territories: z.array(z.string()).optional(),
  advance_amount: z.number().min(0).optional(),
  commission_percentage: z.number().min(0).max(100).optional(),
});

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  onError?: (errors: any) => void;
}

export function useFormValidation<T = any>({
  schema,
  defaultValues,
  onSubmit,
  onError,
}: UseFormValidationOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange' as const,
  });

  const {
    handleSubmit,
    formState: { errors, isValid, isDirty, dirtyFields },
    reset,
    watch,
    setValue,
    trigger,
  } = form;

  // Enhanced submit handler with error management
  const onSubmitWrapper = useCallback(async (data: any) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      reset(); // Reset form on successful submission
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'An error occurred while submitting the form');
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onError, reset]);

  // Field-level validation
  const validateField = useCallback(async (fieldName: string) => {
    return await trigger(fieldName as any);
  }, [trigger]);

  // Batch field validation
  const validateFields = useCallback(async (fieldNames: string[]) => {
    return await trigger(fieldNames as any);
  }, [trigger]);

  // Get validation state for specific fields
  const getFieldValidation = useCallback((fieldName: string) => {
    const error = (errors as any)[fieldName];
    const isDirtyField = (dirtyFields as any)[fieldName];
    
    return {
      hasError: !!error,
      error: error?.message || null,
      isDirty: isDirtyField,
      isValid: !error && isDirtyField,
    };
  }, [errors, dirtyFields]);

  // Real-time validation status
  const validationStatus = useMemo(() => {
    const errorCount = Object.keys(errors).length;
    const dirtyCount = Object.keys(dirtyFields).length;
    
    return {
      isValid,
      isDirty,
      hasErrors: errorCount > 0,
      errorCount,
      dirtyCount,
      completionPercentage: dirtyCount > 0 ? ((dirtyCount - errorCount) / dirtyCount) * 100 : 0,
    };
  }, [isValid, isDirty, errors, dirtyFields]);

  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const watchedValues = watch();

  // Debounced auto-save
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerAutoSave = useCallback(() => {
    if (!autoSaveEnabled || !isDirty || !isValid) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        await onSubmit?.(watchedValues);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // 2 second debounce

    setAutoSaveTimeout(timeout);
  }, [autoSaveEnabled, isDirty, isValid, watchedValues, onSubmit, autoSaveTimeout]);

  // Form state management utilities
  const formUtils = useMemo(() => ({
    resetToDefaults: () => reset(defaultValues as any),
    resetField: (fieldName: string) => setValue(fieldName as any, ((defaultValues as any)?.[fieldName] || '')),
    clearErrors: () => form.clearErrors(),
    setError: (fieldName: string, error: { message: string }) => 
      form.setError(fieldName as any, error),
  }), [reset, defaultValues, setValue, form]);

  return {
    // Form instance
    form,
    
    // Handlers
    handleSubmit: handleSubmit(onSubmitWrapper),
    validateField,
    validateFields,
    triggerAutoSave,
    
    // State
    isSubmitting,
    submitError,
    validationStatus,
    
    // Field utilities
    getFieldValidation,
    
    // Auto-save
    autoSaveEnabled,
    setAutoSaveEnabled,
    lastSaved,
    
    // Form utilities
    ...formUtils,
    
    // Direct form properties for convenience
    errors,
    isValid,
    isDirty,
    watch,
    setValue,
    reset,
  };
}

// Type-safe form data types
export type PayoutFormData = z.infer<typeof payoutValidationSchema>;
export type ExpenseFormData = z.infer<typeof expenseValidationSchema>;
export type ContractFormData = z.infer<typeof contractValidationSchema>;

// Pre-configured hooks for common forms
export const usePayoutForm = (options?: Omit<UseFormValidationOptions<PayoutFormData>, 'schema'>) =>
  useFormValidation({ ...options, schema: payoutValidationSchema });

export const useExpenseForm = (options?: Omit<UseFormValidationOptions<ExpenseFormData>, 'schema'>) =>
  useFormValidation({ ...options, schema: expenseValidationSchema });

export const useContractForm = (options?: Omit<UseFormValidationOptions<ContractFormData>, 'schema'>) =>
  useFormValidation({ ...options, schema: contractValidationSchema });

// Form validation schemas export
export const validationSchemas = {
  payout: payoutValidationSchema,
  expense: expenseValidationSchema,
  contract: contractValidationSchema,
};