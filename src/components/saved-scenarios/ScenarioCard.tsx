import React from "react";
import { SavedScenario } from "@/hooks/useSavedScenarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, MoreHorizontal, Eye, Trash2, Copy, DollarSign, BarChart3, Target, Calendar } from "lucide-react";

interface ScenarioCardProps {
  scenario: SavedScenario;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onToggleSelection: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<SavedScenario>) => void;
  onDuplicate: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  viewMode,
  isSelected,
  onToggleSelection,
  onViewDetails,
  onDelete,
  onUpdate,
  onDuplicate,
}) => {
  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConfidenceColor = (score: number | null): string => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const mainValuation = scenario.risk_adjusted_value || scenario.valuation_amount || 0;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
            />
            
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              {/* Scenario Info */}
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  {scenario.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  <div>
                    <h3 className="font-medium">{scenario.scenario_name}</h3>
                    <p className="text-sm text-muted-foreground">{scenario.artist_name}</p>
                  </div>
                </div>
              </div>

              {/* Valuation */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{formatCurrency(mainValuation)}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className={`font-medium ${getConfidenceColor(scenario.confidence_score)}`}>
                    {scenario.confidence_score || 0}/100
                  </span>
                </div>
              </div>

              {/* Revenue Sources */}
              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span>{scenario.revenue_sources_count || 0}</span>
                </div>
              </div>

              {/* Date */}
              <div className="col-span-1 text-right text-sm text-muted-foreground">
                {formatDate(scenario.created_at)}
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onViewDetails}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onUpdate({ is_favorite: !scenario.is_favorite })}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {scenario.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
            />
            {scenario.is_favorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onUpdate({ is_favorite: !scenario.is_favorite })}
              >
                <Star className="h-4 w-4 mr-2" />
                {scenario.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardTitle className="text-lg leading-tight">
          {scenario.scenario_name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{scenario.artist_name}</Badge>
          {scenario.genre && (
            <Badge variant="outline" className="text-xs">
              {scenario.genre}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Valuation</span>
            </div>
            <div className="font-semibold">{formatCurrency(mainValuation)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Confidence</span>
            </div>
            <div className={`font-semibold ${getConfidenceColor(scenario.confidence_score)}`}>
              {scenario.confidence_score || 0}/100
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span>Revenue Sources</span>
            </div>
            <div className="font-semibold">{scenario.revenue_sources_count || 0}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created</span>
            </div>
            <div className="font-semibold">{formatDate(scenario.created_at)}</div>
          </div>
        </div>

        {/* Tags */}
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scenario.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {scenario.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{scenario.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {scenario.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {scenario.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};