import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, Music, FileText, Users, Calendar } from "lucide-react";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormReviewProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormReview: React.FC<ArtistAgreementFormReviewProps> = ({
  data,
  onChange
}) => {
  const validationChecks = [
    {
      label: "Artist Information Complete",
      isValid: !!(data.artistName && data.legalName),
      icon: Users
    },
    {
      label: "Agreement Terms Defined",
      isValid: !!(data.recordingCommitment && data.royaltyRate),
      icon: FileText
    },
    {
      label: "Contact Information Provided",
      isValid: !!(data.artistEmail && data.labelName),
      icon: Users
    },
    {
      label: "Works Selected",
      isValid: data.selectedWorks.length > 0,
      icon: Music
    }
  ];

  const allValid = validationChecks.every(check => check.isValid);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Agreement Review</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please review all information before submitting the agreement.
        </p>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {allValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationChecks.map((check, index) => {
              const Icon = check.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  {check.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{check.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agreement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artist Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Artist Name</div>
              <div className="font-medium">{data.artistName || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Legal Name</div>
              <div className="font-medium">{data.legalName || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Agreement Type</div>
              <div className="font-medium">
                <Badge variant="outline">{data.agreementType}</Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Territory</div>
              <div className="font-medium">{data.territory}</div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agreement Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Royalty Rate</div>
              <div className="font-medium">{data.royaltyRate || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Advance Amount</div>
              <div className="font-medium">{data.advanceAmount || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Exclusivity</div>
              <div className="font-medium">
                <Badge variant={data.exclusivity ? "default" : "secondary"}>
                  {data.exclusivity ? "Exclusive" : "Non-Exclusive"}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Effective Date</div>
              <div className="font-medium">{data.effectiveDate || "Not specified"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="w-4 h-4" />
            Selected Works ({data.selectedWorks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.selectedWorks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No works selected
            </div>
          ) : (
            <div className="space-y-2">
              {data.selectedWorks.map((work, index) => (
                <div key={work.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{work.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {work.artist} • {work.album}
                    </div>
                  </div>
                  <Badge variant="outline">{work.genre}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artist Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{data.artistEmail || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{data.artistPhone || "Not specified"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Label Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Label Name</div>
              <div className="font-medium">{data.labelName || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Primary Contact</div>
              <div className="font-medium">{data.labelContact || "Not specified"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!allValid && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Incomplete Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please complete all required fields before submitting the agreement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};