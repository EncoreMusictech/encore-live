import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { useImportToAllocations } from "@/hooks/useImportToAllocations";
import { RoyaltiesImportStaging } from "@/hooks/useRoyaltiesImport";
interface ImportToAllocationsButtonProps {
  stagingRecord: RoyaltiesImportStaging;
  onComplete?: () => void;
}
export function ImportToAllocationsButton({
  stagingRecord,
  onComplete
}: ImportToAllocationsButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const {
    importToAllocations,
    loading
  } = useImportToAllocations();
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
    setSelectedRows(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
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

  // Determine if song matching is complete
  const isComplete = stagingRecord.processing_status === 'processed';
  return <div className="flex items-center gap-2">
      
      <Badge variant={isComplete ? "default" : "secondary"} className="gap-1">
        {isComplete ? <>
            <CheckCircle className="h-3 w-3" />
            Complete
          </> : <>
            <XCircle className="h-3 w-3" />
            Incomplete
          </>}
      </Badge>
    </div>;
}