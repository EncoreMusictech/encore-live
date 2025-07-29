import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Plus, 
  X, 
  Globe,
  Building,
  Users,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TERRITORIES as CMO_TERRITORIES } from '@/data/cmo-territories';

interface TerritoryRule {
  territory: string;
  cmo: string;
  inclusion: 'include' | 'exclude';
  ownershipPercentage?: number;
  notes?: string;
}

interface TerritoryManagementProps {
  territories: string[];
  onChange: (territories: string[]) => void;
  onRulesChange?: (rules: TerritoryRule[]) => void;
  showAdvanced?: boolean;
}

export const TerritoryManagement: React.FC<TerritoryManagementProps> = ({
  territories,
  onChange,
  onRulesChange,
  showAdvanced = false
}) => {
  const [territoryRules, setTerritoryRules] = useState<TerritoryRule[]>([]);
  const [newTerritory, setNewTerritory] = useState('');
  const [selectedCMO, setSelectedCMO] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get available territories from CMO data
  const availableTerritories = CMO_TERRITORIES;

  // Filter territories based on search
  const filteredTerritories = availableTerritories.filter(territory =>
    territory.territory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    territory.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    territory.cmos.some(cmo => cmo.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get CMOs for selected territory
  const getCMOsForTerritory = (territoryCode: string) => {
    const territory = availableTerritories.find(t => t.territory === territoryCode);
    return territory?.cmos || [];
  };

  const addTerritory = () => {
    if (newTerritory && !territories.includes(newTerritory)) {
      const updated = [...territories, newTerritory];
      onChange(updated);

      // Add default rule if advanced mode is enabled
      if (showAdvanced) {
        const cmos = getCMOsForTerritory(newTerritory);
        const newRule: TerritoryRule = {
          territory: newTerritory,
          cmo: cmos[0]?.name || '',
          inclusion: 'include',
          ownershipPercentage: 100
        };
        const updatedRules = [...territoryRules, newRule];
        setTerritoryRules(updatedRules);
        onRulesChange?.(updatedRules);
      }

      setNewTerritory('');
      setSelectedCMO('');
    }
  };

  const removeTerritory = (territory: string) => {
    const updated = territories.filter(t => t !== territory);
    onChange(updated);

    if (showAdvanced) {
      const updatedRules = territoryRules.filter(rule => rule.territory !== territory);
      setTerritoryRules(updatedRules);
      onRulesChange?.(updatedRules);
    }
  };

  const updateTerritoryRule = (territory: string, updates: Partial<TerritoryRule>) => {
    const updatedRules = territoryRules.map(rule =>
      rule.territory === territory ? { ...rule, ...updates } : rule
    );
    setTerritoryRules(updatedRules);
    onRulesChange?.(updatedRules);
  };

  const addWorldwideRights = () => {
    const worldwide = ['WW']; // Worldwide territory code
    onChange(worldwide);
    
    if (showAdvanced) {
      const worldwideRule: TerritoryRule = {
        territory: 'WW',
        cmo: 'ALL',
        inclusion: 'include',
        ownershipPercentage: 100,
        notes: 'Worldwide rights'
      };
      setTerritoryRules([worldwideRule]);
      onRulesChange?.([worldwideRule]);
    }
  };

  const getTerritoryInfo = (territoryCode: string) => {
    return availableTerritories.find(t => t.territory === territoryCode);
  };

  const getTotalCoverage = () => {
    if (territories.includes('WW')) return 100;
    
    // Calculate approximate coverage based on selected territories
    const coverage = territories.reduce((total, territory) => {
      const info = getTerritoryInfo(territory);
      // Rough population-based weighting (simplified)
      const weights: Record<string, number> = {
        'US': 25, 'CA': 3, 'GB': 5, 'DE': 6, 'FR': 5, 'AU': 2, 'JP': 10,
        'BR': 8, 'MX': 4, 'ES': 3, 'IT': 4, 'NL': 1, 'SE': 1, 'NO': 1
      };
      return total + (weights[territory] || 1);
    }, 0);
    
    return Math.min(coverage, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Territory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showAdvanced ? (
          // Simple Territory Selection
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search territories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={addWorldwideRights} variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Worldwide
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredTerritories.slice(0, 50).map(territory => (
                <Button
                  key={territory.territory}
                  variant={territories.includes(territory.territory) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (territories.includes(territory.territory)) {
                      removeTerritory(territory.territory);
                    } else {
                      setNewTerritory(territory.territory);
                      addTerritory();
                    }
                  }}
                  className="justify-start text-left"
                >
                  <span className="font-mono text-xs mr-2">{territory.territory}</span>
                  {territory.country}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {territories.map(territory => {
                const info = getTerritoryInfo(territory);
                return (
                  <Badge key={territory} variant="secondary" className="flex items-center gap-1">
                    <span className="font-mono">{territory}</span>
                    {info && <span>{info.country}</span>}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTerritory(territory)}
                    />
                  </Badge>
                );
              })}
            </div>

            {/* Coverage Summary */}
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Territory Coverage:</strong> {getTotalCoverage()}% of global music market
                {territories.length > 0 && (
                  <span className="ml-2">
                    ({territories.length} {territories.length === 1 ? 'territory' : 'territories'} selected)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Advanced Territory Rules
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selection">Territory Selection</TabsTrigger>
              <TabsTrigger value="rules">CMO Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="selection" className="space-y-4">
              <div className="flex gap-2">
                <Select value={newTerritory} onValueChange={setNewTerritory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerritories.map(territory => (
                      <SelectItem key={territory.territory} value={territory.territory}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{territory.territory}</span>
                          <span>{territory.country}</span>
                          <Badge variant="outline" className="text-xs">
                            {territory.cmos.length} CMO{territory.cmos.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addTerritory}
                  disabled={!newTerritory || territories.includes(newTerritory)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {territories.map(territory => {
                  const info = getTerritoryInfo(territory);
                  const rule = territoryRules.find(r => r.territory === territory);
                  return (
                    <div key={territory} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {territory}
                        </Badge>
                        <div>
                          <div className="font-medium">{info?.country || territory}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule?.cmo && `CMO: ${rule.cmo}`}
                            {rule?.ownershipPercentage && ` • ${rule.ownershipPercentage}% ownership`}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTerritory(territory)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              {territoryRules.length > 0 ? (
                <div className="space-y-4">
                  {territoryRules.map(rule => {
                    const cmos = getCMOsForTerritory(rule.territory);
                    const info = getTerritoryInfo(rule.territory);
                    
                    return (
                      <div key={rule.territory} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {rule.territory}
                          </Badge>
                          <span className="font-medium">{info?.country}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Collection Society (CMO)</Label>
                            <Select
                              value={rule.cmo}
                              onValueChange={(value) => updateTerritoryRule(rule.territory, { cmo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {cmos.map(cmo => (
                                  <SelectItem key={cmo.name} value={cmo.name}>
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      <div>
                                        <div>{cmo.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {cmo.type.join(', ')}
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Ownership %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.ownershipPercentage || ''}
                              onChange={(e) => updateTerritoryRule(rule.territory, { 
                                ownershipPercentage: parseInt(e.target.value) || 0 
                              })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Rule Type</Label>
                            <Select
                              value={rule.inclusion}
                              onValueChange={(value) => updateTerritoryRule(rule.territory, { 
                                inclusion: value as 'include' | 'exclude' 
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="include">Include Territory</SelectItem>
                                <SelectItem value="exclude">Exclude Territory</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Input
                            placeholder="Additional territory-specific notes..."
                            value={rule.notes || ''}
                            onChange={(e) => updateTerritoryRule(rule.territory, { notes: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Add territories to configure collection society rules and ownership percentages.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};