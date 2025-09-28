import React, { useState, useMemo } from "react";
import { SavedScenario } from "@/hooks/useSavedScenarios";
import { ScenarioCard } from "./ScenarioCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, Grid3X3, List, BarChart3, Trash2, Star, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ScenariosDashboardProps {
  scenarios: SavedScenario[];
  loading: boolean;
  onViewDetails: (scenario: SavedScenario) => void;
  onCompareScenarios: (scenarios: SavedScenario[]) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedScenario>) => void;
  onDuplicate: (scenario: SavedScenario) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'date' | 'name' | 'valuation' | 'confidence';

export const ScenariosDashboard: React.FC<ScenariosDashboardProps> = ({
  scenarios,
  loading,
  onViewDetails,
  onCompareScenarios,
  onDelete,
  onUpdate,
  onDuplicate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Extract all unique tags from scenarios
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    scenarios.forEach(scenario => {
      scenario.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [scenarios]);

  // Filter and sort scenarios
  const filteredAndSortedScenarios = useMemo(() => {
    let filtered = scenarios.filter(scenario => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        scenario.scenario_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tags filter
      const matchesTags = filterTags.length === 0 || 
        filterTags.some(tag => scenario.tags?.includes(tag));

      // Favorites filter
      const matchesFavorites = !showFavoritesOnly || scenario.is_favorite;

      return matchesSearch && matchesTags && matchesFavorites;
    });

    // Sort scenarios
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.scenario_name.localeCompare(b.scenario_name);
        case 'valuation':
          const aVal = a.risk_adjusted_value || a.valuation_amount || 0;
          const bVal = b.risk_adjusted_value || b.valuation_amount || 0;
          return bVal - aVal;
        case 'confidence':
          return (b.confidence_score || 0) - (a.confidence_score || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [scenarios, searchQuery, sortBy, filterTags, showFavoritesOnly]);

  const handleToggleSelection = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleSelectAll = () => {
    if (selectedScenarios.length === filteredAndSortedScenarios.length) {
      setSelectedScenarios([]);
    } else {
      setSelectedScenarios(filteredAndSortedScenarios.map(s => s.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedScenarios.length} scenarios?`)) {
      selectedScenarios.forEach(id => onDelete(id));
      setSelectedScenarios([]);
    }
  };

  const handleCompareSelected = () => {
    const scenariosToCompare = scenarios.filter(s => selectedScenarios.includes(s.id));
    onCompareScenarios(scenariosToCompare);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scenarios Dashboard
            <Badge variant="secondary">{filteredAndSortedScenarios.length} scenarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Latest</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="valuation">Valuation</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex bg-muted rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Favorites Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="favorites"
                checked={showFavoritesOnly}
                onCheckedChange={(checked) => setShowFavoritesOnly(!!checked)}
              />
              <label htmlFor="favorites" className="flex items-center gap-1 text-sm cursor-pointer">
                <Star className="h-3 w-3" />
                Favorites only
              </label>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 6).map(tag => (
                    <Badge
                      key={tag}
                      variant={filterTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        setFilterTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{allTags.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedScenarios.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedScenarios.length === filteredAndSortedScenarios.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedScenarios.length} selected
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {selectedScenarios.length >= 2 && selectedScenarios.length <= 4 && (
                    <Button variant="outline" size="sm" onClick={handleCompareSelected}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Compare
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scenarios Grid/List */}
      {filteredAndSortedScenarios.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No scenarios found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterTags.length > 0 || showFavoritesOnly
                  ? "Try adjusting your filters or search terms."
                  : "Start by using the Catalog Valuation tool to create your first scenario."
                }
              </p>
              {(searchQuery || filterTags.length > 0 || showFavoritesOnly) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterTags([]);
                    setShowFavoritesOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {filteredAndSortedScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              viewMode={viewMode}
              isSelected={selectedScenarios.includes(scenario.id)}
              onToggleSelection={() => handleToggleSelection(scenario.id)}
              onViewDetails={() => onViewDetails(scenario)}
              onDelete={() => onDelete(scenario.id)}
              onUpdate={(updates) => onUpdate(scenario.id, updates)}
              onDuplicate={() => onDuplicate(scenario)}
            />
          ))}
        </div>
      )}
    </div>
  );
};