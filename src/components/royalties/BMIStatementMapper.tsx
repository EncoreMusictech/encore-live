import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { RoyaltiesImportStaging } from "./RoyaltiesImportStaging";
import { toast } from "@/hooks/use-toast";

interface BMIRawRow {
  'Work Title': string;
  'ISWC': string;
  'BMI Work #': string;
  'Interested Parties (IP Names)': string;
  'Share %': number;
  'Role': string;
  'Source Code': string;
  'Usage Type': string;
  'Period': string;
  'Amount Paid': number;
  'Payment Date': string;
  [key: string]: any;
}

interface ParsedData {
  totalRows: number;
  validRows: number;
  errors: string[];
  data: BMIRawRow[];
  fileName: string;
}

interface MappedRow {
  workId: string;
  songTitle: string;
  iswc: string;
  clientName: string;
  clientRole: string;
  sharePercentage: number;
  source: string;
  royaltyType: string;
  grossRoyaltyAmount: number;
  periodStart: string;
  periodEnd: string;
  statementSource: string;
  paymentDate: string;
  originalBMIWorkId: string;
  matchStatus: 'matched' | 'unmatched' | 'partial';
  matchDetails: string;
}

interface BMIStatementMapperProps {
  parsedData: ParsedData;
  onBack: () => void;
}

// BMI to ENCORE field mapping
const BMI_MAPPING = {
  sourceCodeMap: {
    'R': 'Radio',
    'D': 'Digital',
    'T': 'Television', 
    'L': 'Live Performance',
    'S': 'Streaming',
    'G': 'General Licensing',
    'C': 'Commercial',
    'B': 'Background Music',
    'F': 'Feature Film',
    'V': 'Video',
    'W': 'Website',
    'M': 'Mobile'
  },
  usageTypeMap: {
    'Performance': 'Performance',
    'Mechanical': 'Mechanical', 
    'Synchronization': 'Sync',
    'Digital Performance': 'Digital Performance',
    'Streaming': 'Streaming Mechanical',
    'Download': 'Download Mechanical'
  },
  roleMap: {
    'Author': 'Writer',
    'Composer': 'Writer',
    'Publisher': 'Publisher',
    'Writer': 'Writer'
  }
};

export function BMIStatementMapper({ parsedData, onBack }: BMIStatementMapperProps) {
  const [isMapping, setIsMapping] = useState(false);
  const [mappingProgress, setMappingProgress] = useState(0);
  const [mappedData, setMappedData] = useState<MappedRow[]>([]);
  const [showStaging, setShowStaging] = useState(false);

  // Mock existing works and clients for matching
  const mockExistingWorks = useMemo(() => [
    { bmiWorkId: 'BMI001', workId: 'WID-240001', title: 'Test Song 1', iswc: 'T-123456789-0' },
    { bmiWorkId: 'BMI002', workId: 'WID-240002', title: 'Test Song 2', iswc: 'T-987654321-0' },
  ], []);

  const mockExistingClients = useMemo(() => [
    { name: 'John Doe Music', id: 'CLI-001' },
    { name: 'Jane Smith Publishing', id: 'CLI-002' },
    { name: 'Test Publisher Inc', id: 'CLI-003' },
  ], []);

  const normalizeText = (text: string): string => {
    return text?.trim().toLowerCase().replace(/[^\w\s]/g, '');
  };

  const matchWork = (bmiWorkId: string, title: string, iswc?: string) => {
    // Try exact BMI Work ID match first
    const exactMatch = mockExistingWorks.find(work => work.bmiWorkId === bmiWorkId);
    if (exactMatch) {
      return {
        workId: exactMatch.workId,
        status: 'matched' as const,
        details: `Matched by BMI Work ID: ${bmiWorkId}`
      };
    }

    // Try ISWC match
    if (iswc) {
      const iswcMatch = mockExistingWorks.find(work => work.iswc === iswc);
      if (iswcMatch) {
        return {
          workId: iswcMatch.workId,
          status: 'matched' as const,
          details: `Matched by ISWC: ${iswc}`
        };
      }
    }

    // Try fuzzy title match
    const normalizedTitle = normalizeText(title);
    const titleMatch = mockExistingWorks.find(work => 
      normalizeText(work.title) === normalizedTitle
    );
    if (titleMatch) {
      return {
        workId: titleMatch.workId,
        status: 'partial' as const,
        details: `Partial match by title: ${title}`
      };
    }

    return {
      workId: `NEW-${bmiWorkId}`,
      status: 'unmatched' as const,
      details: `No match found - will create new work`
    };
  };

  const matchClient = (ipName: string) => {
    const normalizedName = normalizeText(ipName);
    const match = mockExistingClients.find(client => 
      normalizeText(client.name) === normalizedName
    );
    
    if (match) {
      return {
        clientName: match.name,
        status: 'matched' as const,
        details: `Matched client: ${match.name}`
      };
    }

    return {
      clientName: ipName,
      status: 'unmatched' as const,
      details: `New client: ${ipName}`
    };
  };

  const formatPeriod = (period: string) => {
    // Try to parse BMI period format and convert to YYYY-MM-DD
    const periodMatch = period.match(/(\d{1,2})\/(\d{4})/);
    if (periodMatch) {
      const [, month, year] = periodMatch;
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      return {
        start: startDate,
        end: endDate.toISOString().split('T')[0]
      };
    }
    
    // Default to current year if period is unclear
    const currentYear = new Date().getFullYear();
    return {
      start: `${currentYear}-01-01`,
      end: `${currentYear}-12-31`
    };
  };

  const mapBMIRow = (row: BMIRawRow): MappedRow => {
    const workMatch = matchWork(row['BMI Work #'], row['Work Title'], row['ISWC']);
    const clientMatch = matchClient(row['Interested Parties (IP Names)']);
    const period = formatPeriod(row['Period']);
    
    // Map source code
    const mappedSource = BMI_MAPPING.sourceCodeMap[row['Source Code'] as keyof typeof BMI_MAPPING.sourceCodeMap] || row['Source Code'] || 'Other';
    
    // Map usage type to royalty type
    const mappedRoyaltyType = BMI_MAPPING.usageTypeMap[row['Usage Type'] as keyof typeof BMI_MAPPING.usageTypeMap] || row['Usage Type'] || 'Performance';
    
    // Map role
    const mappedRole = BMI_MAPPING.roleMap[row['Role'] as keyof typeof BMI_MAPPING.roleMap] || row['Role'] || 'Writer';

    // Parse payment date
    const paymentDate = row['Payment Date'] ? new Date(row['Payment Date']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      workId: workMatch.workId,
      songTitle: row['Work Title']?.trim() || '',
      iswc: row['ISWC']?.trim() || '',
      clientName: clientMatch.clientName,
      clientRole: mappedRole,
      sharePercentage: parseFloat(row['Share %']?.toString() || '0'),
      source: mappedSource,
      royaltyType: mappedRoyaltyType,
      grossRoyaltyAmount: parseFloat(row['Amount Paid']?.toString() || '0'),
      periodStart: period.start,
      periodEnd: period.end,
      statementSource: 'BMI',
      paymentDate,
      originalBMIWorkId: row['BMI Work #'],
      matchStatus: workMatch.status === 'matched' && clientMatch.status === 'matched' ? 'matched' : 
                  workMatch.status === 'unmatched' || clientMatch.status === 'unmatched' ? 'unmatched' : 'partial',
      matchDetails: `${workMatch.details}; ${clientMatch.details}`
    };
  };

  const performMapping = async () => {
    setIsMapping(true);
    setMappingProgress(0);

    try {
      const mapped: MappedRow[] = [];
      
      for (let i = 0; i < parsedData.data.length; i++) {
        const row = parsedData.data[i];
        const mappedRow = mapBMIRow(row);
        mapped.push(mappedRow);
        
        // Update progress
        setMappingProgress(Math.round(((i + 1) / parsedData.data.length) * 100));
        
        // Small delay to show progress
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setMappedData(mapped);
      
      toast({
        title: "Mapping Complete",
        description: `Successfully mapped ${mapped.length} rows`,
      });

    } catch (error) {
      toast({
        title: "Mapping Error",
        description: "Failed to map BMI data to ENCORE format",
        variant: "destructive",
      });
    } finally {
      setIsMapping(false);
    }
  };

  const mappingStats = useMemo(() => {
    if (mappedData.length === 0) return null;
    
    const matched = mappedData.filter(row => row.matchStatus === 'matched').length;
    const partial = mappedData.filter(row => row.matchStatus === 'partial').length;
    const unmatched = mappedData.filter(row => row.matchStatus === 'unmatched').length;
    const totalAmount = mappedData.reduce((sum, row) => sum + row.grossRoyaltyAmount, 0);
    
    return { matched, partial, unmatched, totalAmount };
  }, [mappedData]);

  if (showStaging && mappedData.length > 0) {
    return (
      <RoyaltiesImportStaging 
        mappedData={mappedData}
        originalFileName={parsedData.fileName}
        onBack={() => setShowStaging(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Parser
        </Button>
        <div>
          <h2 className="text-xl font-semibold">BMI Statement Mapper</h2>
          <p className="text-muted-foreground">Transform BMI data to ENCORE format</p>
        </div>
      </div>

      {/* Source Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Source Data: {parsedData.fileName}
          </CardTitle>
          <CardDescription>
            {parsedData.validRows} valid rows ready for mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>BMI Fields Detected:</strong>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                <li>Work Title → Song Title</li>
                <li>BMI Work # → Work ID (with matching)</li>
                <li>ISWC → ISWC</li>
                <li>IP Names → Client Name (with matching)</li>
                <li>Source Code → Royalty Source (mapped)</li>
                <li>Usage Type → Royalty Type (mapped)</li>
              </ul>
            </div>
            <div>
              <strong>Mapping Features:</strong>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                <li>Auto-match existing works by BMI Work # & ISWC</li>
                <li>Auto-match existing clients by name</li>
                <li>Convert BMI source codes to readable names</li>
                <li>Normalize date formats to YYYY-MM-DD</li>
                <li>Clean and trim all text fields</li>
                <li>Flag unmatched items for review</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Progress */}
      {isMapping && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mapping BMI data to ENCORE format...</span>
                <span className="text-sm text-muted-foreground">{mappingProgress}%</span>
              </div>
              <Progress value={mappingProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Processing {parsedData.validRows} rows with auto-matching...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Results */}
      {mappedData.length > 0 && mappingStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mapping Results
            </CardTitle>
            <CardDescription>
              Review mapped data before importing to staging area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-200">Fully Matched</div>
                <div className="text-xl font-bold text-green-900 dark:text-green-100">{mappingStats.matched}</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">Partial Match</div>
                <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{mappingStats.partial}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <div className="text-sm text-red-800 dark:text-red-200">Unmatched</div>
                <div className="text-xl font-bold text-red-900 dark:text-red-100">{mappingStats.unmatched}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">Total Amount</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100">${mappingStats.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Unmatched Items Alert */}
            {mappingStats.unmatched > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{mappingStats.unmatched} items</strong> could not be fully matched to existing works or clients. 
                  These will be flagged for manual review in the staging area.
                </AlertDescription>
              </Alert>
            )}

            {/* Sample Mapped Data */}
            <div>
              <h4 className="text-sm font-medium mb-2">Sample Mapped Data (First 3 rows):</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Work ID</th>
                        <th className="p-2 text-left">Song Title</th>
                        <th className="p-2 text-left">Client</th>
                        <th className="p-2 text-left">Source</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedData.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-mono text-xs">{row.workId}</td>
                          <td className="p-2">{row.songTitle}</td>
                          <td className="p-2">{row.clientName}</td>
                          <td className="p-2">{row.source}</td>
                          <td className="p-2">${row.grossRoyaltyAmount.toFixed(2)}</td>
                          <td className="p-2">
                            <Badge variant={
                              row.matchStatus === 'matched' ? 'default' :
                              row.matchStatus === 'partial' ? 'secondary' : 'destructive'
                            } className="text-xs">
                              {row.matchStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Badge variant="outline">
                {mappedData.length} rows ready for staging
              </Badge>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMappedData([])}
                >
                  Reset Mapping
                </Button>
                <Button onClick={() => setShowStaging(true)}>
                  Import to Staging Area
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Mapping */}
      {mappedData.length === 0 && !isMapping && (
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Map BMI Statement</h3>
            <p className="text-muted-foreground mb-6">
              Click below to start the automatic mapping process. This will:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto mb-6 space-y-1">
              <li>• Match works by BMI Work # and ISWC</li>
              <li>• Match clients by name</li>
              <li>• Convert source codes to readable names</li>
              <li>• Normalize all date and amount formats</li>
              <li>• Flag unmatched items for review</li>
            </ul>
            <Button onClick={performMapping} size="lg">
              Start Mapping Process
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}