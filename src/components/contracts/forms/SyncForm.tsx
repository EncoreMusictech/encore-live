import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface SyncFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function SyncForm({ data, onChange }: SyncFormProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleMediaUsageChange = (mediaType: string, checked: boolean) => {
    const currentUsage = data.media_usage || [];
    if (checked) {
      updateData('media_usage', [...currentUsage, mediaType]);
    } else {
      updateData('media_usage', currentUsage.filter((type: string) => type !== mediaType));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync License Details</CardTitle>
          <CardDescription>
            Configure the synchronization license type and usage terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>License Type</Label>
              <Select 
                value={data.sync_type} 
                onValueChange={(value) => updateData('sync_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time Usage</SelectItem>
                  <SelectItem value="mfn">Most Favored Nations</SelectItem>
                  <SelectItem value="perpetual">Perpetual</SelectItem>
                  <SelectItem value="term_limited">Term Limited</SelectItem>
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
              <Label>License Fee ($)</Label>
              <Input
                type="number"
                value={data.license_fee || ""}
                onChange={(e) => updateData('license_fee', e.target.value)}
                placeholder="e.g., 5000"
              />
            </div>

            <div className="space-y-2">
              <Label>Term (Years)</Label>
              <Input
                type="number"
                value={data.term_years || ""}
                onChange={(e) => updateData('term_years', e.target.value)}
                placeholder="e.g., 10"
              />
            </div>

            <div className="space-y-2">
              <Label>Usage Duration</Label>
              <Input
                value={data.usage_duration || ""}
                onChange={(e) => updateData('usage_duration', e.target.value)}
                placeholder="e.g., 30 seconds"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Production Title</Label>
              <Input
                value={data.production_title || ""}
                onChange={(e) => updateData('production_title', e.target.value)}
                placeholder="e.g., Movie/Show Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Production Company</Label>
              <Input
                value={data.production_company || ""}
                onChange={(e) => updateData('production_company', e.target.value)}
                placeholder="e.g., Studio Name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Usage Rights</CardTitle>
          <CardDescription>
            Select the types of media where the music can be used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 'tv', label: 'Television' },
              { id: 'film', label: 'Motion Pictures' },
              { id: 'web', label: 'Web/Streaming' },
              { id: 'ads', label: 'Advertisements' },
              { id: 'games', label: 'Video Games' },
              { id: 'social', label: 'Social Media' },
              { id: 'radio', label: 'Radio' },
              { id: 'podcast', label: 'Podcasts' }
            ].map((mediaType) => (
              <div key={mediaType.id} className="flex items-center space-x-2">
                <Checkbox
                  id={mediaType.id}
                  checked={(data.media_usage || []).includes(mediaType.id)}
                  onCheckedChange={(checked) => handleMediaUsageChange(mediaType.id, checked as boolean)}
                />
                <Label htmlFor={mediaType.id}>{mediaType.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rights Covered</CardTitle>
          <CardDescription>
            Specify which rights are included in this sync license
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Master Recording Rights</Label>
                <p className="text-sm text-muted-foreground">Include master recording</p>
              </div>
              <Switch
                checked={data.includes_master || false}
                onCheckedChange={(checked) => updateData('includes_master', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publishing Rights</Label>
                <p className="text-sm text-muted-foreground">Include publishing/composition</p>
              </div>
              <Switch
                checked={data.includes_publishing || false}
                onCheckedChange={(checked) => updateData('includes_publishing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exclusive Usage</Label>
                <p className="text-sm text-muted-foreground">Exclusive to this production</p>
              </div>
              <Switch
                checked={data.exclusive_usage || false}
                onCheckedChange={(checked) => updateData('exclusive_usage', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Promotional Usage</Label>
                <p className="text-sm text-muted-foreground">Allow in promotional materials</p>
              </div>
              <Switch
                checked={data.promotional_usage || false}
                onCheckedChange={(checked) => updateData('promotional_usage', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Additional Fees</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Re-use Fee ($)</Label>
                <Input
                  type="number"
                  value={data.reuse_fee || ""}
                  onChange={(e) => updateData('reuse_fee', e.target.value)}
                  placeholder="e.g., 2500"
                />
              </div>

              <div className="space-y-2">
                <Label>Festival Usage Fee ($)</Label>
                <Input
                  type="number"
                  value={data.festival_fee || ""}
                  onChange={(e) => updateData('festival_fee', e.target.value)}
                  placeholder="e.g., 1000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}