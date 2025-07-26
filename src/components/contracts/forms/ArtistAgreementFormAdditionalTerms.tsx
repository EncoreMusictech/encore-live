import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormAdditionalTermsProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormAdditionalTerms: React.FC<ArtistAgreementFormAdditionalTermsProps> = ({
  data,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Exclusivity & Key Terms</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="exclusivity"
              checked={data.exclusivity}
              onCheckedChange={(checked) => onChange({ exclusivity: checked })}
            />
            <Label htmlFor="exclusivity">Exclusive Agreement</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyPersonClause">Key Person Clause</Label>
            <Textarea
              id="keyPersonClause"
              value={data.keyPersonClause}
              onChange={(e) => onChange({ keyPersonClause: e.target.value })}
              placeholder="Describe any key person provisions"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leavingMemberClause">Leaving Member Clause</Label>
            <Textarea
              id="leavingMemberClause"
              value={data.leavingMemberClause}
              onChange={(e) => onChange({ leavingMemberClause: e.target.value })}
              placeholder="Describe provisions for leaving members (for groups/bands)"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Revenue Splits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="touringSplit">Touring Split</Label>
            <Input
              id="touringSplit"
              value={data.touringSplit}
              onChange={(e) => onChange({ touringSplit: e.target.value })}
              placeholder="e.g., 85/15 in favor of artist"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchandisingSplit">Merchandising Split</Label>
            <Input
              id="merchandisingSplit"
              value={data.merchandisingSplit}
              onChange={(e) => onChange({ merchandisingSplit: e.target.value })}
              placeholder="e.g., 70/30 in favor of artist"
            />
          </div>
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-sm">Additional Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These additional terms help define the scope and specific conditions of the agreement. 
            All terms are optional but may be important depending on the artist and deal structure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};