import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useControlledWriters } from "@/hooks/useControlledWriters";
import { Download, Brain, CalendarIcon, Users, Globe, Radio, FileText, Check, ChevronsUpDown, PenTool } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function RoyaltiesAnalyticsDashboard() {
  const { allocations, loading } = useRoyaltyAllocations();
  const { writers: controlledWriters, loading: writersLoading } = useControlledWriters();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedControlledWriter, setSelectedControlledWriter] = useState<string>("all");
  const [selectedWriterName, setSelectedWriterName] = useState<string>("all");
  const [writerSearchOpen, setWriterSearchOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedWorkTitle, setSelectedWorkTitle] = useState<string>("all");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("all");
  const [aiInsights, setAiInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Get unique filter values
  const filterOptions = useMemo(() => {
    const controlledWriters = [...new Set(allocations.map(a => a.controlled_status).filter(Boolean))];
    const workTitles = [...new Set(allocations.map(a => a.song_title).filter(Boolean))];
    const artists = [...new Set(allocations.map(a => a.artist).filter(Boolean))];
    
    return {
      controlledWriters,
      workTitles,
      artists,
      // Mock data for territory, source, and media type since they're not in the current schema
      territories: ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France'],
      sources: ['Spotify', 'Apple Music', 'YouTube', 'Amazon Music', 'ASCAP', 'BMI'],
      mediaTypes: ['Streaming', 'Radio', 'TV', 'Film', 'Commercial', 'Digital Download']
    };
  }, [allocations]);

  // Process data for analytics
  const analyticsData = useMemo(() => {
    let filtered = allocations;

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

    if (selectedControlledWriter !== "all") {
      filtered = filtered.filter(allocation => allocation.controlled_status === selectedControlledWriter);
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

    // Note: Territory, Source, and Media Type filters would require additional data
    // For now, these are placeholders that could be implemented when the data model includes these fields

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
      count: filtered.length
    };
  }, [allocations, dateRange, selectedControlledWriter, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType, controlledWriters]);

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('royalties-ai-insights', {
        body: { 
          analyticsData,
          filters: { dateRange, selectedControlledWriter, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType }
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
        filters: { dateRange, selectedControlledWriter, selectedWriterName, selectedTerritory, selectedSource, selectedWorkTitle, selectedMediaType }
      },
      quarterly: analyticsData.quarterly,
      controlled: analyticsData.controlled,
      topSongs: analyticsData.topSongs
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
      description: "Analytics data has been exported successfully."
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Royalties Analytics</h2>
          <p className="text-muted-foreground">Comprehensive analysis of your royalty performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-48 justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
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
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedControlledWriter} onValueChange={setSelectedControlledWriter}>
            <SelectTrigger className="w-40">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Writer Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {filterOptions.controlledWriters.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
            <SelectTrigger className="w-36">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              {filterOptions.territories.map((territory) => (
                <SelectItem key={territory} value={territory}>{territory}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={writerSearchOpen} onOpenChange={setWriterSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={writerSearchOpen}
                className="w-48 justify-between"
              >
                <PenTool className="h-4 w-4 mr-2" />
                {selectedWriterName === "all"
                  ? "All Writers"
                  : controlledWriters.find((writer) => writer.name === selectedWriterName)?.name || selectedWriterName}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
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

          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-36">
              <Radio className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {filterOptions.sources.map((source) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedWorkTitle} onValueChange={setSelectedWorkTitle}>
            <SelectTrigger className="w-48">
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Work Title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Works</SelectItem>
              {filterOptions.workTitles.slice(0, 20).map((title) => (
                <SelectItem key={title} value={title}>{title.length > 30 ? title.substring(0, 30) + '...' : title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMediaType} onValueChange={setSelectedMediaType}>
            <SelectTrigger className="w-36">
              <Radio className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Media Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              {filterOptions.mediaTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={generateAIInsights} disabled={loadingInsights} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            {loadingInsights ? "Generating..." : "AI Insights"}
          </Button>

          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Royalties</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Royalty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.count > 0 ? (analyticsData.total / analyticsData.count).toFixed(2) : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                    : dateRange.from
                    ? `From ${format(dateRange.from, "MMM d")}`
                    : dateRange.to
                    ? `To ${format(dateRange.to, "MMM d")}`
                    : ""}
                </Badge>
              )}
              {selectedControlledWriter !== "all" && <Badge variant="secondary">{selectedControlledWriter}</Badge>}
              {selectedWriterName !== "all" && <Badge variant="secondary">{selectedWriterName}</Badge>}
              {selectedTerritory !== "all" && <Badge variant="secondary">{selectedTerritory}</Badge>}
              {selectedSource !== "all" && <Badge variant="secondary">{selectedSource}</Badge>}
              {selectedWorkTitle !== "all" && <Badge variant="secondary">{selectedWorkTitle.length > 20 ? selectedWorkTitle.substring(0, 20) + '...' : selectedWorkTitle}</Badge>}
              {selectedMediaType !== "all" && <Badge variant="secondary">{selectedMediaType}</Badge>}
              {!dateRange.from && !dateRange.to && selectedControlledWriter === "all" && selectedWriterName === "all" && selectedTerritory === "all" && selectedSource === "all" && selectedWorkTitle === "all" && selectedMediaType === "all" && (
                <Badge variant="outline">No filters</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="quarterly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quarterly">Quarterly Trends</TabsTrigger>
          <TabsTrigger value="controlled">Controlled Status</TabsTrigger>
          <TabsTrigger value="topsongs">Top Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Revenue Trends</CardTitle>
              <CardDescription>Revenue performance across quarters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.quarterly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controlled">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Controlled Status</CardTitle>
              <CardDescription>Distribution of revenue by writer control status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analyticsData.controlled}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.controlled.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topsongs">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Songs</CardTitle>
              <CardDescription>Songs generating the highest royalties</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.topSongs} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="song" type="category" width={150} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}