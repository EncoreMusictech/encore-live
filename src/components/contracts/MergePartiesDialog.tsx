import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface Party {
  id: string;
  name: string;
  dba_alias?: string | null;
  party_type: string;
  controlled_status: string;
  performance_percentage?: number | null;
  mechanical_percentage?: number | null;
  synch_percentage?: number | null;
  ipi_number?: string | null;
  affiliation?: string | null;
}

interface MergePartiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parties: Party[];
  onConfirm: (primaryId: string, secondaryIds: string[]) => Promise<void>;
}

export function MergePartiesDialog({ open, onOpenChange, parties, onConfirm }: MergePartiesDialogProps) {
  const [selectedPrimary, setSelectedPrimary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedPrimary) return;
    setLoading(true);
    try {
      const secondaryIds = parties.filter(p => p.id !== selectedPrimary).map(p => p.id);
      await onConfirm(selectedPrimary, secondaryIds);
      onOpenChange(false);
      setSelectedPrimary("");
    } finally {
      setLoading(false);
    }
  };

  const primaryParty = parties.find(p => p.id === selectedPrimary);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Interested Parties</DialogTitle>
          <DialogDescription>
            Select the primary party whose splits will be used for all royalty calculations. Secondary parties will be linked but retained.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The primary party's percentages will be adopted for downstream royalty calculations. 
            Secondary parties are not deleted — they are linked to the primary and can be unmerged later.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose Primary Party</Label>
          <RadioGroup value={selectedPrimary} onValueChange={setSelectedPrimary}>
            {parties.map((party) => (
              <Card key={party.id} className={`cursor-pointer transition-colors ${selectedPrimary === party.id ? 'border-primary ring-1 ring-primary' : ''}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={party.id} id={party.id} className="mt-1" />
                    <Label htmlFor={party.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{party.name}</span>
                        {party.dba_alias && (
                          <span className="text-sm text-muted-foreground">({party.dba_alias})</span>
                        )}
                        <Badge variant={party.controlled_status === 'C' ? 'default' : 'secondary'} className="text-xs">
                          {party.controlled_status === 'C' ? 'Controlled' : 'NC'}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Perf: {party.performance_percentage ?? 0}%</span>
                        <span>Mech: {party.mechanical_percentage ?? 0}%</span>
                        <span>Sync: {party.synch_percentage ?? 0}%</span>
                        {party.ipi_number && <span>IPI: {party.ipi_number}</span>}
                        {party.affiliation && <span>PRO: {party.affiliation}</span>}
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </div>

        {primaryParty && (
          <Card className="bg-muted/50">
            <CardContent className="py-3 text-sm">
              <p className="font-medium mb-1">Preview after merge:</p>
              <p>Primary: <strong>{primaryParty.name}</strong> — splits ({primaryParty.performance_percentage ?? 0}% / {primaryParty.mechanical_percentage ?? 0}% / {primaryParty.synch_percentage ?? 0}%) will be used for royalty calculations.</p>
              <p className="text-muted-foreground mt-1">
                {parties.length - 1} secondary {parties.length - 1 === 1 ? 'party' : 'parties'} will be linked and hidden from royalty processing.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !selectedPrimary}>
            {loading ? 'Merging…' : 'Merge Parties'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
