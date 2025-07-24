import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  TERRITORIES, 
  getCMOsByTerritory, 
  REGISTRATION_STATUS_OPTIONS, 
  CMORegistration,
  CMO 
} from '@/data/cmo-territories';

interface ProRegistrationSectionProps {
  registrations: CMORegistration[];
  onRegistrationsChange: (registrations: CMORegistration[]) => void;
}

export const ProRegistrationSection: React.FC<ProRegistrationSectionProps> = ({
  registrations,
  onRegistrationsChange
}) => {
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [availableCMOs, setAvailableCMOs] = useState<CMO[]>([]);
  const [selectedCMOs, setSelectedCMOs] = useState<string[]>([]);

  const handleTerritoryChange = (territory: string) => {
    setSelectedTerritory(territory);
    const cmos = getCMOsByTerritory(territory);
    setAvailableCMOs(cmos);
    setSelectedCMOs([]);
  };

  const handleCMOSelection = (cmoId: string, checked: boolean) => {
    if (checked) {
      setSelectedCMOs(prev => [...prev, cmoId]);
    } else {
      setSelectedCMOs(prev => prev.filter(id => id !== cmoId));
      // Also remove any existing registrations for this CMO
      const updatedRegistrations = registrations.filter(reg => reg.cmoId !== cmoId);
      onRegistrationsChange(updatedRegistrations);
    }
  };

  const addSelectedCMOs = () => {
    const newRegistrations: CMORegistration[] = selectedCMOs
      .filter(cmoId => !registrations.some(reg => reg.cmoId === cmoId))
      .map(cmoId => {
        const cmo = availableCMOs.find(c => c.id === cmoId);
        return {
          id: `${cmoId}-${Date.now()}`,
          cmoId,
          cmoName: cmo?.name || '',
          territory: selectedTerritory,
          workNumber: '',
          registrationStatus: 'not_registered' as const
        };
      });

    onRegistrationsChange([...registrations, ...newRegistrations]);
    setSelectedCMOs([]);
    setSelectedTerritory('');
    setAvailableCMOs([]);
  };

  const updateRegistration = (id: string, field: keyof CMORegistration, value: string) => {
    const updatedRegistrations = registrations.map(reg =>
      reg.id === id ? { ...reg, [field]: value } : reg
    );
    onRegistrationsChange(updatedRegistrations);
  };

  const removeRegistration = (id: string) => {
    const updatedRegistrations = registrations.filter(reg => reg.id !== id);
    onRegistrationsChange(updatedRegistrations);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'needs_amendment': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <X className="h-4 w-4 text-red-600" />;
      case 'needs_amendment': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <CardContent className="space-y-6">
      {/* Add New CMO Registrations */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Label className="text-sm font-medium">Add CMO Registrations</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="territory-select">Select Territory</Label>
            <Select
              value={selectedTerritory}
              onValueChange={handleTerritoryChange}
            >
              <SelectTrigger id="territory-select">
                <SelectValue placeholder="Choose territory..." />
              </SelectTrigger>
              <SelectContent>
                {TERRITORIES.map(territory => (
                  <SelectItem key={territory} value={territory}>
                    {territory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableCMOs.length > 0 && (
            <div className="space-y-2">
              <Label>Available CMOs</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 p-2 border rounded">
                {availableCMOs.map(cmo => (
                  <div key={cmo.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={cmo.id}
                      checked={selectedCMOs.includes(cmo.id)}
                      onCheckedChange={(checked) => 
                        handleCMOSelection(cmo.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={cmo.id} className="text-sm cursor-pointer">
                      {cmo.name}
                      {cmo.type && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {cmo.type}
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedCMOs.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {selectedCMOs.map(cmoId => {
                const cmo = availableCMOs.find(c => c.id === cmoId);
                return (
                  <Badge key={cmoId} variant="secondary">
                    {cmo?.name}
                  </Badge>
                );
              })}
            </div>
            <Button 
              onClick={addSelectedCMOs}
              size="sm"
              className="ml-2"
            >
              Add Selected CMOs
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Existing Registrations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <Label className="text-sm font-medium">
            CMO Registrations ({registrations.length})
          </Label>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No CMO registrations added yet.</p>
            <p className="text-sm">Select a territory above to add registrations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div key={registration.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{registration.territory}</Badge>
                    <span className="font-medium">{registration.cmoName}</span>
                    {getStatusIcon(registration.registrationStatus)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRegistration(registration.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`work-number-${registration.id}`}>Work Number</Label>
                    <Input
                      id={`work-number-${registration.id}`}
                      value={registration.workNumber}
                      onChange={(e) => updateRegistration(registration.id, 'workNumber', e.target.value)}
                      placeholder="Enter work/catalog number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`status-${registration.id}`}>Registration Status</Label>
                    <Select
                      value={registration.registrationStatus}
                      onValueChange={(value) => 
                        updateRegistration(registration.id, 'registrationStatus', value)
                      }
                    >
                      <SelectTrigger id={`status-${registration.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTRATION_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className={`w-2 h-2 rounded-full ${getStatusColor(option.value)}`}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  );
};
