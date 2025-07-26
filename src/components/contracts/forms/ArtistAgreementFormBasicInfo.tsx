import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormBasicInfoProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormBasicInfo: React.FC<ArtistAgreementFormBasicInfoProps> = ({
  data,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Artist Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="artistName">
              Artist Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="artistName"
              value={data.artistName}
              onChange={(e) => onChange({ artistName: e.target.value })}
              placeholder="Enter artist name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="legalName">
              Legal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legalName"
              value={data.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              placeholder="Enter legal name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stageName">Stage Name / Alias</Label>
            <Input
              id="stageName"
              value={data.stageName}
              onChange={(e) => onChange({ stageName: e.target.value })}
              placeholder="Enter stage name or alias"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Agreement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="territory">Territory</Label>
            <Select
              value={data.territory}
              onValueChange={(value) => onChange({ territory: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate">
              Effective Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="effectiveDate"
              type="date"
              value={data.effectiveDate}
              onChange={(e) => onChange({ effectiveDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={data.expirationDate}
              onChange={(e) => onChange({ expirationDate: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};