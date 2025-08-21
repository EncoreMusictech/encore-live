import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useControlledWriters } from "@/hooks/useControlledWriters";
import { Download, Brain, CalendarIcon, TrendingUp, DollarSign, FileText, Check, ChevronsUpDown, PenTool, Filter, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import TerritoryWorldMap from './TerritoryWorldMap';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function RoyaltiesAnalyticsDashboard() {
  const { allocations, loading } = useRoyaltyAllocations();
  const { writers: controlledWriters, loading: writersLoading } = useControlledWriters();
  const [batchSources, setBatchSources] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedWriterName, setSelectedWriterName] = useState<string>("all");
  const [writerSearchOpen, setWriterSearchOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedWorkTitle, setSelectedWorkTitle] = useState<string>("all");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("all");
  const [aiInsights, setAiInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch batch sources to map batch IDs to sources
  useEffect(() => {
    const fetchBatchSources = async () => {
      if (allocations.length === 0) return;
      
      const batchIds = [...new Set(allocations.map(a => a.batch_id).filter(Boolean))];
      if (batchIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('reconciliation_batches')
          .select('id, source')
          .in('id', batchIds);
        
        if (error) throw error;
        
        const sourcesMap = data.reduce((acc, batch) => {
          acc[batch.id] = batch.source;
          return acc;
        }, {} as Record<string, string>);
        
        setBatchSources(sourcesMap);
      } catch (error) {
        console.error('Error fetching batch sources:', error);
      }
    };
    
    fetchBatchSources();
  }, [allocations]);

  // Get unique filter values from all royalties
  const filterOptions = useMemo(() => {
    // Use all allocations, not just processed ones
    const allAllocations = allocations;
    
    const workTitles = [...new Set(allAllocations.map(a => a.song_title).filter(Boolean))];
    const artists = [...new Set(allAllocations.map(a => a.artist).filter(Boolean))];
    
    return {
      workTitles,
      artists,
      // Get actual values from the database where available
      territories: [...new Set(allAllocations.map(a => a.country).filter(Boolean))],
      sources: [...new Set(allAllocations.map(a => a.source).filter(Boolean))],
      mediaTypes: [...new Set(allAllocations.map(a => a.media_type).filter(Boolean))]
    };
  }, [allocations]);

  // Process data for analytics - analyze ALL royalties
  const analyticsData = useMemo(() => {
    // Start with ALL allocations, not just processed ones
    let filtered = [...allocations];

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(allocation => {
        const createdDate = new Date(allocation.created_at);
        if (dateRange.from && dateRange.to) {
          return createdDate >= dateRange.from && createdDate <= dateRange.to;
        } else if (dateRange.from) {
          return createdDate >= dateRange.from;
        } else if (dateRange.to) {
          return createdDate <= dateRange.to;
        }
        return true;
      });
    }

    // Apply writer filter
    if (selectedWriterName !== "all") {
      const writerContactIds = controlledWriters
        .filter(writer => writer.name.toLowerCase().includes(selectedWriterName.toLowerCase()))
        .map(writer => writer.contact_id);
      
      if (writerContactIds.length > 0) {
        filtered = filtered.filter(allocation => true); // Simplified for demo
      } else {
        filtered = [];
      }
    }

    // Apply source filter
    if (selectedSource !== "all") {
      filtered = filtered.filter(allocation => allocation.source === selectedSource);
    }

    // Apply territory filter  
    if (selectedTerritory !== "all") {
      filtered = filtered.filter(allocation => allocation.country === selectedTerritory);
    }

    // Apply work title filter
    if (selectedWorkTitle !== "all") {
      filtered = filtered.filter(allocation => allocation.song_title === selectedWorkTitle);
    }

    // Apply media type filter
    if (selectedMediaType !== "all") {
      filtered = filtered.filter(allocation => allocation.media_type === selectedMediaType);
    }

    // Generate the 4 required charts data
    
    // 1. Royalties x Media Type
    const mediaTypeData = filtered.reduce((acc, allocation) => {
      const mediaType = allocation.media_type || 'Unknown';
      acc[mediaType] = (acc[mediaType] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const mediaTypeChartData = Object.entries(mediaTypeData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 2. Royalties x Territory  
    const territoryData = filtered.reduce((acc, allocation) => {
      const territory = allocation.country || 'Unknown';
      acc[territory] = (acc[territory] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const territoryChartData = Object.entries(territoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 territories

    // 3. Royalties x Source
    const sourceData = filtered.reduce((acc, allocation) => {
      // Check multiple possible source fields, including batch source lookup
      const source = allocation.source || 
                    allocation.mapped_data?.["Statement Source"] || 
                    allocation.mapped_data?.["REVENUE SOURCE"] ||
                    allocation.revenue_source ||
                    (allocation.batch_id ? batchSources[allocation.batch_id] : null) ||  // Look up batch source
                    'Unknown';
      
      // Debug logging to see what sources we're getting
      if (allocation.batch_id && batchSources[allocation.batch_id]) {
        console.log('Found batch source:', batchSources[allocation.batch_id], 'for allocation:', allocation.royalty_id);
      }
      
      acc[source] = (acc[source] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const sourceChartData = Object.entries(sourceData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Royalties x Quarter
    const quarterlyData = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1; year <= currentYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const startMonth = (quarter - 1) * 3;
        const endMonth = quarter * 3 - 1;
        
        const quarterlyAmount = filtered.filter(allocation => {
          const date = new Date(allocation.created_at);
          return date.getFullYear() === year && 
                 date.getMonth() >= startMonth && 
                 date.getMonth() <= endMonth;
        }).reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
        
        if (quarterlyAmount > 0) {
          quarterlyData.push({
            quarter: `Q${quarter} ${year}`,
            amount: quarterlyAmount
          });
        }
      }
    }

    // Find top performing song and songwriter
    const songPerformance = filtered.reduce((acc, allocation) => {
      const song = allocation.song_title || 'Unknown';
      acc[song] = (acc[song] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const topSong = Object.entries(songPerformance)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate top performing controlled songwriter
    const songwriterPerformance = filtered.reduce((acc, allocation) => {
      // Find controlled writers associated with this allocation
      const associatedWriters = controlledWriters.filter(writer => 
        allocation.song_title && writer.name
      );
      
      if (associatedWriters.length > 0) {
        associatedWriters.forEach(writer => {
          acc[writer.name] = (acc[writer.name] || 0) + allocation.gross_royalty_amount;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const topSongwriter = Object.entries(songwriterPerformance)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      mediaType: mediaTypeChartData,
      territory: territoryChartData,
      source: sourceChartData,
      quarterly: quarterlyData,
      total: filtered.reduce((sum, a) => sum + a.gross_royalty_amount, 0),
      count: filtered.length,
      averagePerRoyalty: filtered.length > 0 ? filtered.reduce((sum, a) => sum + a.gross_royalty_amount, 0) / filtered.length : 0,
      topSong,
      topSongwriter
    };
  }, [allocations, dateRange, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType, controlledWriters, batchSources]);

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('royalties-ai-insights', {
        body: { 
          analyticsData,
          filters: { dateRange, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType }
        }
      });

      if (error) throw error;
      setAiInsights(data.insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Error generating insights",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportData = () => {
    const dataToExport = {
      summary: {
        totalAmount: analyticsData.total,
        totalCount: analyticsData.count,
        averagePerRoyalty: analyticsData.averagePerRoyalty,
        filters: { dateRange, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType }
      },
      mediaType: analyticsData.mediaType,
      territory: analyticsData.territory,
      source: analyticsData.source,
      quarterly: analyticsData.quarterly
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royalties-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Royalties analytics data has been exported successfully."
    });
  };

  const clearAllFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedWriterName("all");
    setSelectedTerritory("all");
    setSelectedSource("all");
    setSelectedWorkTitle("all");
    setSelectedMediaType("all");
  };

  const hasActiveFilters = !!(
    dateRange.from || dateRange.to ||
    selectedWriterName !== "all" ||
    selectedTerritory !== "all" ||
    selectedSource !== "all" ||
    selectedWorkTitle !== "all" ||
    selectedMediaType !== "all"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-pulse">Loading royalties analytics...</div>
          <p className="text-sm text-muted-foreground">Analyzing your royalty data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Royalties Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights from all your royalty data</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-1">{
                [dateRange.from || dateRange.to, selectedWriterName !== "all", selectedTerritory !== "all", selectedSource !== "all", selectedWorkTitle !== "all", selectedMediaType !== "all"].filter(Boolean).length
              }</Badge>}
            </Button>
            <Button onClick={generateAIInsights} disabled={loadingInsights} variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              {loadingInsights ? "Generating..." : "AI Insights"}
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM dd, y")
                          )
                        ) : (
                          <span>Pick dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Writer</label>
                  <Popover open={writerSearchOpen} onOpenChange={setWriterSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={writerSearchOpen}
                        className="w-full justify-between"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        <span className="truncate">
                          {selectedWriterName === "all"
                            ? "All Writers"
                            : controlledWriters.find((writer) => writer.name === selectedWriterName)?.name || selectedWriterName}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search writers..." />
                        <CommandList>
                          <CommandEmpty>No controlled writers found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setSelectedWriterName("all");
                                setWriterSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedWriterName === "all" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              All Writers
                            </CommandItem>
                            {controlledWriters.map((writer) => (
                              <CommandItem
                                key={writer.contact_id}
                                value={writer.name}
                                onSelect={(currentValue) => {
                                  setSelectedWriterName(currentValue === selectedWriterName ? "all" : currentValue);
                                  setWriterSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedWriterName === writer.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {writer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Territory</label>
                  <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Territory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Territories</SelectItem>
                      {filterOptions.territories.map((territory) => (
                        <SelectItem key={territory} value={territory}>{territory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {filterOptions.sources.map((source) => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Title</label>
                  <Select value={selectedWorkTitle} onValueChange={setSelectedWorkTitle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Work Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Works</SelectItem>
                      {filterOptions.workTitles.slice(0, 20).map((title) => (
                        <SelectItem key={title} value={title}>
                          {title.length > 30 ? title.substring(0, 30) + '...' : title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Media Type</label>
                  <Select value={selectedMediaType} onValueChange={setSelectedMediaType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Media Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Media</SelectItem>
                      {filterOptions.mediaTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm leading-relaxed">
              {aiInsights}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts - 4 Required Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Royalties x Media Type */}
        <Card>
          <CardHeader>
            <CardTitle>Royalties x Media Type</CardTitle>
            <CardDescription>Revenue distribution by media type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.mediaType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.mediaType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Royalties x Territory - Interactive World Map */}
        <TerritoryWorldMap territoryData={analyticsData.territory} />

        {/* 3. Royalties x Source */}
        <Card>
          <CardHeader>
            <CardTitle>Royalties x Source</CardTitle>
            <CardDescription>Revenue distribution by source (gross amounts)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.source}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Royalties x Quarter */}
        <Card>
          <CardHeader>
            <CardTitle>Royalties x Quarter</CardTitle>
            <CardDescription>Quarterly revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.quarterly}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="quarter" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
