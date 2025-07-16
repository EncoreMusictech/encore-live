import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Music, DollarSign } from "lucide-react";
import { useImportToAllocations } from "@/hooks/useImportToAllocations";
import { RoyaltiesImportStaging } from "@/hooks/useRoyaltiesImport";

interface ImportToAllocationsButtonProps {
  stagingRecord: RoyaltiesImportStaging;
  onComplete?: () => void;
}

export function ImportToAllocationsButton({ stagingRecord, onComplete }: ImportToAllocationsButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const { importToAllocations, loading } = useImportToAllocations();

  const mappedData = Array.isArray(stagingRecord.mapped_data) ? stagingRecord.mapped_data : [];

  const handleImport = async () => {
    const result = await importToAllocations({
      stagingRecordId: stagingRecord.id,
      selectedRows: selectedRows.length > 0 ? selectedRows : undefined
    });

    if (result) {
      setOpen(false);
      onComplete?.();
    }
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === mappedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(mappedData.map((_, index) => index));
    }
  };

  const formatCurrency = (value: any) => {
    const num = parseFloat(value || 0);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString()}`;
  };

  if (stagingRecord.processing_status === 'processed') {
    return (
      <Badge variant="default" className="gap-1">
        <Music className="h-3 w-3" />
        Already Imported
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Import to Allocations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Royalties to Allocations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">{stagingRecord.detected_source}</Badge>
              <span className="text-sm text-muted-foreground">
                {mappedData.length} rows available
              </span>
              {selectedRows.length > 0 && (
                <Badge variant="default">
                  {selectedRows.length} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedRows.length === mappedData.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Import {selectedRows.length > 0 ? `${selectedRows.length} ` : ''}Rows
              </Button>
            </div>
          </div>

          <div className="border rounded-md max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === mappedData.length && mappedData.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Song Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedData.map((row: any, index: number) => (
                  <TableRow 
                    key={index}
                    className={selectedRows.includes(index) ? "bg-accent" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(index)}
                        onCheckedChange={() => toggleRowSelection(index)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        {row.song_title || row.work_title || 'Unknown Title'}
                      </div>
                    </TableCell>
                    <TableCell>{row.artist || row.performer || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(row.gross_amount || row.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.territory && (
                        <Badge variant="outline" className="text-xs">
                          {row.territory}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.period_start && row.period_end ? 
                        `${row.period_start} - ${row.period_end}` : 
                        row.period || 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {mappedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No mapped data available for import.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}