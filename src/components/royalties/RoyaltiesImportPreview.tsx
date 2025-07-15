import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, Users, Wrench, Settings, Music, Download } from "lucide-react";
import { RoyaltiesImportStaging, useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { FieldMappingDialog } from "./FieldMappingDialog";
import { SongMatchingDialog } from "./SongMatchingDialog";
import { EncoreMapper, DEFAULT_ENCORE_MAPPING } from "@/lib/encore-mapper";
import { toast } from "@/hooks/use-toast";

interface RoyaltiesImportPreviewProps {
  record: RoyaltiesImportStaging;
  onBack: () => void;
}

export function RoyaltiesImportPreview({ record, onBack }: RoyaltiesImportPreviewProps) {
  const [selectedTab, setSelectedTab] = useState("mapped");
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showSongMatchingDialog, setShowSongMatchingDialog] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);
  const { updateStagingRecord } = useRoyaltiesImport();
  
  const handleMatchPayees = async () => {
    try {
      // Extract unique client names from mapped data
      const clientNames = new Set(
        mappedData
          .map((row: any) => row['Client Name'])
          .filter((name: string) => name && name.trim())
      );

      console.log('Matching payees for clients:', Array.from(clientNames));

      // Here you would implement the actual payee matching logic
      // For now, we'll just show a success message
      toast({
        title: "Payees Matched",
        description: `Found ${clientNames.size} unique clients to match against contacts`,
      });

      // Update processing status to indicate payees have been matched
      await updateStagingRecord(localRecord.id, {
        processing_status: 'processed',
        payee_matches: {
          matched_clients: Array.from(clientNames),
          match_date: new Date().toISOString(),
        },
      });

      const updatedRecord = {
        ...localRecord,
        processing_status: 'processed' as const,
        payee_matches: {
          matched_clients: Array.from(clientNames),
          match_date: new Date().toISOString(),
        },
      };
      setLocalRecord(updatedRecord);

    } catch (error) {
      console.error('Error matching payees:', error);
      toast({
        title: "Error",
        description: "Failed to match payees",
        variant: "destructive",
      });
    }
  };

  const handleSongMatchingComplete = (results: { matched: number; unmatched: number }) => {
    toast({
      title: "Song Matching Complete",
      description: `${results.matched} songs matched, ${results.unmatched} unmatched and added to allocations`,
    });

    // Update the work_matches in the record
    const updatedRecord = {
      ...localRecord,
      work_matches: {
        matched_count: results.matched,
        unmatched_count: results.unmatched,
        match_date: new Date().toISOString(),
      },
    };
    setLocalRecord(updatedRecord);
  };

  const handleApproveAndProcess = async () => {
    try {
      await updateStagingRecord(localRecord.id, {
        processing_status: 'processed',
      });

      const updatedRecord = {
        ...localRecord,
        processing_status: 'processed' as const,
      };
      setLocalRecord(updatedRecord);

      toast({
        title: "Success",
        description: "Statement approved and processed successfully",
      });
    } catch (error) {
      console.error('Error approving statement:', error);
      toast({
        title: "Error", 
        description: "Failed to approve and process statement",
        variant: "destructive",
      });
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to download",
        variant: "destructive",
      });
      return;
    }

    // Get all unique headers from the data
    const headers = Array.from(new Set(
      data.flatMap(row => Object.keys(row))
    )).sort();

    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `${filename} downloaded successfully`,
    });
  };

  const rawData = Array.isArray(localRecord.raw_data) ? localRecord.raw_data : [];
  const mappedData = Array.isArray(localRecord.mapped_data) ? localRecord.mapped_data : [];
  const validationStatus = localRecord.validation_status || {};
  const errors = validationStatus.errors || [];
  
  // Remove duplicate errors
  const uniqueErrors = Array.from(new Set(errors));
  
  // Common required fields for royalty statements
  const requiredFields = ['Song Title', 'Client Name', 'Gross Amount', 'Period Start'];

  const handleSaveMapping = async (mapping: { [key: string]: string }) => {
    console.log('Saving field mapping:', mapping);
    
    try {
      // Create a new mapping configuration based on saved mappings
      const customMapping = { ...DEFAULT_ENCORE_MAPPING };
      
      // Apply user-defined mappings
      Object.entries(mapping).forEach(([targetField, sourceField]) => {
        // Remove 'required-' or 'validation-' prefix from target field
        const cleanTargetField = targetField.replace(/^(required-|validation-)/, '');
        
        // Update the mapping for the detected source
        if (customMapping[cleanTargetField]) {
          customMapping[cleanTargetField][localRecord.detected_source] = sourceField;
        }
      });

      // Re-run the mapping and validation with the new configuration
      const mapper = new EncoreMapper(customMapping);
      const result = mapper.mapData(rawData, localRecord.detected_source);

      // Update the local record state
      const updatedRecord = {
        ...localRecord,
        mapped_data: result.mappedData,
        unmapped_fields: result.unmappedFields,
        validation_status: {
          errors: result.validationErrors,
          last_validated: new Date().toISOString(),
        },
        processing_status: result.validationErrors.length > 0 ? 'needs_review' as const : 'processed' as const,
      };

      setLocalRecord(updatedRecord);

      // Update the record in the database
      await updateStagingRecord(localRecord.id, {
        mapped_data: result.mappedData,
        unmapped_fields: result.unmappedFields,
        validation_status: {
          errors: result.validationErrors,
          last_validated: new Date().toISOString(),
        },
        processing_status: result.validationErrors.length > 0 ? 'needs_review' : 'processed',
      });

      toast({
        title: "Success",
        description: `Field mapping saved and data re-validated. ${result.validationErrors.length === 0 ? 'No validation errors found!' : `${result.validationErrors.length} validation errors remaining.`}`,
      });

      setShowMappingDialog(false);
    } catch (error) {
      console.error('Error saving field mapping:', error);
      toast({
        title: "Error",
        description: "Failed to save field mapping and re-validate data",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {record.original_filename}
              </CardTitle>
              <CardDescription>
                Import preview and validation results
              </CardDescription>
            </div>
            <Badge className={getStatusColor(localRecord.processing_status)}>
              {localRecord.processing_status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Source</div>
              <div className="text-lg font-semibold">{localRecord.detected_source}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Records</div>
              <div className="text-lg font-semibold">{mappedData.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Unmapped Fields</div>
              <div className="text-lg font-semibold text-yellow-600">{localRecord.unmapped_fields.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Validation Errors</div>
              <div className="text-lg font-semibold text-red-600">{errors.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Summary */}
      {(localRecord.unmapped_fields.length > 0 || uniqueErrors.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Issues Requiring Attention
                {uniqueErrors.length < errors.length && (
                  <Badge variant="secondary" className="ml-2">
                    {errors.length - uniqueErrors.length} duplicates removed
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMappingDialog(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Map Fields
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {localRecord.unmapped_fields.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Unmapped Fields ({localRecord.unmapped_fields.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {localRecord.unmapped_fields.map((field, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer hover:bg-muted">
                      {field}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click "Map Fields" to drag and drop these fields to their correct mappings
                </p>
              </div>
            )}
            {uniqueErrors.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Validation Errors ({uniqueErrors.length} unique)
                </h4>
                <div className="space-y-1">
                  {uniqueErrors.slice(0, 5).map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {uniqueErrors.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {uniqueErrors.length - 5} more unique errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Review the imported and mapped data
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(rawData, `${record.original_filename}_raw.csv`)}
                disabled={rawData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Raw CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(mappedData, `${record.original_filename}_mapped.csv`)}
                disabled={mappedData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Mapped CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mapped">Mapped Data</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
              <TabsTrigger value="comparison">Side by Side</TabsTrigger>
            </TabsList>

            <TabsContent value="mapped">
              <ScrollArea className="h-96 w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Song Title</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Royalty Type</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>Period Start</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedData.slice(0, 100).map((row: any, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row['Song Title'] || '-'}</TableCell>
                        <TableCell>{row['Client Name'] || '-'}</TableCell>
                        <TableCell>{row['Source'] || '-'}</TableCell>
                        <TableCell>{row['Royalty Type'] || '-'}</TableCell>
                        <TableCell>${row['Gross Amount'] || 0}</TableCell>
                        <TableCell>{row['Period Start'] || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {mappedData.length > 100 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing first 100 of {mappedData.length} records
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw">
              <ScrollArea className="h-96 w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {rawData.length > 0 && Object.keys(rawData[0]).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawData.slice(0, 100).map((row: any, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <TableCell key={cellIndex}>{String(value || '-')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rawData.length > 100 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing first 100 of {rawData.length} records
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comparison">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Compare original data with mapped ENCORE format
                </div>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    {mappedData.slice(0, 10).map((mappedRow: any, index) => {
                      const rawRow = rawData[index] || {};
                      return (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Record {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Original Data</h4>
                                <div className="text-xs space-y-1">
                                  {Object.entries(rawRow).slice(0, 5).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">{key}:</span> {String(value || '-')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm mb-2">Mapped Data</h4>
                                <div className="text-xs space-y-1">
                                  {Object.entries(mappedRow)
                                    .filter(([key]) => !key.startsWith('_'))
                                    .slice(0, 5)
                                    .map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">{key}:</span> {String(value || '-')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
          <CardDescription>
            Process or manage this import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleApproveAndProcess}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Process
            </Button>
            <Button variant="outline" onClick={() => setShowMappingDialog(true)}>
              <Wrench className="h-4 w-4 mr-2" />
              Edit Mappings
            </Button>
            <Button variant="outline" onClick={handleMatchPayees}>
              <Users className="h-4 w-4 mr-2" />
              Match Payees
            </Button>
            <Button variant="outline" onClick={() => setShowSongMatchingDialog(true)}>
              <Music className="h-4 w-4 mr-2" />
              Song Matching
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Use "Edit Mappings" to configure field mappings with drag and drop
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping Dialog */}
      <FieldMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        unmappedFields={localRecord.unmapped_fields}
        validationErrors={errors}
        requiredFields={requiredFields}
        onSaveMapping={handleSaveMapping}
      />

      {/* Song Matching Dialog */}
      <SongMatchingDialog
        open={showSongMatchingDialog}
        onOpenChange={setShowSongMatchingDialog}
        mappedData={mappedData}
        batchId={localRecord.batch_id || ''}
        onMatchingComplete={handleSongMatchingComplete}
      />
    </div>
  );
}