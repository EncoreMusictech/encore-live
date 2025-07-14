import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building } from 'lucide-react';
import { CopyrightPublisher } from '@/hooks/useCopyright';

interface PublishersSectionProps {
  copyrightId?: string;
  publishers: CopyrightPublisher[];
  onPublishersChange: (publishers: CopyrightPublisher[]) => void;
}

interface PublisherFormData {
  publisher_name: string;
  ipi_number: string;
  publisher_role: string;
  pro_affiliation: string;
  territory: string;
  ownership_percentage: number;
}

export const PublishersSection: React.FC<PublishersSectionProps> = ({
  copyrightId,
  publishers,
  onPublishersChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PublisherFormData>({
    publisher_name: '',
    ipi_number: '',
    publisher_role: 'original_publisher',
    pro_affiliation: '',
    territory: '',
    ownership_percentage: 0
  });

  const publisherRoles = [
    { value: 'original_publisher', label: 'Original Publisher' },
    { value: 'sub_publisher', label: 'Sub-Publisher' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'collecting_society', label: 'Collecting Society' }
  ];

  const commonPROs = [
    'ASCAP', 'BMI', 'SESAC', 'PRS', 'GEMA', 'SACEM', 'SOCAN', 'APRA'
  ];

  const territories = [
    'US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'BR', 'MX', 'ES', 'IT', 'NL'
  ];

  const addPublisher = () => {
    if (!formData.publisher_name) return;
    
    const newPublisher: CopyrightPublisher = {
      id: `temp-${Date.now()}`,
      copyright_id: copyrightId || '',
      publisher_name: formData.publisher_name,
      ipi_number: formData.ipi_number || null,
      cae_number: null,
      isni: null,
      publisher_role: formData.publisher_role,
      pro_affiliation: formData.pro_affiliation || null,
      territory: formData.territory || null,
      ownership_percentage: formData.ownership_percentage,
      mechanical_share: 0,
      performance_share: 0,
      synchronization_share: 0,
      agreement_type: null,
      agreement_start_date: null,
      agreement_end_date: null,
      created_at: new Date().toISOString()
    };

    onPublishersChange([...publishers, newPublisher]);
    setFormData({
      publisher_name: '',
      ipi_number: '',
      publisher_role: 'original_publisher',
      pro_affiliation: '',
      territory: '',
      ownership_percentage: 0
    });
    setShowForm(false);
  };

  const removePublisher = (publisherId: string) => {
    onPublishersChange(publishers.filter(p => p.id !== publisherId));
  };

  const totalOwnership = publishers.reduce((sum, publisher) => sum + publisher.ownership_percentage, 0);
  const isOwnershipValid = totalOwnership <= 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Publishers
            <Badge variant={publishers.length > 0 ? "default" : "secondary"}>
              {publishers.length} publisher{publishers.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Publisher
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publisher_name">Publisher Name *</Label>
                <Input
                  id="publisher_name"
                  value={formData.publisher_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, publisher_name: e.target.value }))}
                  placeholder="Music Publishing Co."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publisher_ipi">IPI Number</Label>
                <Input
                  id="publisher_ipi"
                  value={formData.ipi_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipi_number: e.target.value }))}
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Publisher Role</Label>
                <Select
                  value={formData.publisher_role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, publisher_role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {publisherRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>PRO Affiliation</Label>
                <Select
                  value={formData.pro_affiliation}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pro_affiliation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PRO" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonPROs.map(pro => (
                      <SelectItem key={pro} value={pro}>
                        {pro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Territory</Label>
                <Select
                  value={formData.territory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, territory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {territories.map(territory => (
                      <SelectItem key={territory} value={territory}>
                        {territory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher_ownership">Ownership %</Label>
                <Input
                  id="publisher_ownership"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.ownership_percentage}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    ownership_percentage: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={addPublisher} disabled={!formData.publisher_name}>
                Add Publisher
              </Button>
            </div>
          </div>
        )}

        {publishers.length > 0 && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>PRO</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>IPI</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishers.map((publisher) => (
                  <TableRow key={publisher.id}>
                    <TableCell className="font-medium">{publisher.publisher_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {publisherRoles.find(r => r.value === publisher.publisher_role)?.label || publisher.publisher_role}
                      </Badge>
                    </TableCell>
                    <TableCell>{publisher.pro_affiliation || '-'}</TableCell>
                    <TableCell>{publisher.territory || '-'}</TableCell>
                    <TableCell>{publisher.ipi_number || '-'}</TableCell>
                    <TableCell>{publisher.ownership_percentage}%</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePublisher(publisher.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Publisher Ownership:</span>
              <div className="flex items-center gap-2">
                <Badge variant={isOwnershipValid ? "default" : "destructive"}>
                  {totalOwnership.toFixed(2)}%
                </Badge>
                {!isOwnershipValid && (
                  <span className="text-sm text-destructive">
                    Ownership cannot exceed 100%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {publishers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No publishers added yet</p>
            <p className="text-sm">Publishers are optional but recommended</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};