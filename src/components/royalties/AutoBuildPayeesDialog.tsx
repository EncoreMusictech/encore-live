import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { usePayeeHierarchy } from "@/hooks/usePayeeHierarchy";

interface AutoBuildPayeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function AutoBuildPayeesDialog({ open, onOpenChange, onCompleted }: AutoBuildPayeesDialogProps) {
  const { agreements, fetchAgreements, buildPayeesFromAgreement } = usePayeeHierarchy();
  const [selectedAgreement, setSelectedAgreement] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ created: number; existing: number; errors: number } | null>(null);

  useEffect(() => {
    if (open) {
      fetchAgreements();
      setSummary(null);
      setSelectedAgreement("");
    }
  }, [open]);

  const handleBuild = async () => {
    if (!selectedAgreement) {
      toast({ title: "Select an agreement", description: "Please choose an agreement to build payees from.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await buildPayeesFromAgreement(selectedAgreement);
      setSummary(result);

      if (result.created === 0 && result.existing === 0 && result.errors === 0) {
        toast({ title: 'No writer parties found', description: 'This agreement has no primary writer parties to build payees from.' });
      } else {
        toast({ title: 'Auto-build complete', description: `Created ${result.created}, existing ${result.existing}, errors ${result.errors}` });
      }
      onCompleted?.();
    } catch (e: any) {
      console.error('Auto-build payees error:', e);
      toast({ title: 'Failed to build payees', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Build Payees from Agreement</DialogTitle>
          <DialogDescription>Select an agreement to auto-create writer payees and default splits.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Agreement</Label>
            <Select value={selectedAgreement} onValueChange={setSelectedAgreement}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agreement" />
              </SelectTrigger>
              <SelectContent>
                {agreements.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.agreement_id ? `${a.agreement_id} — ${a.title}` : a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {summary && (
            <Card>
              <CardContent className="py-3 text-sm">
                <div>Created: {summary.created}</div>
                <div>Already existed: {summary.existing}</div>
                <div>Errors: {summary.errors}</div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleBuild} disabled={loading || !selectedAgreement}>
              {loading ? 'Building…' : 'Build Payees'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
