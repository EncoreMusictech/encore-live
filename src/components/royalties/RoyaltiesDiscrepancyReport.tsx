import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Download, FileText, Filter } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { toast } from "@/hooks/use-toast";

interface DiscrepancyItem {
  id: string;
  statementId: string;
  workTitle: string;
  source: string;
  writers: string;
  gross: number;
  sourceInfo: string;
  type: 'unmatched' | 'low_confidence' | 'duplicate';
  comments: string;
  date: string;
}

export function RoyaltiesDiscrepancyReport() {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const { allocations } = useRoyaltyAllocations();

  useEffect(() => {
    const loadDiscrepancies = () => {
      try {
        // Filter allocations to find discrepancies
        const discrepancyItems: DiscrepancyItem[] = [];

        allocations.forEach(allocation => {
          // Unmatched items (Non-Controlled status typically indicates unmatched)
          if (allocation.controlled_status === 'Non-Controlled' && 
              allocation.comments?.includes('Unmatched')) {
            discrepancyItems.push({
              id: allocation.id,
              statementId: allocation.statement_id || '',
              workTitle: allocation.song_title,
              source: allocation.source || '',
              writers: allocation.work_writers || allocation.artist || 'Unknown',
              gross: allocation.gross_royalty_amount || 0,
              sourceInfo: allocation.batch_id || '',
              type: 'unmatched',
              comments: allocation.comments || '',
              date: allocation.created_at,
            });
          }

          // Low confidence matches
          if (allocation.comments?.includes('confidence') && 
              allocation.comments.includes('Auto-matched')) {
            const confidenceMatch = allocation.comments.match(/(\d+)% confidence/);
            const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
            
            if (confidence < 80) {
              discrepancyItems.push({
                id: allocation.id,
                statementId: allocation.statement_id || '',
                workTitle: allocation.song_title,
                source: allocation.source || '',
                writers: allocation.work_writers || allocation.artist || 'Unknown',
                gross: allocation.gross_royalty_amount || 0,
                sourceInfo: allocation.batch_id || '',
                type: 'low_confidence',
                comments: allocation.comments || '',
                date: allocation.created_at,
              });
            }
          }
        });

        // Check for duplicates
        const songTitleMap = new Map<string, DiscrepancyItem[]>();
        allocations.forEach(allocation => {
          const key = allocation.song_title.toLowerCase().trim();
          if (!songTitleMap.has(key)) {
            songTitleMap.set(key, []);
          }
          songTitleMap.get(key)!.push({
            id: allocation.id,
            statementId: allocation.statement_id || '',
            workTitle: allocation.song_title,
            source: allocation.source || '',
            writers: allocation.work_writers || allocation.artist || 'Unknown',
            gross: allocation.gross_royalty_amount || 0,
            sourceInfo: allocation.batch_id || '',
            type: 'duplicate',
            comments: allocation.comments || '',
            date: allocation.created_at,
          });
        });

        // Add duplicates to discrepancies
        songTitleMap.forEach((items, key) => {
          if (items.length > 1) {
            items.forEach(item => {
              if (!discrepancyItems.find(d => d.id === item.id && d.type === 'duplicate')) {
                discrepancyItems.push({ ...item, type: 'duplicate' });
              }
            });
          }
        });

        setDiscrepancies(discrepancyItems);
      } catch (error) {
        console.error('Error loading discrepancies:', error);
        toast({
          title: "Error",
          description: "Failed to load discrepancy report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDiscrepancies();
  }, [allocations]);

  const exportReport = () => {
    try {
      const filteredDiscrepancies = selectedTab === "all" 
        ? discrepancies 
        : discrepancies.filter(d => d.type === selectedTab);

      const csvContent = [
        ['STATEMENT ID', 'WORK TITLE', 'SOURCE', 'WRITERS', 'GROSS', 'SOURCE', 'TYPE', 'COMMENTS', 'DATE'].join(','),
        ...filteredDiscrepancies.map(item => [
          `"${item.statementId}"`,
          `"${item.workTitle}"`,
          `"${item.source}"`,
          `"${item.writers}"`,
          item.gross || 0,
          `"${item.sourceInfo}"`,
          item.type,
          `"${item.comments}"`,
          new Date(item.date).toLocaleDateString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `royalties-discrepancy-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Discrepancy report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export discrepancy report",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'unmatched':
        return 'bg-red-100 text-red-800';
      case 'low_confidence':
        return 'bg-yellow-100 text-yellow-800';
      case 'duplicate':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDiscrepancies = selectedTab === "all" 
    ? discrepancies 
    : discrepancies.filter(d => d.type === selectedTab);

  const totalUnmatched = discrepancies.filter(d => d.type === 'unmatched').length;
  const totalLowConfidence = discrepancies.filter(d => d.type === 'low_confidence').length;
  const totalDuplicates = discrepancies.filter(d => d.type === 'duplicate').length;
  const totalAmount = filteredDiscrepancies.reduce((sum, item) => sum + (item.gross || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Royalties Discrepancy Report
              </CardTitle>
              <CardDescription>
                Track unmatched songs, low confidence matches, and potential duplicates
              </CardDescription>
            </div>
            <Button onClick={exportReport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Discrepancies</div>
              <div className="text-2xl font-bold">{discrepancies.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Unmatched</div>
              <div className="text-2xl font-bold text-red-600">{totalUnmatched}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Low Confidence</div>
              <div className="text-2xl font-bold text-yellow-600">{totalLowConfidence}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Duplicates</div>
              <div className="text-2xl font-bold text-blue-600">{totalDuplicates}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy Details */}
      <Card>
        <CardHeader>
          <CardTitle>Discrepancy Details</CardTitle>
          <CardDescription>
            Review individual discrepancy items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({discrepancies.length})</TabsTrigger>
              <TabsTrigger value="unmatched">Unmatched ({totalUnmatched})</TabsTrigger>
              <TabsTrigger value="low_confidence">Low Confidence ({totalLowConfidence})</TabsTrigger>
              <TabsTrigger value="duplicate">Duplicates ({totalDuplicates})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredDiscrepancies.length} items • Total: ${totalAmount.toFixed(2)}
                  </div>
                </div>

                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STATEMENT ID</TableHead>
                        <TableHead>WORK TITLE</TableHead>
                        <TableHead>SOURCE</TableHead>
                        <TableHead>WRITERS</TableHead>
                        <TableHead>GROSS</TableHead>
                        <TableHead>SOURCE</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead>COMMENTS</TableHead>
                        <TableHead>DATE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiscrepancies.map((item) => (
                        <TableRow key={`${item.id}-${item.type}`}>
                          <TableCell className="font-medium">{item.statementId}</TableCell>
                          <TableCell>{item.workTitle}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>{item.writers}</TableCell>
                          <TableCell>${(item.gross || 0).toFixed(2)}</TableCell>
                          <TableCell>{item.sourceInfo}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(item.type)}>
                              {item.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{item.comments}</TableCell>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {filteredDiscrepancies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discrepancies found for this category</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}