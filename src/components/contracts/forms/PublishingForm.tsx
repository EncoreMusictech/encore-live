import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface PublishingFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function PublishingForm({ data, onChange }: PublishingFormProps) {
  const updateData = (field: string, value: any) => {
    const updatedData = { ...data, [field]: value };
    
    // Auto-calculate commission percentage based on royalty splits
    if (['writer_share', 'publisher_share', 'mechanical_rate', 'performance_rate', 'sync_rate'].includes(field)) {
      const writerShare = field === 'writer_share' ? parseFloat(value) || 0 : parseFloat(updatedData.writer_share) || 0;
      const publisherShare = field === 'publisher_share' ? parseFloat(value) || 0 : parseFloat(updatedData.publisher_share) || 0;
      
      // Calculate commission as the percentage the publisher takes from the split
      // This represents the administrative/commission fee from the total revenue
      const commissionPercentage = publisherShare > 0 ? publisherShare : 0;
      
      updatedData.commission_percentage = commissionPercentage;
    }
    
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publishing Agreement Details</CardTitle>
          <CardDescription>
            Configure the publishing agreement type, territory, and ownership details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Publishing Type</Label>
              <Select 
                value={data.publishing_type} 
                onValueChange={(value) => updateData('publishing_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select publishing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="copub">Co-Publishing</SelectItem>
                  <SelectItem value="full_pub">Full Publishing</SelectItem>
                  <SelectItem value="jv">Joint Venture</SelectItem>
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
              <Label>Duration (Years)</Label>
              <Input
                type="number"
                value={data.duration || ""}
                onChange={(e) => updateData('duration', e.target.value)}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label>Ownership %</Label>
              <Input
                type="number"
                max="100"
                value={data.ownership_percentage || ""}
                onChange={(e) => updateData('ownership_percentage', e.target.value)}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label>PRO Affiliation</Label>
              <Select 
                value={data.pro_affiliation} 
                onValueChange={(value) => updateData('pro_affiliation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PRO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ascap">ASCAP</SelectItem>
                  <SelectItem value="bmi">BMI</SelectItem>
                  <SelectItem value="sesac">SESAC</SelectItem>
                  <SelectItem value="prs">PRS for Music</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Royalty Splits</CardTitle>
          <CardDescription>
            Define how royalties will be split between parties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Writer Share (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.writer_share || ""}
                onChange={(e) => updateData('writer_share', e.target.value)}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label>Publisher Share (%)</Label>
              <Input
                type="number"
                max="100"
                value={data.publisher_share || ""}
                onChange={(e) => updateData('publisher_share', e.target.value)}
                placeholder="e.g., 50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Commission (%)</Label>
            <Input
              type="number"
              max="100"
              value={data.commission_percentage || ""}
              readOnly
              className="bg-muted"
              placeholder="Auto-calculated from publisher share"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated from publisher share: {data.publisher_share || 0}%
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Royalty Types</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mechanical Rate (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.mechanical_rate || ""}
                  onChange={(e) => updateData('mechanical_rate', e.target.value)}
                  placeholder="e.g., 9.1"
                />
              </div>

              <div className="space-y-2">
                <Label>Performance Rate (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.performance_rate || ""}
                  onChange={(e) => updateData('performance_rate', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label>Sync Rate (%)</Label>
                <Input
                  type="number"
                  max="100"
                  value={data.sync_rate || ""}
                  onChange={(e) => updateData('sync_rate', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}