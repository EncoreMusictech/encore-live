import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "@/hooks/use-toast";

interface PayeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayeeFormDialog({ open, onOpenChange }: PayeeFormDialogProps) {
  const { createContact } = useContacts();
  const [loading, setLoading] = useState(false);
  
  // Payee Setup Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact_type: "writer",
    tax_id: "",
  });

  // Earnings Split Setup State
  const [splitData, setSplitData] = useState({
    default_performance_share: 0,
    default_mechanical_share: 0,
    default_sync_share: 0,
    payment_threshold: 100,
    payment_frequency: "quarterly",
  });

  const handlePayeeFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSplitFormChange = (field: string, value: string | number) => {
    setSplitData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Payee name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const paymentInfo = {
        default_splits: {
          performance: splitData.default_performance_share,
          mechanical: splitData.default_mechanical_share,
          synchronization: splitData.default_sync_share,
        },
        payment_settings: {
          threshold: splitData.payment_threshold,
          frequency: splitData.payment_frequency,
        },
      };

      await createContact({
        ...formData,
        payment_info: paymentInfo,
      });

      toast({
        title: "Success",
        description: "Payee added successfully",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_type: "writer",
        tax_id: "",
      });
      setSplitData({
        default_performance_share: 0,
        default_mechanical_share: 0,
        default_sync_share: 0,
        payment_threshold: 100,
        payment_frequency: "quarterly",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating payee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Payee</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="payee-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payee-setup">Payee Setup</TabsTrigger>
            <TabsTrigger value="earnings-split">Earnings Split Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="payee-setup" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handlePayeeFormChange("name", e.target.value)}
                  placeholder="Enter payee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_type">Type</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(value) => handlePayeeFormChange("contact_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writer">Writer</SelectItem>
                    <SelectItem value="publisher">Publisher</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handlePayeeFormChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePayeeFormChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handlePayeeFormChange("address", e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / SSN</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handlePayeeFormChange("tax_id", e.target.value)}
                placeholder="Enter tax identification number"
              />
            </div>
          </TabsContent>

          <TabsContent value="earnings-split" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Default Royalty Splits (%)</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="performance_share">Performance</Label>
                  <Input
                    id="performance_share"
                    type="number"
                    min="0"
                    max="100"
                    value={splitData.default_performance_share}
                    onChange={(e) => handleSplitFormChange("default_performance_share", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mechanical_share">Mechanical</Label>
                  <Input
                    id="mechanical_share"
                    type="number"
                    min="0"
                    max="100"
                    value={splitData.default_mechanical_share}
                    onChange={(e) => handleSplitFormChange("default_mechanical_share", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync_share">Synchronization</Label>
                  <Input
                    id="sync_share"
                    type="number"
                    min="0"
                    max="100"
                    value={splitData.default_sync_share}
                    onChange={(e) => handleSplitFormChange("default_sync_share", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Total: {splitData.default_performance_share + splitData.default_mechanical_share + splitData.default_sync_share}%
                {(splitData.default_performance_share + splitData.default_mechanical_share + splitData.default_sync_share) > 100 && (
                  <span className="text-destructive ml-2">Exceeds 100%</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Payment Settings</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_threshold">Payment Threshold ($)</Label>
                  <Input
                    id="payment_threshold"
                    type="number"
                    min="0"
                    value={splitData.payment_threshold}
                    onChange={(e) => handleSplitFormChange("payment_threshold", parseFloat(e.target.value) || 0)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_frequency">Payment Frequency</Label>
                  <Select
                    value={splitData.payment_frequency}
                    onValueChange={(value) => handleSplitFormChange("payment_frequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Payee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}