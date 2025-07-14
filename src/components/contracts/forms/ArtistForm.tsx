import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface ArtistFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function ArtistForm({ data, onChange }: ArtistFormProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Artist Agreement Details</CardTitle>
          <CardDescription>
            Configure the artist agreement type and deal structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deal Type</Label>
              <Select 
                value={data.deal_type} 
                onValueChange={(value) => updateData('deal_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indie">Independent</SelectItem>
                  <SelectItem value="label">Label Deal</SelectItem>
                  <SelectItem value="360">360 Deal</SelectItem>
                  <SelectItem value="distribution_only">Distribution Only</SelectItem>
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
              <Label>Number of Albums</Label>
              <Input
                type="number"
                value={data.album_commitment || ""}
                onChange={(e) => updateData('album_commitment', e.target.value)}
                placeholder="e.g., 3"
              />
            </div>

            <div className="space-y-2">
              <Label>Contract Term (Years)</Label>
              <Input
                type="number"
                value={data.contract_term || ""}
                onChange={(e) => updateData('contract_term', e.target.value)}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label>Option Periods</Label>
              <Input
                type="number"
                value={data.option_periods || ""}
                onChange={(e) => updateData('option_periods', e.target.value)}
                placeholder="e.g., 2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Terms</CardTitle>
          <CardDescription>
            Advance, royalty rates, and revenue sharing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recording Advance ($)</Label>
              <Input
                type="number"
                value={data.recording_advance || ""}
                onChange={(e) => updateData('recording_advance', e.target.value)}
                placeholder="e.g., 100000"
              />
            </div>

            <div className="space-y-2">
              <Label>Marketing Advance ($)</Label>
              <Input
                type="number"
                value={data.marketing_advance || ""}
                onChange={(e) => updateData('marketing_advance', e.target.value)}
                placeholder="e.g., 50000"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Artist Royalty Rate (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.artist_royalty_rate || ""}
                onChange={(e) => updateData('artist_royalty_rate', e.target.value)}
                placeholder="e.g., 15"
              />
            </div>

            <div className="space-y-2">
              <Label>Net Receipts (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.net_receipts_percentage || ""}
                onChange={(e) => updateData('net_receipts_percentage', e.target.value)}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label>Producer Royalty (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.producer_royalty || ""}
                onChange={(e) => updateData('producer_royalty', e.target.value)}
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Additional Revenue Streams</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Merchandise Revenue</Label>
                  <p className="text-sm text-muted-foreground">Include merch in revenue split</p>
                </div>
                <Switch
                  checked={data.includes_merchandise || false}
                  onCheckedChange={(checked) => updateData('includes_merchandise', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Revenue</Label>
                  <p className="text-sm text-muted-foreground">Include sync licensing</p>
                </div>
                <Switch
                  checked={data.includes_sync || false}
                  onCheckedChange={(checked) => updateData('includes_sync', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Live Performance</Label>
                  <p className="text-sm text-muted-foreground">Include touring revenue</p>
                </div>
                <Switch
                  checked={data.includes_live || false}
                  onCheckedChange={(checked) => updateData('includes_live', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publishing</Label>
                  <p className="text-sm text-muted-foreground">Include publishing revenue</p>
                </div>
                <Switch
                  checked={data.includes_publishing || false}
                  onCheckedChange={(checked) => updateData('includes_publishing', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}