import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, DollarSign, Users, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ValidationCheck {
  label: string;
  isValid: boolean;
  required: boolean;
}

interface ContractReviewProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
  customValidation?: ValidationCheck[];
}

export function ContractReview({ 
  data, 
  contractType = "contract",
  customValidation = []
}: ContractReviewProps) {
  // Basic validation checks
  const basicValidation: ValidationCheck[] = [
    {
      label: "Agreement title provided",
      isValid: !!(data.agreementTitle || data.title),
      required: true
    },
    {
      label: "Counterparty information complete",
      isValid: !!(data.counterparty || data.counterparty_name),
      required: true
    },
    {
      label: "Contact information provided",
      isValid: !!(data.firstParty?.contactName || data.party1_contact_name || data.contact_name) && 
               !!(data.firstParty?.email || data.party1_email || data.recipient_email),
      required: true
    },
    {
      label: "Effective date set",
      isValid: !!(data.effectiveDate || data.effective_date),
      required: false
    }
  ];

  const allValidation = [...basicValidation, ...customValidation];
  const requiredChecks = allValidation.filter(check => check.required);
  const allRequiredValid = requiredChecks.every(check => check.isValid);
  const totalValidChecks = allValidation.filter(check => check.isValid).length;

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allRequiredValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            Validation Status
          </CardTitle>
          <CardDescription>
            Review your {contractType} details before submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {allValidation.map((check, index) => (
              <div key={index} className="flex items-center gap-3">
                {check.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                )}
                <span className={check.isValid ? "text-foreground" : "text-muted-foreground"}>
                  {check.label}
                </span>
                {check.required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {totalValidChecks} of {allValidation.length} checks completed
              </span>
              <Badge variant={allRequiredValid ? "default" : "secondary"}>
                {allRequiredValid ? "Ready to Submit" : "Needs Attention"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreement Summary
          </CardTitle>
          <CardDescription>
            Overview of your {contractType} agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Agreement Details
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Title:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.agreementTitle || data.title || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Counterparty:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.counterparty || data.counterparty_name || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Territory:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.territory || "worldwide"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Timeline
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Effective Date:</span>
                  <p className="text-sm text-muted-foreground">
                    {(data.effectiveDate || data.effective_date) ? 
                      format(new Date(data.effectiveDate || data.effective_date), "PPP") : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Expiration Date:</span>
                  <p className="text-sm text-muted-foreground">
                    {(data.expirationDate || data.end_date) ? 
                      format(new Date(data.expirationDate || data.end_date), "PPP") : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Governing Law:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.governingLaw || data.governing_law || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Party Information */}
          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Primary Contact
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.firstParty?.contactName || data.party1_contact_name || data.contact_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Email:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.firstParty?.email || data.party1_email || data.recipient_email || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Phone:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.firstParty?.phone || data.party1_phone || data.contact_phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Counterparty Contact
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Company/Name:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.secondParty?.contactName || data.party2_contact_name || data.counterparty || data.counterparty_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Email:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.secondParty?.email || data.party2_email || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Phone:</span>
                  <p className="text-sm text-muted-foreground">
                    {data.secondParty?.phone || data.party2_phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {data.notes && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Additional Notes
              </h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {data.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready to Submit Alert */}
      {!allRequiredValid && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required information before submitting your {contractType} agreement.
            Missing required fields are marked above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}