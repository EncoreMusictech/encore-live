import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormPartiesProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormParties: React.FC<ArtistAgreementFormPartiesProps> = ({
  data,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Artist Contact Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artistAddress">Address</Label>
            <Textarea
              id="artistAddress"
              value={data.artistAddress}
              onChange={(e) => onChange({ artistAddress: e.target.value })}
              placeholder="Enter artist's address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="artistPhone">Phone Number</Label>
              <Input
                id="artistPhone"
                value={data.artistPhone}
                onChange={(e) => onChange({ artistPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistEmail">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="artistEmail"
                type="email"
                value={data.artistEmail}
                onChange={(e) => onChange({ artistEmail: e.target.value })}
                placeholder="artist@example.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Label/Company Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="labelName">
              Label/Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="labelName"
              value={data.labelName}
              onChange={(e) => onChange({ labelName: e.target.value })}
              placeholder="Enter label or company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labelAddress">Address</Label>
            <Textarea
              id="labelAddress"
              value={data.labelAddress}
              onChange={(e) => onChange({ labelAddress: e.target.value })}
              placeholder="Enter label/company address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labelContact">Primary Contact</Label>
            <Input
              id="labelContact"
              value={data.labelContact}
              onChange={(e) => onChange({ labelContact: e.target.value })}
              placeholder="Enter primary contact name and details"
            />
          </div>
        </div>
      </div>

      <Card className="bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-sm">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This contact information will be used for contract notifications and official communications. 
            Ensure all details are accurate and up-to-date.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};