import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReconciliationBatches, ReconciliationBatch } from "@/hooks/useReconciliationBatches";

interface ProcessBatchDialogProps {
  batch: ReconciliationBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessBatchDialog({ batch, open, onOpenChange }: ProcessBatchDialogProps) {
  const { processBatch } = useReconciliationBatches();
  
  // Get current quarter and year as defaults
  const currentDate = new Date();
  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
  const currentYear = currentDate.getFullYear();
  
  const [selectedQuarter, setSelectedQuarter] = useState<string>(`Q${currentQuarter}`);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [processing, setProcessing] = useState(false);

  // Generate year options (current year and future years only)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const handleProcess = async () => {
    if (!batch) return;
    
    setProcessing(true);
    try {
      const quarter = parseInt(selectedQuarter.replace('Q', ''));
      const year = parseInt(selectedYear);
      
      // Call processBatch with the selected period
      const success = await processBatch(batch.id, quarter, year);
      
      if (success) {
        onOpenChange(false);
        // Reset to current period for next time
        setSelectedQuarter(`Q${currentQuarter}`);
        setSelectedYear(currentYear.toString());
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!processing) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset to current period when closing
        setSelectedQuarter(`Q${currentQuarter}`);
        setSelectedYear(currentYear.toString());
      }
    }
  };

  if (!batch) return null;

  const royaltyAmount = batch.allocated_amount || 0;
  const totalAmount = batch.total_gross_amount || 0;
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Batch to Payouts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Batch Information</Label>
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <div className="flex justify-between text-sm">
                <span>Batch ID:</span>
                <span className="font-medium">{batch.batch_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-medium">${totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Royalty Amount:</span>
                <span className="font-medium">${royaltyAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Processing Period</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quarter" className="text-xs text-muted-foreground">Quarter</Label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger id="quarter">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year" className="text-xs text-muted-foreground">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              <strong>Note:</strong> Processing to {selectedQuarter} {selectedYear}. 
              {parseInt(selectedYear) === currentYear && selectedQuarter === `Q${currentQuarter}` 
                ? " (Current period)" 
                : " Batches are only processed to current or future periods."}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProcess}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? "Processing..." : "Process to Payouts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}