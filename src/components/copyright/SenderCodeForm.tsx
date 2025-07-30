import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle, Upload, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSenderCodes, type SenderCode, type ProType } from '@/hooks/useSenderCodes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const senderCodeSchema = z.object({
  sender_code: z
    .string()
    .min(1, 'Sender code is required')
    .max(9, 'Sender code must be 9 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Sender code must contain only uppercase letters and numbers'),
  company_name: z.string().min(1, 'Company name is required'),
  ipi_cae_number: z.string().optional(),
  contact_email: z.string().email('Valid email is required'),
  target_pros: z.array(z.string()).min(1, 'Select at least one PRO'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof senderCodeSchema>;

const PRO_OPTIONS: { value: ProType; label: string; description: string }[] = [
  { value: 'ASCAP', label: 'ASCAP', description: 'American Society of Composers, Authors and Publishers' },
  { value: 'BMI', label: 'BMI', description: 'Broadcast Music, Inc.' },
  { value: 'ICE', label: 'ICE', description: 'International Copyright Enterprise' },
  { value: 'SOCAN', label: 'SOCAN', description: 'Society of Composers, Authors and Music Publishers of Canada' },
  { value: 'PRS', label: 'PRS', description: 'Performing Right Society' },
  { value: 'OTHER', label: 'Other', description: 'Other performing rights organization' },
];

interface SenderCodeFormProps {
  initialData?: SenderCode | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SenderCodeForm: React.FC<SenderCodeFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { createSenderCode, updateSenderCode, checkDuplicate } = useSenderCodes();
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(senderCodeSchema),
    defaultValues: {
      sender_code: initialData?.sender_code || '',
      company_name: initialData?.company_name || '',
      ipi_cae_number: initialData?.ipi_cae_number || '',
      contact_email: initialData?.contact_email || user?.email || '',
      target_pros: initialData?.target_pros || [],
      notes: initialData?.notes || '',
    },
  });

  const watchedSenderCode = watch('sender_code');
  const watchedTargetPros = watch('target_pros');

  // Check for duplicates when sender code changes
  useEffect(() => {
    const checkForDuplicate = async () => {
      if (watchedSenderCode && watchedSenderCode.length >= 3) {
        const isDuplicate = await checkDuplicate(watchedSenderCode);
        setDuplicateWarning(isDuplicate);
      } else {
        setDuplicateWarning(false);
      }
    };

    const timeoutId = setTimeout(checkForDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedSenderCode, checkDuplicate]);

  const handleProToggle = (proValue: string) => {
    const currentPros = watchedTargetPros || [];
    const newPros = currentPros.includes(proValue)
      ? currentPros.filter(p => p !== proValue)
      : [...currentPros, proValue];
    setValue('target_pros', newPros);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('File size must be less than 10MB');
        return;
      }
      setSupportingFile(file);
    }
  };

  const generateRequestEmail = (formData: FormData) => {
    const proList = formData.target_pros.join(', ');
    const subject = `CWR Sender Code Registration Request - ${formData.sender_code}`;
    const body = `Dear PRO Team,

I am writing to request registration of a CWR sender code for my publishing company.

Company Details:
- Company Name: ${formData.company_name}
- Contact Email: ${formData.contact_email}
- IPI/CAE Number: ${formData.ipi_cae_number || 'Not provided'}

Requested Sender Code: ${formData.sender_code}
Target PRO(s): ${proList}

This sender code will be used for submitting Common Works Registration (CWR) files through the ENCORE music management platform. We require this code to properly route our copyright registrations and maintain compliance with industry standards.

Please confirm receipt of this request and provide information on the next steps in the registration process.

Thank you for your assistance.

Best regards,
${formData.company_name}
${formData.contact_email}

${formData.notes ? `Additional Notes: ${formData.notes}` : ''}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const senderCodeData = {
        sender_code: data.sender_code.toUpperCase(),
        company_name: data.company_name,
        ipi_cae_number: data.ipi_cae_number,
        contact_email: data.contact_email,
        target_pros: data.target_pros as ProType[],
        notes: data.notes,
        status: 'not_submitted' as const,
        supporting_document_url: undefined, // TODO: Implement file upload
      };

      if (initialData) {
        await updateSenderCode(initialData.id, senderCodeData);
      } else {
        await createSenderCode(senderCodeData);
      }

      onSuccess();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sender Code Field */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="sender_code">Sender Code *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  A unique 9-character alphanumeric identifier used in CWR files to identify the sender organization.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative">
          <Input
            id="sender_code"
            {...register('sender_code')}
            placeholder="e.g., COMPANY01"
            className="uppercase"
            maxLength={9}
          />
          {duplicateWarning && (
            <div className="absolute right-2 top-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
          )}
        </div>
        {errors.sender_code && (
          <p className="text-sm text-destructive">{errors.sender_code.message}</p>
        )}
        {duplicateWarning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: A sender code with this value may already exist in the system.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company_name">Company/Publisher Name *</Label>
        <Input
          id="company_name"
          {...register('company_name')}
          placeholder="Your Publishing Company"
        />
        {errors.company_name && (
          <p className="text-sm text-destructive">{errors.company_name.message}</p>
        )}
      </div>

      {/* IPI/CAE Number */}
      <div className="space-y-2">
        <Label htmlFor="ipi_cae_number">IPI/CAE Number</Label>
        <Input
          id="ipi_cae_number"
          {...register('ipi_cae_number')}
          placeholder="e.g., 00123456789"
        />
        {errors.ipi_cae_number && (
          <p className="text-sm text-destructive">{errors.ipi_cae_number.message}</p>
        )}
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact Email *</Label>
        <Input
          id="contact_email"
          type="email"
          {...register('contact_email')}
          placeholder="contact@company.com"
        />
        {errors.contact_email && (
          <p className="text-sm text-destructive">{errors.contact_email.message}</p>
        )}
      </div>

      {/* Target PROs */}
      <div className="space-y-3">
        <Label>Target PRO(s) *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRO_OPTIONS.map((pro) => (
            <div
              key={pro.value}
              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleProToggle(pro.value)}
            >
              <Checkbox
                checked={watchedTargetPros?.includes(pro.value) || false}
                onChange={() => handleProToggle(pro.value)}
              />
              <div className="flex-1">
                <div className="font-medium">{pro.label}</div>
                <div className="text-sm text-muted-foreground">{pro.description}</div>
              </div>
            </div>
          ))}
        </div>
        {errors.target_pros && (
          <p className="text-sm text-destructive">{errors.target_pros.message}</p>
        )}
      </div>

      {/* Supporting Documents */}
      <div className="space-y-2">
        <Label htmlFor="supporting_file">Supporting Documentation (Optional)</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground mb-2">
              Upload PDF documents (Max 10MB)
            </div>
            <input
              type="file"
              id="supporting_file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('supporting_file')?.click()}
            >
              Choose File
            </Button>
            {supportingFile && (
              <div className="mt-2 text-sm text-foreground">
                Selected: {supportingFile.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Any additional information or special requirements"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || duplicateWarning}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {initialData ? 'Update Sender Code' : 'Create Sender Code'}
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => generateRequestEmail(watch())}
          disabled={!watch('sender_code') || !watch('company_name')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Generate Request Email
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};