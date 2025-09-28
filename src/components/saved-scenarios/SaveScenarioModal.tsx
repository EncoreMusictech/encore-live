import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Star, DollarSign, BarChart3, Target } from "lucide-react";
import { SaveScenarioData } from "@/hooks/useSavedScenarios";

interface SaveScenarioModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SaveScenarioData) => Promise<string | null>;
  saving: boolean;
  defaultData?: {
    artist_name: string;
    valuation_data: any;
    revenue_sources?: any[];
  };
}

const COMMON_TAGS = [
  'Hip-Hop', 'Pop', 'R&B', 'Rock', 'Electronic', 'Country', 
  'High-Risk', 'Medium-Risk', 'Low-Risk',
  'Acquisition', 'Investment', 'Due Diligence', 'Portfolio Review'
];

export const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
  open,
  onClose,
  onSave,
  saving,
  defaultData,
}) => {
  const [scenarioName, setScenarioName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [customTag, setCustomTag] = useState('');

  // Auto-generate scenario name when modal opens
  React.useEffect(() => {
    if (open && defaultData && !scenarioName) {
      const date = new Date().toLocaleDateString();
      setScenarioName(`${defaultData.artist_name} - Analysis ${date}`);
    }
  }, [open, defaultData, scenarioName]);

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!defaultData || !scenarioName.trim()) return;

    const saveData: SaveScenarioData = {
      scenario_name: scenarioName.trim(),
      artist_name: defaultData.artist_name,
      notes: notes.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      is_favorite: isFavorite,
      valuation_data: defaultData.valuation_data,
      revenue_sources: defaultData.revenue_sources,
    };

    const savedId = await onSave(saveData);
    if (savedId) {
      // Reset form
      setScenarioName('');
      setNotes('');
      setSelectedTags([]);
      setIsFavorite(false);
      setCustomTag('');
      onClose();
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Valuation Scenario</DialogTitle>
          <DialogDescription>
            Save this analysis for future reference and comparison with other scenarios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview of what will be saved */}
          {defaultData && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Analysis Preview</span>
                    <Badge variant="secondary">{defaultData.artist_name}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Valuation: {formatCurrency(defaultData.valuation_data?.risk_adjusted_value || defaultData.valuation_data?.valuation_amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span>Confidence: {defaultData.valuation_data?.confidence_score || 0}/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span>Revenue Sources: {defaultData.revenue_sources?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span>Streams: {defaultData.valuation_data?.total_streams ? `${(defaultData.valuation_data.total_streams / 1000000).toFixed(1)}M` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenario Name */}
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Scenario Name *</Label>
            <Input
              id="scenario-name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Enter scenario name..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            
            {/* Common Tags */}
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <Button variant="outline" onClick={handleAddCustomTag}>
                Add
              </Button>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Selected Tags:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this analysis..."
              rows={3}
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
            <Label htmlFor="favorite" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Mark as favorite
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!scenarioName.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save Scenario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};