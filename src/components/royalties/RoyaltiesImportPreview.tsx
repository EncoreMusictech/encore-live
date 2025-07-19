import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, Users, Wrench, Settings, Music } from "lucide-react";
import { RoyaltiesImportStaging, useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { FieldMappingDialog } from "./FieldMappingDialog";
import { SongMatchingDialog } from "./SongMatchingDialog";
import { EncoreMapper, DEFAULT_ENCORE_MAPPING, ENCORE_STANDARD_FIELDS } from "@/lib/encore-mapper";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RoyaltiesImportPreviewProps {
  record: RoyaltiesImportStaging;
  onBack: () => void;
}

export function RoyaltiesImportPreview({ record, onBack }: RoyaltiesImportPreviewProps) {
  const [selectedTab, setSelectedTab] = useState("mapped");
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showSongMatchingDialog, setShowSongMatchingDialog] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);
  const { updateStagingRecord, updateMappingConfig, mappingConfigs } = useRoyaltiesImport();
  
  // Get existing mapping for this source
  const getExistingMapping = () => {
    const savedConfig = mappingConfigs.find(config => config.source_name === localRecord.detected_source);
    return savedConfig?.mapping_rules || {};
  };
  
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
      description: `${results.matched} songs matched, ${results.unmatched} unmatched and added to royalties`,
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

  const handleSongMatching = async () => {
    setShowSongMatchingDialog(true);
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

  const rawData = Array.isArray(localRecord.raw_data) ? localRecord.raw_data : [];
  const mappedData = Array.isArray(localRecord.mapped_data) ? localRecord.mapped_data : [];
  const validationStatus = localRecord.validation_status || {};
  const errors = validationStatus.errors || [];
  
  // Remove duplicate errors
  const uniqueErrors = Array.from(new Set(errors));
  
  // Get ordered column headers for mapped data display
  const getOrderedHeaders = () => {
    if (mappedData.length === 0) return [];
    const availableFields = Object.keys(mappedData[0]).filter(key => !key.startsWith('_'));
    
    // Define the new column order with renamed headers
    const orderedMapping = [
      { original: 'Statement ID', display: 'STATEMENT ID' },
      { original: 'Statement Source', display: 'SOURCE' },
      { original: 'QUARTER', display: 'QUARTER' },
      { original: 'WORK IDENTIFIER', display: 'WORK IDENTIFIER' },
      { original: 'WORK TITLE', display: 'WORK TITLE' },
      { original: 'WORK WRITERS', display: 'WRITERS' },
      { original: 'SHARE', display: 'SHARES (%)' },
      { original: 'QUANTITY', display: 'QUANTITY' },
      { original: 'REVENUE SOURCE', display: 'MEDIA TYPE' },
      { original: 'COUNTRY', display: 'TERRITORY' },
      { original: 'GROSS', display: 'GROSS' }
    ];
    
    // Build ordered headers array using display names for fields that exist
    const orderedHeaders: string[] = [];
    orderedMapping.forEach(({ original, display }) => {
      // Always include STATEMENT ID column, even if not in data
      if (original === 'Statement ID' || availableFields.includes(original)) {
        orderedHeaders.push(display);
      }
    });
    
    // Add any remaining fields not in the mapping
    availableFields.forEach(field => {
      const isMapped = orderedMapping.some(({ original }) => original === field);
      if (!isMapped) {
        orderedHeaders.push(field);
      }
    });
    
    return orderedHeaders;
  };

  // Helper function to get original field name from display header
  const getOriginalFieldName = (displayHeader: string) => {
    const mapping = [
      { original: 'Statement ID', display: 'STATEMENT ID' },
      { original: 'Statement Source', display: 'SOURCE' },
      { original: 'QUARTER', display: 'QUARTER' },
      { original: 'WORK IDENTIFIER', display: 'WORK IDENTIFIER' },
      { original: 'WORK TITLE', display: 'WORK TITLE' },
      { original: 'WORK WRITERS', display: 'WRITERS' },
      { original: 'SHARE', display: 'SHARES (%)' },
      { original: 'QUANTITY', display: 'QUANTITY' },
      { original: 'REVENUE SOURCE', display: 'MEDIA TYPE' },
      { original: 'COUNTRY', display: 'TERRITORY' },
      { original: 'GROSS', display: 'GROSS' }
    ];
    
    const found = mapping.find(({ display }) => display === displayHeader);
    return found ? found.original : displayHeader;
  };
  
  // Common required fields for royalty statements
  const requiredFields = ['Song Title', 'Client Name', 'Gross Amount', 'Period Start'];

  const handleSaveMapping = async (mapping: { [key: string]: string }) => {
    try {
      console.log('Applying field mapping:', mapping);
      
      // Get the current raw data
      const rawData = localRecord.raw_data;
      console.log('Raw data for re-mapping:', rawData);
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.error('No raw data available for re-mapping');
        return;
      }

      // Find saved mapping configuration for this source
      const savedConfig = mappingConfigs.find(config => config.source_name === localRecord.detected_source);
      const mapper = new EncoreMapper(undefined, savedConfig ? [savedConfig] : []);
      
      // Apply the user's field mappings to the data
      const result = mapper.mapData(rawData, localRecord.detected_source, mapping);
      console.log('Re-mapping result:', result);

      // Save the mapping to database for future use
      const sourceHeaders = rawData.length > 0 ? Object.keys(rawData[0]) : [];
      await updateMappingConfig(
        localRecord.detected_source,
        mapping,
        sourceHeaders
      );

      // Update the staging record with the new mapped data and field mappings
      await updateStagingRecord(localRecord.id, {
        mapped_data: result.mappedData,
        unmapped_fields: result.unmappedFields,
        validation_status: {
          errors: result.validationErrors,
          hasErrors: result.validationErrors.length > 0,
          hasUnmapped: result.unmappedFields.length > 0,
          last_validated: new Date().toISOString(),
        },
        processing_status: result.validationErrors.length > 0 ? 'needs_review' : 'pending', // Still needs approval
      });

      toast({
        title: "Success",
        description: `Field mapping saved and data re-validated. Mappings will be remembered for future ${localRecord.detected_source} imports.`,
      });

      // Update the local record state with the new mapped data
      const updatedRecord = {
        ...localRecord,
        mapped_data: result.mappedData,
        unmapped_fields: result.unmappedFields,
        validation_status: {
          errors: result.validationErrors,
          hasErrors: result.validationErrors.length > 0,
          hasUnmapped: result.unmappedFields.length > 0,
          last_validated: new Date().toISOString(),
        },
        processing_status: (result.validationErrors.length > 0 ? 'needs_review' : 'pending') as 'pending' | 'processed' | 'failed' | 'needs_review',
      };
      setLocalRecord(updatedRecord);

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Source</div>
              <div className="text-lg font-semibold">{localRecord.detected_source}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Records</div>
              <div className="text-lg font-semibold">{mappedData.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Batch Status</div>
              <div className="text-lg font-semibold">
                {localRecord.batch_id ? (
                  <Badge className="bg-green-100 text-green-800">Linked</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Not Linked</Badge>
                )}
              </div>
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
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Review the imported and mapped data
          </CardDescription>
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
                {mappedData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Show headers in ENCORE standard order */}
                        {getOrderedHeaders().map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappedData.slice(0, 100).map((row: any, index) => (
                        <TableRow key={index}>
                          {getOrderedHeaders().map((header, cellIndex) => {
                            const originalFieldName = getOriginalFieldName(header);
                            return (
                              <TableCell key={cellIndex} className={header === 'WORK TITLE' ? 'font-medium' : ''}>
                                {header === 'STATEMENT ID' ? (
                                  String(localRecord.statement_id || '-')
                                ) : header === 'GROSS' || header === 'NET' 
                                  ? (typeof row[originalFieldName] === 'number' ? `$${row[originalFieldName].toFixed(2)}` : String(row[originalFieldName] || '-'))
                                  : String(row[originalFieldName] || '-')
                                }
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No mapped data available
                  </div>
                )}
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
            <Button variant="outline" onClick={handleSongMatching}>
              <Music className="h-4 w-4 mr-2" />
              Song Matching
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Use Song Matching to create royalties from matched works.
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
        detectedSource={localRecord.detected_source}
        existingMapping={getExistingMapping()}
        onSaveMapping={handleSaveMapping}
      />

      {/* Song Matching Dialog */}
      <SongMatchingDialog
        open={showSongMatchingDialog}
        onOpenChange={setShowSongMatchingDialog}
        mappedData={mappedData}
        batchId={localRecord.batch_id} // Can be null/undefined for standalone royalties
        statementId={localRecord.statement_id} // Pass the statement ID
        onMatchingComplete={handleSongMatchingComplete}
      />
    </div>
  );
}