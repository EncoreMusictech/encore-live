import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AgreementType } from "./PublishingAgreementForm";

interface AgreementTypeTermsProps {
  agreementType: AgreementType;
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

export function AgreementTypeTerms({ agreementType, formData, onUpdate }: AgreementTypeTermsProps) {
  if (agreementType === "administration") {
    return <AdministrationTerms formData={formData} onUpdate={onUpdate} />;
  } else if (agreementType === "co_publishing") {
    return <CoPublishingTerms formData={formData} onUpdate={onUpdate} />;
  } else if (agreementType === "exclusive_songwriter") {
    return <ExclusiveSongwriterTerms formData={formData} onUpdate={onUpdate} />;
  } else if (agreementType === "catalog_acquisition") {
    return <CatalogAcquisitionTerms formData={formData} onUpdate={onUpdate} />;
  }
  
  return null;
}

function AdministrationTerms({ formData, onUpdate }: { formData: any; onUpdate: (field: string, value: any) => void }) {
  const adminRightsOptions = [
    "Sync", "Mechanical", "Print", "Digital", "Performance", "Grand Rights"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administration Terms</CardTitle>
        <CardDescription>
          Configure administrative rights and fee structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Admin Rights</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {adminRightsOptions.map((right) => (
              <div key={right} className="flex items-center space-x-2">
                <Checkbox
                  id={right}
                  checked={formData.admin_rights?.includes(right) || false}
                  onCheckedChange={(checked) => {
                    const current = formData.admin_rights || [];
                    const newRights = checked 
                      ? [...current, right]
                      : current.filter((r: string) => r !== right);
                    onUpdate("admin_rights", newRights);
                  }}
                />
                <Label htmlFor={right} className="text-sm">{right}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin_fee">Admin Fee (%)</Label>
            <Input
              id="admin_fee"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.admin_fee_percentage || ""}
              onChange={(e) => onUpdate("admin_fee_percentage", parseFloat(e.target.value) || 0)}
              placeholder="15"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin_controlled_share">Admin % of Controlled Share</Label>
            <Input
              id="admin_controlled_share"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.admin_controlled_share || ""}
              onChange={(e) => onUpdate("admin_controlled_share", parseFloat(e.target.value) || 0)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="approval_rights">Approval Rights</Label>
            <Select 
              value={formData.approval_rights || "pre_approved"}
              onValueChange={(value) => onUpdate("approval_rights", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select approval rights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_approved">Pre-approved</SelectItem>
                <SelectItem value="must_approve_syncs">Must Approve Syncs</SelectItem>
                <SelectItem value="must_approve_all">Must Approve All Uses</SelectItem>
                <SelectItem value="consultation_only">Consultation Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tail_period">Tail Period (months)</Label>
            <Input
              id="tail_period"
              type="number"
              min="0"
              value={formData.tail_period_months || ""}
              onChange={(e) => onUpdate("tail_period_months", parseInt(e.target.value) || 0)}
              placeholder="6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reversion_conditions">Reversion Conditions</Label>
          <Textarea
            id="reversion_conditions"
            value={formData.reversion_conditions || ""}
            onChange={(e) => onUpdate("reversion_conditions", e.target.value)}
            placeholder="Specify conditions for reversion of rights..."
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CoPublishingTerms({ formData, onUpdate }: { formData: any; onUpdate: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Co-Publishing Terms</CardTitle>
        <CardDescription>
          Configure ownership splits and revenue sharing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="publisher_share">Publisher Share (%)</Label>
            <Input
              id="publisher_share"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.publisher_share_percentage || ""}
              onChange={(e) => onUpdate("publisher_share_percentage", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="writer_share">Writer Share (%)</Label>
            <Input
              id="writer_share"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.writer_share_percentage || ""}
              onChange={(e) => onUpdate("writer_share_percentage", parseFloat(e.target.value) || 0)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sync_split">Sync Revenue Split (%)</Label>
            <Input
              id="sync_split"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.sync_revenue_split || ""}
              onChange={(e) => onUpdate("sync_revenue_split", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="print_split">Print Revenue Split (%)</Label>
            <Input
              id="print_split"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.print_revenue_split || ""}
              onChange={(e) => onUpdate("print_revenue_split", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mechanical_split">Mechanical Split (%)</Label>
            <Input
              id="mechanical_split"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.mechanical_revenue_split || ""}
              onChange={(e) => onUpdate("mechanical_revenue_split", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advance_amount">Advance Amount ($)</Label>
            <Input
              id="advance_amount"
              type="number"
              min="0"
              value={formData.advance_amount || ""}
              onChange={(e) => onUpdate("advance_amount", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_commitment">Delivery Commitment (songs/year)</Label>
            <Input
              id="delivery_commitment"
              type="number"
              min="0"
              value={formData.delivery_commitment || ""}
              onChange={(e) => onUpdate("delivery_commitment", parseInt(e.target.value) || 0)}
              placeholder="12"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recoupable"
              checked={formData.recoupable || false}
              onCheckedChange={(checked) => onUpdate("recoupable", !!checked)}
            />
            <Label htmlFor="recoupable">Recoupable</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclusivity"
              checked={formData.exclusivity || false}
              onCheckedChange={(checked) => onUpdate("exclusivity", !!checked)}
            />
            <Label htmlFor="exclusivity">Exclusivity</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="option_periods"
              checked={formData.option_periods || false}
              onCheckedChange={(checked) => onUpdate("option_periods", !!checked)}
            />
            <Label htmlFor="option_periods">Option Periods</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExclusiveSongwriterTerms({ formData, onUpdate }: { formData: any; onUpdate: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exclusive Songwriter Terms</CardTitle>
        <CardDescription>
          Configure exclusivity period and delivery requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Exclusivity Period Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.exclusivity_period_start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.exclusivity_period_start ? format(formData.exclusivity_period_start, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.exclusivity_period_start}
                  onSelect={(date) => onUpdate("exclusivity_period_start", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Exclusivity Period End</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.exclusivity_period_end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.exclusivity_period_end ? format(formData.exclusivity_period_end, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.exclusivity_period_end}
                  onSelect={(date) => onUpdate("exclusivity_period_end", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advance_amount">Advance Amount ($)</Label>
            <Input
              id="advance_amount"
              type="number"
              min="0"
              value={formData.advance_amount || ""}
              onChange={(e) => onUpdate("advance_amount", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_requirement">Delivery Requirement (songs/year)</Label>
            <Input
              id="delivery_requirement"
              type="number"
              min="0"
              value={formData.delivery_requirement || ""}
              onChange={(e) => onUpdate("delivery_requirement", parseInt(e.target.value) || 0)}
              placeholder="24"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mechanical_rate">Mechanical Royalty Rate (%)</Label>
            <Input
              id="mechanical_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.mechanical_royalty_rate || ""}
              onChange={(e) => onUpdate("mechanical_royalty_rate", parseFloat(e.target.value) || 0)}
              placeholder="75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync_rate">Sync Royalty Rate (%)</Label>
            <Input
              id="sync_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.sync_royalty_rate || ""}
              onChange={(e) => onUpdate("sync_royalty_rate", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="print_rate">Print Royalty Rate (%)</Label>
            <Input
              id="print_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.print_royalty_rate || ""}
              onChange={(e) => onUpdate("print_royalty_rate", parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recoupable"
              checked={formData.recoupable || false}
              onCheckedChange={(checked) => onUpdate("recoupable", !!checked)}
            />
            <Label htmlFor="recoupable">Recoupable</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="renewal_options"
              checked={formData.renewal_options || false}
              onCheckedChange={(checked) => onUpdate("renewal_options", !!checked)}
            />
            <Label htmlFor="renewal_options">Renewal Options</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogAcquisitionTerms({ formData, onUpdate }: { formData: any; onUpdate: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog Acquisition Terms</CardTitle>
        <CardDescription>
          Configure acquisition price and rights transfer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="acquisition_price">Acquisition Price ($)</Label>
            <Input
              id="acquisition_price"
              type="number"
              min="0"
              value={formData.acquisition_price || ""}
              onChange={(e) => onUpdate("acquisition_price", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights_acquired">Rights Acquired</Label>
            <Select onValueChange={(value) => onUpdate("rights_acquired", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select rights acquired" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100_percent">100% Publishing</SelectItem>
                <SelectItem value="partial">Partial Publishing</SelectItem>
                <SelectItem value="admin_only">Admin Only</SelectItem>
                <SelectItem value="masters_and_publishing">Masters & Publishing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="royalty_override">Royalty Override to Seller (%)</Label>
            <Input
              id="royalty_override"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.royalty_override_to_seller || ""}
              onChange={(e) => onUpdate("royalty_override_to_seller", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tail_period">Tail Period (months)</Label>
            <Input
              id="tail_period"
              type="number"
              min="0"
              value={formData.tail_period_months || ""}
              onChange={(e) => onUpdate("tail_period_months", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquired_work_list">Acquired Work List URL</Label>
          <Input
            id="acquired_work_list"
            type="url"
            value={formData.acquired_work_list_url || ""}
            onChange={(e) => onUpdate("acquired_work_list_url", e.target.value)}
            placeholder="https://example.com/catalog.csv"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reversion_clause">Reversion Clause</Label>
          <Textarea
            id="reversion_clause"
            value={formData.reversion_clause || ""}
            onChange={(e) => onUpdate("reversion_clause", e.target.value)}
            placeholder="Specify reversion conditions if applicable..."
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_publisher_participation">Original Publisher Participation</Label>
          <Textarea
            id="original_publisher_participation"
            value={formData.original_publisher_participation || ""}
            onChange={(e) => onUpdate("original_publisher_participation", e.target.value)}
            placeholder="Describe any ongoing participation or split mapping..."
            className="min-h-[80px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="perpetual_rights"
            checked={formData.perpetual_rights || false}
            onCheckedChange={(checked) => onUpdate("perpetual_rights", !!checked)}
          />
          <Label htmlFor="perpetual_rights">Perpetual Rights</Label>
        </div>
      </CardContent>
    </Card>
  );
}