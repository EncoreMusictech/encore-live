import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Music,
  FileText
} from 'lucide-react';
import { useCopyright, Copyright } from '@/hooks/useCopyright';
import { useCopyrightExports } from '@/hooks/useCopyrightExports';
import { useFTPCredentials } from '@/hooks/useFTPCredentials';
import { usePRORegistrations } from '@/hooks/usePRORegistrations';
import { useToast } from '@/hooks/use-toast';
import { validateASCAPBatch, generateASCAPFileName } from '@/lib/ascap-cwr-validation';
import ASCAPRegistrationWizard from './ASCAPRegistrationWizard';

interface BulkPRORegistrationProps {
  selectedCopyrightIds: string[];
  onComplete?: () => void;
}

const BulkPRORegistration: React.FC<BulkPRORegistrationProps> = ({
  selectedCopyrightIds,
  onComplete
}) => {
  const [selectedPRO, setSelectedPRO] = useState<string>('');
  const [showASCAPWizard, setShowASCAPWizard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);

  const { copyrights, getWritersForCopyright, getPublishersForCopyright } = useCopyright();
  const { exportCopyrights } = useCopyrightExports();
  const { credentials } = useFTPCredentials();
  const { createSubmission, submissions } = usePRORegistrations();
  const { toast } = useToast();

  const selectedCopyrights = copyrights.filter(c => selectedCopyrightIds.includes(c.id));

  const supportedPROs = [
    { value: 'ASCAP', label: 'ASCAP', available: true },
    { value: 'BMI', label: 'BMI', available: false },
    { value: 'SESAC', label: 'SESAC', available: false },
    { value: 'SOCAN', label: 'SOCAN', available: false },
    { value: 'MLC', label: 'The MLC', available: false }
  ];

  const handlePROSelect = (pro: string) => {
    setSelectedPRO(pro);
    if (pro === 'ASCAP') {
      setShowASCAPWizard(true);
    }
  };

  const handleASCAPRegistration = async (ftpCredentialId: string, senderCode: string) => {
    if (selectedCopyrightIds.length === 0) {
      toast({
        title: 'No Works Selected',
        description: 'Please select at least one work to register',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress(10);

    try {
      // Gather writer and publisher data for validation
      const worksData = await Promise.all(
        selectedCopyrights.map(async (copyright) => {
          const writers = await getWritersForCopyright(copyright.id);
          const publishers = await getPublishersForCopyright(copyright.id);
          return { copyright, writers, publishers };
        })
      );

      setSubmissionProgress(30);

      // Validate the batch
      const validation = validateASCAPBatch(worksData, senderCode);
      if (!validation.isValid) {
        toast({
          title: 'Validation Failed',
          description: validation.errors[0],
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      setSubmissionProgress(50);

      // Generate CWR file name
      const sequenceNumber = (submissions.filter(s => s.pro_name === 'ASCAP').length || 0) + 1;
      const cwrFileName = generateASCAPFileName(senderCode, sequenceNumber);

      // Export CWR file
      const exportResult = await exportCopyrights({
        format: 'cwr',
        copyrightIds: selectedCopyrightIds,
        includeWriters: true,
        includePublishers: true
      });

      setSubmissionProgress(70);

      // Create submission record
      const works = selectedCopyrights.map(c => ({
        copyrightId: c.id,
        workTitle: c.work_title,
        workId: c.work_id || undefined
      }));

      const submission = await createSubmission('ASCAP', cwrFileName, null, works);

      setSubmissionProgress(90);

      if (submission) {
        toast({
          title: 'Registration Submitted',
          description: `${selectedCopyrightIds.length} works submitted to ASCAP. File: ${cwrFileName}`
        });
        
        setSubmissionProgress(100);
        onComplete?.();
      }
    } catch (error) {
      console.error('ASCAP registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to submit registration',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(0);
    }
  };

  if (selectedCopyrightIds.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Works Selected</h3>
            <p className="text-muted-foreground">
              Select copyright works from the table to register them with a PRO.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Register Works to PRO
          </CardTitle>
          <CardDescription>
            Submit selected works for registration with a Performing Rights Organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Works Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{selectedCopyrightIds.length} works selected</span>
            </div>
            <Badge variant="secondary">Ready for Registration</Badge>
          </div>

          {/* PRO Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select PRO</label>
            <Select value={selectedPRO} onValueChange={handlePROSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Performing Rights Organization" />
              </SelectTrigger>
              <SelectContent>
                {supportedPROs.map(pro => (
                  <SelectItem 
                    key={pro.value} 
                    value={pro.value}
                    disabled={!pro.available}
                  >
                    <div className="flex items-center gap-2">
                      <span>{pro.label}</span>
                      {!pro.available && (
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submission Progress */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Submitting registration...</span>
                <span>{submissionProgress}%</span>
              </div>
              <Progress value={submissionProgress} />
            </div>
          )}

          {/* Quick validation summary */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Selected works will be validated for CWR compliance before submission.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ASCAP Registration Wizard */}
      <ASCAPRegistrationWizard
        open={showASCAPWizard}
        onOpenChange={setShowASCAPWizard}
        selectedCopyrights={selectedCopyrightIds}
        onComplete={handleASCAPRegistration}
      />
    </div>
  );
};

export default BulkPRORegistration;
