import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, X, DollarSign, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PayeeBalance {
  id: string;
  payee_name: string;
  payee_type: string;
  beginning_balance: number;
  beginning_balance_as_of_date: string | null;
  beginning_balance_notes: string | null;
}

interface BeginningBalancesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payees: any[];
}

export function BeginningBalancesDialog({ open, onOpenChange, payees }: BeginningBalancesDialogProps) {
  const [balances, setBalances] = useState<PayeeBalance[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize balances from payees when dialog opens
  useEffect(() => {
    if (open && payees.length > 0) {
      setBalances(
        payees.map((p) => ({
          id: p.id,
          payee_name: p.payee_name || "Unknown",
          payee_type: p.payee_type || "writer",
          beginning_balance: p.beginning_balance ?? 0,
          beginning_balance_as_of_date: p.beginning_balance_as_of_date || null,
          beginning_balance_notes: p.beginning_balance_notes || null,
        }))
      );
      setHasChanges(false);
    }
  }, [open, payees]);

  const updateBalance = (id: string, field: keyof PayeeBalance, value: any) => {
    setBalances((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each payee's beginning balance
      const updates = balances.map((b) => ({
        id: b.id,
        beginning_balance: b.beginning_balance,
        beginning_balance_as_of_date: b.beginning_balance_as_of_date,
        beginning_balance_notes: b.beginning_balance_notes,
      }));

      let errorCount = 0;
      for (const update of updates) {
        const { error } = await supabase
          .from("payees")
          .update({
            beginning_balance: update.beginning_balance,
            beginning_balance_as_of_date: update.beginning_balance_as_of_date,
            beginning_balance_notes: update.beginning_balance_notes,
          })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating payee:", error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Updated beginning balances for ${updates.length} payees`,
        });
        setHasChanges(false);
        onOpenChange(false);
      } else {
        toast({
          title: "Partial Success",
          description: `Updated ${updates.length - errorCount} payees. ${errorCount} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving beginning balances:", error);
      toast({
        title: "Error",
        description: "Failed to save beginning balances",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const totalBalance = balances.reduce((sum, b) => sum + (b.beginning_balance || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manage Beginning Balances
          </DialogTitle>
          <DialogDescription>
            Set the starting account balance for each payee. These balances will be used as the
            opening balance for the first quarterly report.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {balances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payees found. Create payees first to set beginning balances.
              </div>
            ) : (
              balances.map((balance, index) => (
                <div key={balance.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{balance.payee_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {balance.payee_type}
                        </Badge>
                      </div>
                      {balance.beginning_balance !== 0 && (
                        <span
                          className={`text-sm font-medium ${
                            balance.beginning_balance >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(balance.beginning_balance)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Beginning Balance
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={balance.beginning_balance}
                          onChange={(e) =>
                            updateBalance(balance.id, "beginning_balance", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          As-of Date
                        </Label>
                        <Input
                          type="date"
                          value={balance.beginning_balance_as_of_date || ""}
                          onChange={(e) =>
                            updateBalance(balance.id, "beginning_balance_as_of_date", e.target.value || null)
                          }
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Notes
                        </Label>
                        <Input
                          value={balance.beginning_balance_notes || ""}
                          onChange={(e) =>
                            updateBalance(balance.id, "beginning_balance_notes", e.target.value || null)
                          }
                          placeholder="e.g., Migrated from legacy system"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {balances.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Total Beginning Balance:{" "}
              <span className={`font-semibold ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
