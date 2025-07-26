import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormTermsProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormTerms: React.FC<ArtistAgreementFormTermsProps> = ({
  data,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Recording Commitment</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recordingCommitment">
              Recording Commitment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="recordingCommitment"
              value={data.recordingCommitment}
              onChange={(e) => onChange({ recordingCommitment: e.target.value })}
              placeholder="Describe the recording commitment (e.g., minimum number of albums, singles, etc.)"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advanceAmount">Advance Amount</Label>
            <Input
              id="advanceAmount"
              value={data.advanceAmount}
              onChange={(e) => onChange({ advanceAmount: e.target.value })}
              placeholder="$0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="royaltyRate">
              Royalty Rate <span className="text-destructive">*</span>
            </Label>
            <Input
              id="royaltyRate"
              value={data.royaltyRate}
              onChange={(e) => onChange({ royaltyRate: e.target.value })}
              placeholder="e.g., 15% of net receipts"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mechanicalRate">Mechanical Rate</Label>
            <Input
              id="mechanicalRate"
              value={data.mechanicalRate}
              onChange={(e) => onChange({ mechanicalRate: e.target.value })}
              placeholder="e.g., Statutory rate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="performanceRoyalty">Performance Royalty</Label>
            <Input
              id="performanceRoyalty"
              value={data.performanceRoyalty}
              onChange={(e) => onChange({ performanceRoyalty: e.target.value })}
              placeholder="e.g., 50/50 split"
            />
          </div>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Important Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These financial terms will be subject to industry standards and legal review. 
            Consult with entertainment legal counsel before finalizing any agreement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};