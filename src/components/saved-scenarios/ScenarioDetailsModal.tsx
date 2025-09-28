import React, { useState } from "react";
import { SavedScenario } from "@/hooks/useSavedScenarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  DollarSign, 
  BarChart3, 
  Target, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Copy, 
  Trash2,
  TrendingUp,
  Users,
  Music,
  FileBarChart
} from "lucide-react";

interface ScenarioDetailsModalProps {
  scenario: SavedScenario;
  onUpdate: (id: string, updates: Partial<SavedScenario>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (scenario: SavedScenario) => void;
  onClose: () => void;
}

export const ScenarioDetailsModal: React.FC<ScenarioDetailsModalProps> = ({
  scenario,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(scenario.scenario_name);
  const [editedNotes, setEditedNotes] = useState(scenario.notes || '');
  const [editedTags, setEditedTags] = useState(scenario.tags?.join(', ') || '');
  const [editedFavorite, setEditedFavorite] = useState(scenario.is_favorite || false);

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (score: number | null): string => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSaveEdits = () => {
    const updates: Partial<SavedScenario> = {
      scenario_name: editedName,
      notes: editedNotes || null,
      tags: editedTags ? editedTags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
      is_favorite: editedFavorite,
    };

    onUpdate(scenario.id, updates);
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditedName(scenario.scenario_name);
    setEditedNotes(scenario.notes || '');
    setEditedTags(scenario.tags?.join(', ') || '');
    setEditedFavorite(scenario.is_favorite || false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      onDelete(scenario.id);
      onClose();
    }
  };

  const mainValuation = scenario.risk_adjusted_value || scenario.valuation_amount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-bold"
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editedFavorite}
                      onCheckedChange={setEditedFavorite}
                    />
                    <Label className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Favorite
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{scenario.scenario_name}</CardTitle>
                  {scenario.is_favorite && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {scenario.artist_name}
                </Badge>
                {scenario.genre && (
                  <Badge variant="outline">{scenario.genre}</Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdits}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdits}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicate(scenario)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Valuation</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(mainValuation)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">Confidence</span>
              </div>
              <div className={`text-2xl font-bold ${getConfidenceColor(scenario.confidence_score)}`}>
                {scenario.confidence_score || 0}/100
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Revenue Sources</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {scenario.revenue_sources_count || 0}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Music className="h-4 w-4" />
                <span className="text-sm">Total Streams</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(scenario.total_streams)}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 font-medium">{formatDate(scenario.created_at)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="ml-2 font-medium">{formatDate(scenario.updated_at)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Methodology:</span>
              <span className="ml-2 font-medium">{scenario.valuation_methodology || 'Standard'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="metadata">Data & Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Valuation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valuation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenario.dcf_valuation && (
                  <div className="flex justify-between">
                    <span>DCF Valuation:</span>
                    <span className="font-semibold">{formatCurrency(scenario.dcf_valuation)}</span>
                  </div>
                )}
                {scenario.multiple_valuation && (
                  <div className="flex justify-between">
                    <span>Multiple Valuation:</span>
                    <span className="font-semibold">{formatCurrency(scenario.multiple_valuation)}</span>
                  </div>
                )}
                {scenario.risk_adjusted_value && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Risk-Adjusted Value:</span>
                    <span className="font-bold text-green-600">{formatCurrency(scenario.risk_adjusted_value)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Streams:</span>
                  <span className="font-semibold">{formatNumber(scenario.total_streams)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Listeners:</span>
                  <span className="font-semibold">{formatNumber(scenario.monthly_listeners)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Popularity Score:</span>
                  <span className="font-semibold">{scenario.popularity_score || 0}/100</span>
                </div>
                {scenario.catalog_age_years && (
                  <div className="flex justify-between">
                    <span>Catalog Age:</span>
                    <span className="font-semibold">{scenario.catalog_age_years} years</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          {scenario.tags && scenario.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scenario.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenario.ltm_revenue && (
                  <div className="flex justify-between">
                    <span>LTM Revenue:</span>
                    <span className="font-semibold">{formatCurrency(scenario.ltm_revenue)}</span>
                  </div>
                )}
                {scenario.has_additional_revenue && (
                  <div className="flex justify-between">
                    <span>Additional Revenue:</span>
                    <span className="font-semibold">{formatCurrency(scenario.total_additional_revenue)}</span>
                  </div>
                )}
                {scenario.revenue_diversification_score !== null && (
                  <div className="flex justify-between">
                    <span>Diversification Score:</span>
                    <span className="font-semibold">{(scenario.revenue_diversification_score * 100).toFixed(0)}%</span>
                  </div>
                )}
                {scenario.discount_rate && (
                  <div className="flex justify-between border-t pt-2">
                    <span>Discount Rate:</span>
                    <span className="font-semibold">{(scenario.discount_rate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Tracks */}
            {scenario.top_tracks && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Top Tracks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scenario.top_tracks.slice(0, 5).map((track: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{track.name}</span>
                        <span className="text-muted-foreground">{track.popularity}/100</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes about this scenario..."
                  rows={4}
                />
              ) : (
                <div className="text-sm">
                  {scenario.notes ? (
                    <p className="whitespace-pre-wrap">{scenario.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes added</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags Edit */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder="Enter tags separated by commas..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple tags with commas
                </p>
              </CardContent>
            </Card>
          )}

          {/* Technical Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                Technical Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Scenario ID:</span>
                  <span className="ml-2 font-mono text-xs">{scenario.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="ml-2 font-mono text-xs">{scenario.user_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Has Additional Revenue:</span>
                  <span className="ml-2">{scenario.has_additional_revenue ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue Sources Count:</span>
                  <span className="ml-2">{scenario.revenue_sources_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};