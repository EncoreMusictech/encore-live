import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CopyrightInsert, useCopyright } from '@/hooks/useCopyright';
import { WritersSection } from './WritersSection';
import { PublishersSection } from './PublishersSection';
import { RecordingsSection } from './RecordingsSection';
import { ValidationChecklist } from './ValidationChecklist';
import { COPYRIGHT_FIELD_MAPPINGS } from '@/lib/copyright-field-mappings';

interface CopyrightFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CopyrightForm: React.FC<CopyrightFormProps> = ({ onSuccess, onCancel }) => {
  const { createCopyright } = useCopyright();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CopyrightInsert>>({
    work_title: '',
    work_type: 'original',
    language_code: 'EN',
    registration_type: 'new',
    status: 'draft',
    supports_ddex: true,
    supports_cwr: true,
    collection_territories: [],
    rights_types: []
  });
  
  const [creationDate, setCreationDate] = useState<Date>();
  const [territories, setTerritories] = useState<string[]>([]);
  const [rightsTypes, setRightsTypes] = useState<string[]>([]);
  const [newTerritory, setNewTerritory] = useState('');
  const [newRightType, setNewRightType] = useState('');

  const workTypes = [
    { value: 'original', label: 'Original Work' },
    { value: 'arrangement', label: 'Arrangement' },
    { value: 'adaptation', label: 'Adaptation' },
    { value: 'translation', label: 'Translation' },
    { value: 'compilation', label: 'Compilation' }
  ];

  const registrationTypes = [
    { value: 'new', label: 'New Registration' },
    { value: 'amendment', label: 'Amendment' },
    { value: 're_registration', label: 'Re-Registration' }
  ];

  const languageCodes = [
    { value: 'EN', label: 'English' },
    { value: 'ES', label: 'Spanish' },
    { value: 'FR', label: 'French' },
    { value: 'DE', label: 'German' },
    { value: 'IT', label: 'Italian' },
    { value: 'PT', label: 'Portuguese' },
    { value: 'JA', label: 'Japanese' },
    { value: 'KO', label: 'Korean' },
    { value: 'ZH', label: 'Chinese' }
  ];

  const commonTerritories = ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'BR', 'MX', 'ES'];
  const commonRights = ['MECHANICAL', 'PERFORMANCE', 'SYNCHRONIZATION', 'PRINT', 'DIGITAL'];

  const addTerritory = () => {
    if (newTerritory && !territories.includes(newTerritory)) {
      const updated = [...territories, newTerritory];
      setTerritories(updated);
      setFormData(prev => ({ ...prev, collection_territories: updated }));
      setNewTerritory('');
    }
  };

  const removeTerritory = (territory: string) => {
    const updated = territories.filter(t => t !== territory);
    setTerritories(updated);
    setFormData(prev => ({ ...prev, collection_territories: updated }));
  };

  const addRightType = () => {
    if (newRightType && !rightsTypes.includes(newRightType)) {
      const updated = [...rightsTypes, newRightType];
      setRightsTypes(updated);
      setFormData(prev => ({ ...prev, rights_types: updated }));
      setNewRightType('');
    }
  };

  const removeRightType = (rightType: string) => {
    const updated = rightsTypes.filter(r => r !== rightType);
    setRightsTypes(updated);
    setFormData(prev => ({ ...prev, rights_types: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.work_title) return;

    setLoading(true);
    try {
      await createCopyright({
        ...formData,
        creation_date: creationDate?.toISOString().split('T')[0],
        collection_territories: territories,
        rights_types: rightsTypes
      } as CopyrightInsert);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating copyright:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.work_title && formData.work_title.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Work Information
            <Badge variant="outline" className="text-xs">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_title">Work Title *</Label>
              <Input
                id="work_title"
                value={formData.work_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, work_title: e.target.value }))}
                placeholder="Enter work title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="iswc">ISWC</Label>
              <Input
                id="iswc"
                value={formData.iswc || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, iswc: e.target.value }))}
                placeholder="T-123456789-C"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Work Type</Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, work_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Registration Type</Label>
              <Select
                value={formData.registration_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, registration_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {registrationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={formData.language_code}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageCodes.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Creation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !creationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {creationDate ? format(creationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={creationDate}
                    onSelect={setCreationDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_seconds || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration_seconds: parseInt(e.target.value) || undefined 
                }))}
                placeholder="240"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classification">Work Classification</Label>
              <Input
                id="classification"
                value={formData.work_classification || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, work_classification: e.target.value }))}
                placeholder="Popular Music, Classical, Jazz, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalogue_number">Catalogue Number</Label>
              <Input
                id="catalogue_number"
                value={formData.catalogue_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, catalogue_number: e.target.value }))}
                placeholder="CAT-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opus_number">Opus Number</Label>
              <Input
                id="opus_number"
                value={formData.opus_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, opus_number: e.target.value }))}
                placeholder="Op. 27"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Territories Section */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Territories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={newTerritory} onValueChange={setNewTerritory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                {commonTerritories.map(territory => (
                  <SelectItem key={territory} value={territory}>
                    {territory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={addTerritory}
              disabled={!newTerritory || territories.includes(newTerritory)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {territories.map(territory => (
              <Badge key={territory} variant="secondary" className="flex items-center gap-1">
                {territory}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTerritory(territory)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rights Types Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rights Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={newRightType} onValueChange={setNewRightType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select right" />
              </SelectTrigger>
              <SelectContent>
                {commonRights.map(right => (
                  <SelectItem key={right} value={right}>
                    {right}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={addRightType}
              disabled={!newRightType || rightsTypes.includes(newRightType)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {rightsTypes.map(rightType => (
              <Badge key={rightType} variant="secondary" className="flex items-center gap-1">
                {rightType}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeRightType(rightType)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Format Support */}
      <Card>
        <CardHeader>
          <CardTitle>Export Format Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ddex">DDEX Support</Label>
              <p className="text-sm text-muted-foreground">Enable DDEX XML export formats</p>
            </div>
            <Switch
              id="ddex"
              checked={formData.supports_ddex}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, supports_ddex: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cwr">CWR Support</Label>
              <p className="text-sm text-muted-foreground">Enable CWR flat file export</p>
            </div>
            <Switch
              id="cwr"
              checked={formData.supports_cwr}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, supports_cwr: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes or comments..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Validation Checklist */}
      <ValidationChecklist isFormValid={isFormValid} />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={!isFormValid || loading}
          className="bg-gradient-primary"
        >
          {loading ? "Creating..." : "Register Copyright"}
        </Button>
      </div>
    </form>
  );
};