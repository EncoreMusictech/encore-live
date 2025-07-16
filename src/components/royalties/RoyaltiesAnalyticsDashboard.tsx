import { useState, useMemo } from "react";
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function RoyaltiesAnalyticsDashboard() {
  const { allocations, loading } = useRoyaltyAllocations();
  const { writers: controlledWriters, loading: writersLoading } = useControlledWriters();
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

  // Get unique filter values from processed royalties only
  const filterOptions = useMemo(() => {
    // Filter to show only processed royalties
    const processedAllocations = allocations.filter(allocation => 
      allocation.batch_id // Only include allocations that have been processed through batches
    );
    
    const workTitles = [...new Set(processedAllocations.map(a => a.song_title).filter(Boolean))];
    const artists = [...new Set(processedAllocations.map(a => a.artist).filter(Boolean))];
    
    return {
      workTitles,
      artists,
      // Mock data for territory, source, and media type since they're not in the current schema
      territories: ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France'],
      sources: ['Spotify', 'Apple Music', 'YouTube', 'Amazon Music', 'ASCAP', 'BMI'],
      mediaTypes: ['Streaming', 'Radio', 'TV', 'Film', 'Commercial', 'Digital Download']
    };
  }, [allocations]);

  // Process data for analytics - only processed royalties
  const analyticsData = useMemo(() => {
    // Start with only processed royalties (those with batch_id)
    let filtered = allocations.filter(allocation => allocation.batch_id);

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

    if (selectedWorkTitle !== "all") {
      filtered = filtered.filter(allocation => allocation.song_title === selectedWorkTitle);
    }

    if (selectedWriterName !== "all") {
      // Filter by writer name - need to join with royalty_writers and contacts
      const writerContactIds = controlledWriters
        .filter(writer => writer.name.toLowerCase().includes(selectedWriterName.toLowerCase()))
        .map(writer => writer.contact_id);
      
      if (writerContactIds.length > 0) {
        // This is a simplified filter - in a real implementation, you'd need to 
        // join the data to check if the allocation has writers with these contact IDs
        filtered = filtered.filter(allocation => 
          // For now, we'll keep all allocations since we don't have the writer data joined
          // In a real implementation, you'd join royalty_writers table
          true
        );
      } else {
        // No writers match the search, so return empty results
        filtered = [];
      }
    }

    // Generate quarterly data
    const quarterlyData = [
      { quarter: "Q1 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() < 3).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q2 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 3 && new Date(a.created_at).getMonth() < 6).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q3 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 6 && new Date(a.created_at).getMonth() < 9).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q4 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 9).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
    ];

    // Generate controlled status data
    const controlledData = filtered.reduce((acc, allocation) => {
      const status = allocation.controlled_status || 'Non-Controlled';
      acc[status] = (acc[status] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const controlledPieData = Object.entries(controlledData).map(([name, value]) => ({ name, value }));

    // Generate top songs data
    const songData = filtered.reduce((acc, allocation) => {
      acc[allocation.song_title] = (acc[allocation.song_title] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const topSongs = Object.entries(songData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([song, amount]) => ({ song, amount }));

    return {
      quarterly: quarterlyData,
      controlled: controlledPieData,
      topSongs,
      total: filtered.reduce((sum, a) => sum + a.gross_royalty_amount, 0),
      count: filtered.length,
      averagePerRoyalty: filtered.length > 0 ? filtered.reduce((sum, a) => sum + a.gross_royalty_amount, 0) / filtered.length : 0
    };
  }, [allocations, dateRange, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType, controlledWriters]);

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
      quarterly: analyticsData.quarterly,
      controlled: analyticsData.controlled,
      topSongs: analyticsData.topSongs
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-royalties-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Processed royalties analytics data has been exported successfully."
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
          <div className="animate-pulse">Loading processed royalties analytics...</div>
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
            <h2 className="text-3xl font-bold">Processed Royalties Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights from your processed royalty data</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From processed royalties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.count.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Processed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.averagePerRoyalty.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">Per royalty payment</p>
          </CardContent>
        </Card>
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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quarterly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Revenue Trend</CardTitle>
            <CardDescription>Processed royalty revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.quarterly}>
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
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Controlled Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>By controlled status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.controlled}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analyticsData.controlled.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-4 space-x-4">
                {analyticsData.controlled.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-sm">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Songs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Songs</CardTitle>
          <CardDescription>Highest revenue generating tracks from processed royalties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.topSongs} margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis 
                  type="category" 
                  dataKey="song" 
                  width={150}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
