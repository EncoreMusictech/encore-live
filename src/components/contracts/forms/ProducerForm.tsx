import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface ProducerFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function ProducerForm({ data, onChange }: ProducerFormProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Producer Agreement Details</CardTitle>
          <CardDescription>
            Configure the producer agreement type and compensation structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Producer Deal Type</Label>
              <Select 
                value={data.producer_type} 
                onValueChange={(value) => updateData('producer_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select producer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                  <SelectItem value="points">Points Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Fee + Points)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Tracks</Label>
              <Input
                type="number"
                value={data.track_count || ""}
                onChange={(e) => updateData('track_count', e.target.value)}
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Upfront Fee ($)</Label>
              <Input
                type="number"
                value={data.upfront_fee || ""}
                onChange={(e) => updateData('upfront_fee', e.target.value)}
                placeholder="e.g., 25000"
              />
            </div>

            <div className="space-y-2">
              <Label>Producer Points (%)</Label>
              <Input
                type="number"
                max="100"
                step="0.1"
                value={data.producer_points || ""}
                onChange={(e) => updateData('producer_points', e.target.value)}
                placeholder="e.g., 3.5"
              />
            </div>

            <div className="space-y-2">
              <Label>Royalty Base</Label>
              <Select 
                value={data.royalty_base} 
                onValueChange={(value) => updateData('royalty_base', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_receipts">Net Receipts</SelectItem>
                  <SelectItem value="gross_receipts">Gross Receipts</SelectItem>
                  <SelectItem value="artist_royalty">Artist Royalty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rights & Credits</CardTitle>
          <CardDescription>
            Producer credits, rights, and additional terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Producer Credit</Label>
              <Input
                value={data.producer_credit || ""}
                onChange={(e) => updateData('producer_credit', e.target.value)}
                placeholder="e.g., Produced by [Name]"
              />
            </div>

            <div className="space-y-2">
              <Label>Credit Size</Label>
              <Select 
                value={data.credit_size} 
                onValueChange={(value) => updateData('credit_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prominent">Prominent</SelectItem>
                  <SelectItem value="equal">Equal to Artist</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Additional Rights</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Remix Rights</Label>
                  <p className="text-sm text-muted-foreground">Right to create remixes</p>
                </div>
                <Switch
                  checked={data.remix_rights || false}
                  onCheckedChange={(checked) => updateData('remix_rights', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sample Clearance</Label>
                  <p className="text-sm text-muted-foreground">Producer handles sample clearance</p>
                </div>
                <Switch
                  checked={data.sample_clearance || false}
                  onCheckedChange={(checked) => updateData('sample_clearance', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publishing Share</Label>
                  <p className="text-sm text-muted-foreground">Producer receives publishing</p>
                </div>
                <Switch
                  checked={data.publishing_share || false}
                  onCheckedChange={(checked) => updateData('publishing_share', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exclusive Production</Label>
                  <p className="text-sm text-muted-foreground">Exclusive to this project</p>
                </div>
                <Switch
                  checked={data.exclusive_production || false}
                  onCheckedChange={(checked) => updateData('exclusive_production', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Payment Schedule</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Upon Signing (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.payment_on_signing || ""}
                  onChange={(e) => updateData('payment_on_signing', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label>Upon Delivery (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.payment_on_delivery || ""}
                  onChange={(e) => updateData('payment_on_delivery', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label>Upon Release (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.payment_on_release || ""}
                  onChange={(e) => updateData('payment_on_release', e.target.value)}
                  placeholder="e.g., 0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}