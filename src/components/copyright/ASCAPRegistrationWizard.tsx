import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Key,
  Server,
  FileText,
  Send,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { getASCAPFTPConfig, validateASCAPSenderCode, ASCAP_CONFIG } from '@/lib/ascap-cwr-validation';
import { useFTPCredentials } from '@/hooks/useFTPCredentials';
import { useToast } from '@/hooks/use-toast';

interface ASCAPRegistrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCopyrights: string[];
  onComplete: (ftpCredentialId: string, senderCode: string) => void;
}

type WizardStep = 'requirements' | 'sender-code' | 'ftp-setup' | 'review';

const ASCAPRegistrationWizard: React.FC<ASCAPRegistrationWizardProps> = ({
  open,
  onOpenChange,
  selectedCopyrights,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('requirements');
  const [senderCode, setSenderCode] = useState('');
  const [senderCodeError, setSenderCodeError] = useState<string | null>(null);
  const [ftpUsername, setFtpUsername] = useState('');
  const [ftpPassword, setFtpPassword] = useState('');
  const [isCreatingCredential, setIsCreatingCredential] = useState(false);
  const [createdCredentialId, setCreatedCredentialId] = useState<string | null>(null);

  const { credentials, createCredential } = useFTPCredentials();
  const { toast } = useToast();

  // Check if ASCAP credentials already exist
  const existingASCAPCredential = credentials.find(c => c.pro_name === 'ASCAP');

  const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
    { key: 'requirements', label: 'Requirements', icon: <Info className="h-4 w-4" /> },
    { key: 'sender-code', label: 'Sender Code', icon: <Key className="h-4 w-4" /> },
    { key: 'ftp-setup', label: 'FTP Setup', icon: <Server className="h-4 w-4" /> },
    { key: 'review', label: 'Review & Submit', icon: <Send className="h-4 w-4" /> }
  ];

  const getStepIndex = (step: WizardStep) => steps.findIndex(s => s.key === step);
  const progress = ((getStepIndex(currentStep) + 1) / steps.length) * 100;

  const handleSenderCodeValidation = () => {
    const validation = validateASCAPSenderCode(senderCode);
    if (!validation.isValid) {
      setSenderCodeError(validation.errors[0]);
      return false;
    }
    setSenderCodeError(null);
    return true;
  };

  const handleCreateFTPCredential = async () => {
    if (!ftpUsername || !ftpPassword) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter your ASCAP FTP username and password',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingCredential(true);
    try {
      const ascapConfig = getASCAPFTPConfig();
      const credential = await createCredential({
        ...ascapConfig,
        username: ftpUsername,
        password: ftpPassword
      });

      if (credential) {
        setCreatedCredentialId(credential.id);
        toast({
          title: 'ASCAP Credentials Saved',
          description: 'Your ASCAP FTP credentials have been securely stored'
        });
        setCurrentStep('review');
      }
    } finally {
      setIsCreatingCredential(false);
    }
  };

  const handleComplete = () => {
    const credentialId = createdCredentialId || existingASCAPCredential?.id;
    if (credentialId && senderCode) {
      onComplete(credentialId, senderCode);
      onOpenChange(false);
    }
  };

  const goNext = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentStep === 'sender-code' && !handleSenderCodeValidation()) {
      return;
    }
    if (currentStep === 'ftp-setup' && !existingASCAPCredential && !createdCredentialId) {
      return;
    }
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const goBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'requirements':
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Before registering works with ASCAP, ensure you have the following:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">ASCAP Publisher Member Account</h4>
                      <p className="text-sm text-muted-foreground">
                        You must be an ASCAP publisher member with electronic registration privileges.
                      </p>
                      <a 
                        href="https://www.ascap.com/become-a-member" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 mt-1"
                      >
                        Apply for membership <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">CISAC Sender Code</h4>
                      <p className="text-sm text-muted-foreground">
                        A unique identifier for your publishing entity. Contact ASCAP if you don't have one.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Server className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">ASCAP SFTP Credentials</h4>
                      <p className="text-sm text-muted-foreground">
                        Username and password for ASCAP's SFTP server to deliver CWR files.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">IPI Name Numbers</h4>
                      <p className="text-sm text-muted-foreground">
                        IPI numbers for your publishing entity and all controlled writers (recommended).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'sender-code':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderCode">CISAC Sender Code</Label>
              <Input
                id="senderCode"
                value={senderCode}
                onChange={(e) => {
                  setSenderCode(e.target.value.toUpperCase());
                  setSenderCodeError(null);
                }}
                placeholder="e.g., MYMUSIC"
                className={senderCodeError ? 'border-red-500' : ''}
              />
              {senderCodeError && (
                <p className="text-sm text-red-600">{senderCodeError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                This is your unique CISAC identifier. It's typically 2-9 uppercase alphanumeric characters.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Don't have a sender code? Contact ASCAP's Member Services to request one. This is required for CWR file generation.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'ftp-setup':
        return (
          <div className="space-y-4">
            {existingASCAPCredential ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ASCAP FTP credentials already configured ({existingASCAPCredential.host}). You can proceed to the next step.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enter your ASCAP SFTP credentials. These will be securely stored for automated file delivery.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Host</Label>
                      <Input value={ASCAP_CONFIG.SFTP_HOST} disabled />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input value={ASCAP_CONFIG.SFTP_PORT} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ftpUsername">FTP Username</Label>
                    <Input
                      id="ftpUsername"
                      value={ftpUsername}
                      onChange={(e) => setFtpUsername(e.target.value)}
                      placeholder="Your ASCAP FTP username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ftpPassword">FTP Password</Label>
                    <Input
                      id="ftpPassword"
                      type="password"
                      value={ftpPassword}
                      onChange={(e) => setFtpPassword(e.target.value)}
                      placeholder="Your ASCAP FTP password"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateFTPCredential} 
                    disabled={isCreatingCredential || !ftpUsername || !ftpPassword}
                    className="w-full"
                  >
                    {isCreatingCredential ? 'Saving...' : 'Save ASCAP Credentials'}
                  </Button>
                </div>
              </>
            )}

            {createdCredentialId && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Credentials saved successfully! You can now proceed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Works to Register</Label>
                    <p className="font-medium">{selectedCopyrights.length} copyright works</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Destination PRO</Label>
                    <Badge className="mt-1">ASCAP</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sender Code</Label>
                    <p className="font-mono">{senderCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Delivery Method</Label>
                    <p className="font-medium">SFTP (Automated)</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground">Expected Timeline</Label>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• CWR file generated and delivered immediately</li>
                    <li>• ASCAP processes submission within 5-10 business days</li>
                    <li>• Acknowledgment file available for download</li>
                    <li>• Work statuses updated automatically</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                By proceeding, you confirm that you have the right to register these works with ASCAP on behalf of the listed writers and publishers.
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ASCAP Bulk Registration Wizard</DialogTitle>
          <DialogDescription>
            Register {selectedCopyrights.length} works with ASCAP via CWR submission
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {steps.map((step, index) => (
              <div 
                key={step.key}
                className={`flex items-center gap-1 ${
                  getStepIndex(currentStep) >= index ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={goBack}
            disabled={currentStep === 'requirements'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === 'review' ? (
            <Button onClick={handleComplete}>
              <Send className="h-4 w-4 mr-2" />
              Submit Registration
            </Button>
          ) : (
            <Button 
              onClick={goNext}
              disabled={
                (currentStep === 'ftp-setup' && !existingASCAPCredential && !createdCredentialId) ||
                (currentStep === 'sender-code' && !senderCode)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ASCAPRegistrationWizard;
