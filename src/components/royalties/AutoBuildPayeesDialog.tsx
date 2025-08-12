import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePayeeHierarchy } from "@/hooks/usePayeeHierarchy";

interface AutoBuildPayeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function AutoBuildPayeesDialog({ open, onOpenChange, onCompleted }: AutoBuildPayeesDialogProps) {
  const { agreements, fetchAgreements, autoGenerateOriginalPublisher, createWriter, createPayee } = usePayeeHierarchy();
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
      // 1) Get commission percentage for default split fallback
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, commission_percentage, counterparty_name')
        .eq('id', selectedAgreement)
        .maybeSingle();
      if (contractError) throw contractError;

      const commission = contract?.commission_percentage || 0;
      const defaultSplit = Math.max(0, 100 - commission);

      // 2) Ensure an Original Publisher exists for this agreement
      let publisherId: string | null = null;
      const { data: pubs, error: pubsError } = await supabase
        .from('original_publishers')
        .select('id')
        .eq('agreement_id', selectedAgreement)
        .order('created_at', { ascending: true });
      if (pubsError) throw pubsError;

      if (pubs && pubs.length > 0) {
        publisherId = pubs[0].id;
      } else {
        const createdPublisher = await autoGenerateOriginalPublisher(selectedAgreement);
        // autoGenerateOriginalPublisher may return null on duplicate race; re-fetch to be safe
        if (!createdPublisher) {
          const { data: pubs2 } = await supabase
            .from('original_publishers')
            .select('id')
            .eq('agreement_id', selectedAgreement)
            .order('created_at', { ascending: true });
          publisherId = pubs2 && pubs2.length > 0 ? pubs2[0].id : null;
        } else {
          publisherId = createdPublisher.id;
        }
      }

      if (!publisherId) {
        throw new Error('Unable to determine or create an original publisher for this agreement.');
      }

      // 3) Fetch writer parties from the contract
      const { data: parties, error: partiesError } = await supabase
        .from('contract_interested_parties')
        .select('*')
        .eq('contract_id', selectedAgreement)
        .eq('party_type', 'writer');
      if (partiesError) throw partiesError;

      if (!parties || parties.length === 0) {
        toast({ title: 'No writer parties found', description: 'This agreement has no writer parties to build payees from.' });
        return;
      }

      let created = 0;
      let existing = 0;
      let errors = 0;

      for (const party of parties) {
        const writerName = party.name?.trim();
        if (!writerName) continue;

        // 3a) Find or create writer under publisher
        let writerId: string | null = null;
        const { data: existingWriter } = await supabase
          .from('writers')
          .select('id')
          .eq('original_publisher_id', publisherId)
          .eq('writer_name', writerName)
          .maybeSingle();

        if (existingWriter?.id) {
          writerId = existingWriter.id;
        } else {
          const newWriter = await createWriter({ writer_name: writerName, contact_info: {}, original_publisher_id: publisherId });
          writerId = newWriter?.id || null;
        }

        if (!writerId) { errors++; continue; }

        // 3b) Check if a payee already exists for this writer
        const { data: existingPayee } = await supabase
          .from('payees')
          .select('id')
          .eq('writer_id', writerId)
          .maybeSingle();

        if (existingPayee?.id) {
          existing++;
          continue;
        }

        // 3c) Determine splits from party or use default
        const performance = (party.performance_percentage ?? defaultSplit) as number;
        const mechanical = (party.mechanical_percentage ?? defaultSplit) as number;
        const sync = (party.synch_percentage ?? defaultSplit) as number;

        // 3d) Build contact info from party fields when available
        const contactInfo: any = {
          email: party.email || undefined,
          phone: party.phone || undefined,
          address: party.address || undefined,
          tax_id: party.tax_id || undefined,
        };

        const paymentInfo = {
          default_splits: {
            performance,
            mechanical,
            synchronization: sync,
          },
          payment_settings: {
            threshold: 100,
            frequency: 'quarterly',
          },
        };

        const createdPayee = await createPayee({
          payee_name: writerName,
          payee_type: 'writer',
          contact_info: contactInfo,
          payment_info: paymentInfo,
          writer_id: writerId,
          is_primary: false,
        });

        if (createdPayee?.id) created++; else errors++;
      }

      setSummary({ created, existing, errors });
      toast({ title: 'Auto-build complete', description: `Created ${created}, existing ${existing}, errors ${errors}` });
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
