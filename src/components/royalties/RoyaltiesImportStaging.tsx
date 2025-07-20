import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Eye, Trash2, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { RoyaltiesImportUpload } from "./RoyaltiesImportUpload";
import { RoyaltiesImportPreview } from "./RoyaltiesImportPreview";
import { ImportToAllocationsButton } from "./ImportToAllocationsButton";
interface RoyaltiesImportStagingProps {
  // No batchId prop needed - imports are not tied to batches during upload
}
export function RoyaltiesImportStaging({}: RoyaltiesImportStagingProps) {
  const {
    stagingRecords,
    loading,
    deleteStagingRecord,
    refreshRecords
  } = useRoyaltiesImport();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    recordId: string;
    filename: string;
    royaltyCount: number;
    proceedWithDeletion: () => Promise<void>;
  } | null>(null);

  const handleDeleteClick = async (record: any) => {
    try {
      const result = await deleteStagingRecord(record.id);
      if (result) {
        setDeleteConfirmation({
          recordId: record.id,
          filename: record.original_filename,
          royaltyCount: result.royaltyCount,
          proceedWithDeletion: result.proceedWithDeletion,
        });
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleConfirmDelete = async () => {
    console.log('handleConfirmDelete called with:', deleteConfirmation);
    if (deleteConfirmation) {
      try {
        console.log('Starting deletion process...');
        await deleteConfirmation.proceedWithDeletion();
        console.log('Deletion completed successfully');
        setDeleteConfirmation(null);
        refreshRecords(); // Force refresh the records list
      } catch (error) {
        console.error('Error in handleConfirmDelete:', error);
        // Error is already handled in the hook
      }
    }
  };

  const downloadEncoreTemplate = () => {
    const headers = [
      'SOURCE',
      'QUARTER',
      'WORK IDENTIFIER',
      'WORK TITLE',
      'WRITERS',
      'SHARES (%)',
      'QUANTITY',
      'MEDIA TYPE',
      'TERRITORY',
      'GROSS'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'encore-statement-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'needs_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
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
  if (selectedRecord) {
    const record = stagingRecords.find(r => r.id === selectedRecord);
    if (record) {
      return <RoyaltiesImportPreview record={record} onBack={() => setSelectedRecord(null)} />;
    }
  }
  if (showUpload) {
    return <RoyaltiesImportUpload onComplete={() => setShowUpload(false)} onCancel={() => setShowUpload(false)} />;
  }
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Statement Import</CardTitle>
            <CardDescription>
              Manage imported royalty statements and review mapping results
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={downloadEncoreTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button onClick={() => setShowUpload(true)}>
              Import Statement
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-center py-8">Loading imports...</div> : stagingRecords.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            No imported statements found. Click "Import Statement" to get started.
          </div> : <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statement ID</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Song Matching</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagingRecords.map(record => <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {record.statement_id}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {record.original_filename}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.detected_source}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.processing_status)}
                        <Badge className={getStatusColor(record.processing_status)}>
                          {record.processing_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(record.mapped_data) ? record.mapped_data.length : 0}
                    </TableCell>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ImportToAllocationsButton stagingRecord={record} onComplete={refreshRecords} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(record)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Statement</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation && (
                <>
                  Are you sure you want to delete the statement "{deleteConfirmation.filename}"?
                  {deleteConfirmation.royaltyCount > 0 && (
                    <>
                      <br /><br />
                      <strong className="text-destructive">
                        Warning: This will also delete {deleteConfirmation.royaltyCount} related royalty allocation{deleteConfirmation.royaltyCount !== 1 ? 's' : ''} from the allocation table.
                      </strong>
                    </>
                  )}
                  <br /><br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConfirmation?.royaltyCount === 0 
                ? 'Delete Statement' 
                : `Delete Statement and ${deleteConfirmation?.royaltyCount} Royalties`
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
  }