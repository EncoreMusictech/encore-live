import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface DistributionFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function DistributionForm({ data, onChange }: DistributionFormProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribution Agreement Details</CardTitle>
          <CardDescription>
            Configure the distribution deal type and revenue sharing terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distribution Type</Label>
              <Select 
                value={data.distribution_type} 
                onValueChange={(value) => updateData('distribution_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select distribution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribution_only">Distribution Only</SelectItem>
                  <SelectItem value="label_services">Label Services</SelectItem>
                  <SelectItem value="full_label">Full Label Deal</SelectItem>
                  <SelectItem value="licensing">Licensing Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Territory</Label>
              <Select 
                value={data.territory} 
                onValueChange={(value) => updateData('territory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select territory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worldwide">Worldwide</SelectItem>
                  <SelectItem value="north_america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contract Term (Years)</Label>
              <Input
                type="number"
                value={data.contract_term || ""}
                onChange={(e) => updateData('contract_term', e.target.value)}
                placeholder="e.g., 3"
              />
            </div>

            <div className="space-y-2">
              <Label>Release Commitment</Label>
              <Input
                type="number"
                value={data.release_commitment || ""}
                onChange={(e) => updateData('release_commitment', e.target.value)}
                placeholder="e.g., 12"
              />
            </div>

            <div className="space-y-2">
              <Label>Exclusivity</Label>
              <Select 
                value={data.exclusivity} 
                onValueChange={(value) => updateData('exclusivity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exclusivity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                  <SelectItem value="non_exclusive">Non-Exclusive</SelectItem>
                  <SelectItem value="semi_exclusive">Semi-Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Share & Royalties</CardTitle>
          <CardDescription>
            Define how revenue will be split between artist and distributor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Artist Revenue Share (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.artist_revenue_share || ""}
                onChange={(e) => updateData('artist_revenue_share', e.target.value)}
                placeholder="e.g., 80"
              />
            </div>

            <div className="space-y-2">
              <Label>Label/Distributor Share (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.label_revenue_share || ""}
                onChange={(e) => updateData('label_revenue_share', e.target.value)}
                placeholder="e.g., 20"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Revenue Type Splits</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Digital Sales Share (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.digital_sales_share || ""}
                  onChange={(e) => updateData('digital_sales_share', e.target.value)}
                  placeholder="e.g., 85"
                />
              </div>

              <div className="space-y-2">
                <Label>Streaming Share (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.streaming_share || ""}
                  onChange={(e) => updateData('streaming_share', e.target.value)}
                  placeholder="e.g., 80"
                />
              </div>

              <div className="space-y-2">
                <Label>Physical Sales Share (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.physical_sales_share || ""}
                  onChange={(e) => updateData('physical_sales_share', e.target.value)}
                  placeholder="e.g., 70"
                />
              </div>

              <div className="space-y-2">
                <Label>Sync Licensing Share (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.sync_licensing_share || ""}
                  onChange={(e) => updateData('sync_licensing_share', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advances & Deductibles</CardTitle>
          <CardDescription>
            Financial advances and deductible expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marketing Advance ($)</Label>
              <Input
                type="number"
                value={data.marketing_advance || ""}
                onChange={(e) => updateData('marketing_advance', e.target.value)}
                placeholder="e.g., 25000"
              />
            </div>

            <div className="space-y-2">
              <Label>Recording Advance ($)</Label>
              <Input
                type="number"
                value={data.recording_advance || ""}
                onChange={(e) => updateData('recording_advance', e.target.value)}
                placeholder="e.g., 50000"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tour Support ($)</Label>
              <Input
                type="number"
                value={data.tour_support || ""}
                onChange={(e) => updateData('tour_support', e.target.value)}
                placeholder="e.g., 15000"
              />
            </div>

            <div className="space-y-2">
              <Label>Video Budget ($)</Label>
              <Input
                type="number"
                value={data.video_budget || ""}
                onChange={(e) => updateData('video_budget', e.target.value)}
                placeholder="e.g., 10000"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Deductible Options</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cross-Collateralization</Label>
                  <p className="text-sm text-muted-foreground">Apply across multiple releases</p>
                </div>
                <Switch
                  checked={data.cross_collateralization || false}
                  onCheckedChange={(checked) => updateData('cross_collateralization', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Deductible</Label>
                  <p className="text-sm text-muted-foreground">Deduct marketing from royalties</p>
                </div>
                <Switch
                  checked={data.marketing_deductible || false}
                  onCheckedChange={(checked) => updateData('marketing_deductible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Video Deductible</Label>
                  <p className="text-sm text-muted-foreground">Deduct video costs from royalties</p>
                </div>
                <Switch
                  checked={data.video_deductible || false}
                  onCheckedChange={(checked) => updateData('video_deductible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tour Support Deductible</Label>
                  <p className="text-sm text-muted-foreground">Recoup tour support from royalties</p>
                </div>
                <Switch
                  checked={data.tour_support_deductible || false}
                  onCheckedChange={(checked) => updateData('tour_support_deductible', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}