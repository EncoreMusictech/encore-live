import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePayeeHierarchy } from "@/hooks/usePayeeHierarchy";
import { useContracts } from "@/hooks/useContracts";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface PayeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPayee?: any; // PayeeWithHierarchy from PayeesTable
}

export function PayeeFormDialog({ open, onOpenChange, editingPayee }: PayeeFormDialogProps) {
  const {
    agreements,
    originalPublishers,
    writers,
    createPayee,
    updatePayee,
    fetchOriginalPublishers,
    fetchWriters,
    autoGenerateOriginalPublisher,
  } = usePayeeHierarchy();
  
  const { createContract } = useContracts();

  const [loading, setLoading] = useState(false);
  
  // Hierarchy Selection State
  const [selectedAgreement, setSelectedAgreement] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  
  // Manual Contract Creation State
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [contractData, setContractData] = useState({
    title: "",
    counterparty_name: "",
    contract_type: "publishing" as const,
  });

  // Payee Setup Form State
  const [payeeData, setPayeeData] = useState({
    payee_name: "",
    payee_type: "writer",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    is_primary: false,
  });

  // Earnings Split Setup State
  const [splitData, setSplitData] = useState({
    default_performance_share: 0,
    default_mechanical_share: 0,
    default_sync_share: 0,
    payment_threshold: 100,
    payment_frequency: "quarterly",
  });

  // Handle hierarchy changes with useCallback to prevent render loops
  useEffect(() => {
    if (selectedAgreement) {
      fetchOriginalPublishers(selectedAgreement);
      setSelectedPublisher("");
      setSelectedWriter("");
    }
  }, [selectedAgreement]); // Remove fetchOriginalPublishers from dependencies

  // Auto-select publisher when only one exists
  useEffect(() => {
    if (originalPublishers.length === 1 && !selectedPublisher && selectedAgreement) {
      setSelectedPublisher(originalPublishers[0].id);
    }
  }, [originalPublishers.length, selectedAgreement]); // Optimize dependencies

  useEffect(() => {
    if (selectedPublisher) {
      fetchWriters(selectedPublisher);
      setSelectedWriter("");
    }
  }, [selectedPublisher]); // Remove fetchWriters from dependencies

  // Auto-select writer when only one exists
  useEffect(() => {
    if (writers.length === 1 && !selectedWriter && selectedPublisher) {
      setSelectedWriter(writers[0].id);
    }
  }, [writers.length, selectedPublisher]); // Optimize dependencies

  // Auto-populate royalty splits when agreement is selected (only for new payees)
  useEffect(() => {
    if (selectedAgreement && !editingPayee && open) {
      fetchAgreementRoyaltySplits(selectedAgreement);
    }
  }, [selectedAgreement, editingPayee, open]);

  // Function to fetch and auto-populate royalty splits from agreement
  const fetchAgreementRoyaltySplits = async (agreementId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_interested_parties')
        .select('performance_percentage, mechanical_percentage, synch_percentage')
        .eq('contract_id', agreementId)
        .limit(1)
        .single();

      if (error) {
        console.log('No royalty splits found for this agreement, keeping manual entry');
        return;
      }

      if (data) {
        // Only auto-populate if there are actual values (not 0)
        const hasRoyaltySplits = data.performance_percentage > 0 || 
                                data.mechanical_percentage > 0 || 
                                data.synch_percentage > 0;

        if (hasRoyaltySplits) {
          setSplitData(prev => ({
            ...prev,
            default_performance_share: data.performance_percentage || 0,
            default_mechanical_share: data.mechanical_percentage || 0,
            default_sync_share: data.synch_percentage || 0,
          }));

          toast({
            title: "Royalty Splits Auto-Populated",
            description: "Default royalty splits have been loaded from the agreement.",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching agreement royalty splits:', error);
    }
  };

  // Initialize form data when editing
  useEffect(() => {
    if (editingPayee && open) {
      // Extract hierarchy IDs from the editing payee
      const agreementId = editingPayee.writer?.original_publisher?.agreement?.id;
      const publisherId = editingPayee.writer?.original_publisher?.id;
      const writerId = editingPayee.writer?.id;
      
      console.log('Editing payee hierarchy:', { agreementId, publisherId, writerId });
      
      // Initialize hierarchy selections
      if (agreementId) {
        setSelectedAgreement(agreementId);
        // Fetch original publishers for this agreement
        fetchOriginalPublishers(agreementId);
      }
      if (publisherId) {
        setSelectedPublisher(publisherId);
        // Fetch writers for this publisher
        fetchWriters(publisherId);
      }
      if (writerId) {
        setSelectedWriter(writerId);
      }
      
      // Set payee data
      setPayeeData({
        payee_name: editingPayee.payee_name || "",
        payee_type: editingPayee.payee_type || "writer",
        email: editingPayee.contact_info?.email || "",
        phone: editingPayee.contact_info?.phone || "",
        address: editingPayee.contact_info?.address || "",
        tax_id: editingPayee.contact_info?.tax_id || "",
        is_primary: editingPayee.is_primary || false,
      });
      
      // Set split data
      const paymentInfo = editingPayee.payment_info || {};
      const defaultSplits = paymentInfo.default_splits || {};
      const paymentSettings = paymentInfo.payment_settings || {};
      
      setSplitData({
        default_performance_share: defaultSplits.performance || 0,
        default_mechanical_share: defaultSplits.mechanical || 0,
        default_sync_share: defaultSplits.synchronization || 0,
        payment_threshold: paymentSettings.threshold || 100,
        payment_frequency: paymentSettings.frequency || "quarterly",
      });
    } else if (!editingPayee && open) {
      // Reset form for new payee
      setSelectedAgreement("");
      setSelectedPublisher("");
      setSelectedWriter("");
      setShowCreateContract(false);
      setContractData({
        title: "",
        counterparty_name: "",
        contract_type: "publishing" as const,
      });
      setPayeeData({
        payee_name: "",
        payee_type: "writer",
        email: "",
        phone: "",
        address: "",
        tax_id: "",
        is_primary: false,
      });
      setSplitData({
        default_performance_share: 0,
        default_mechanical_share: 0,
        default_sync_share: 0,
        payment_threshold: 100,
        payment_frequency: "quarterly",
      });
    }
  }, [editingPayee, open]);

  const handlePayeeFormChange = (field: string, value: string | boolean) => {
    setPayeeData(prev => ({ ...prev, [field]: value }));
  };

  const handleSplitFormChange = (field: string, value: string | number) => {
    setSplitData(prev => ({ ...prev, [field]: value }));
  };

  const handleContractDataChange = (field: string, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateContract = async () => {
    if (!contractData.title.trim() || !contractData.counterparty_name.trim()) {
      toast({
        title: "Error",
        description: "Contract title and counterparty name are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newContract = await createContract({
        title: contractData.title,
        counterparty_name: contractData.counterparty_name,
        contract_type: contractData.contract_type,
        contract_status: "draft" as const,
      });

      if (newContract) {
        setSelectedAgreement(newContract.id);
        setShowCreateContract(false);
        // Reset contract form
        setContractData({
          title: "",
          counterparty_name: "",
          contract_type: "publishing" as const,
        });
        
        toast({
          title: "Success",
          description: "Contract created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!payeeData.payee_name.trim()) {
      toast({
        title: "Error",
        description: "Payee name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWriter) {
      toast({
        title: "Error",
        description: "Please select a writer for this payee",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contactInfo = {
        email: payeeData.email,
        phone: payeeData.phone,
        address: payeeData.address,
        tax_id: payeeData.tax_id,
      };

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

      if (editingPayee) {
        // Update existing payee
        await updatePayee(editingPayee.id, {
          payee_name: payeeData.payee_name,
          payee_type: payeeData.payee_type,
          contact_info: contactInfo,
          payment_info: paymentInfo,
          writer_id: selectedWriter,
          is_primary: payeeData.is_primary,
        });
      } else {
        // Create new payee
        await createPayee({
          payee_name: payeeData.payee_name,
          payee_type: payeeData.payee_type,
          contact_info: contactInfo,
          payment_info: paymentInfo,
          writer_id: selectedWriter,
          is_primary: payeeData.is_primary,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating payee:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected hierarchy items
  const selectedAgreementData = agreements.find(a => a.id === selectedAgreement);
  const selectedPublisherData = originalPublishers.find(p => p.id === selectedPublisher);
  const selectedWriterData = writers.find(w => w.id === selectedWriter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPayee ? "Edit Payee" : "Add New Payee"}</DialogTitle>
          <DialogDescription>
            {editingPayee 
              ? "Update the payee's information and earnings splits."
              : "Set up a new payee by selecting the hierarchy path and configuring their information and earnings splits."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="payee-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payee-setup">Payee Setup</TabsTrigger>
            <TabsTrigger value="earnings-split">Earnings Split Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="payee-setup" className="space-y-6">
            {/* Hierarchy Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Hierarchy</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Agreement → Original Publisher → Writer → Payee
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agreement Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agreement">Agreement (AGR#) *</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateContract(true)}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create New
                    </Button>
                  </div>
                  <Select value={selectedAgreement} onValueChange={setSelectedAgreement}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agreement" />
                    </SelectTrigger>
                    <SelectContent>
                      {agreements.map((agreement) => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{agreement.agreement_id}</Badge>
                            <span>{agreement.title}</span>
                            <span className="text-muted-foreground">({agreement.counterparty_name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manual Contract Creation */}
                {showCreateContract && (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Create New Contract</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="contract_title" className="text-sm">Contract Title *</Label>
                          <Input
                            id="contract_title"
                            value={contractData.title}
                            onChange={(e) => handleContractDataChange("title", e.target.value)}
                            placeholder="e.g., Publishing Agreement"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="counterparty_name" className="text-sm">Counterparty Name *</Label>
                          <Input
                            id="counterparty_name"
                            value={contractData.counterparty_name}
                            onChange={(e) => handleContractDataChange("counterparty_name", e.target.value)}
                            placeholder="e.g., ABC Music Publishing"
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="contract_type" className="text-sm">Contract Type</Label>
                        <Select
                          value={contractData.contract_type}
                          onValueChange={(value) => handleContractDataChange("contract_type", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="publishing">Publishing Agreement</SelectItem>
                            <SelectItem value="artist">Artist Agreement</SelectItem>
                            <SelectItem value="producer">Producer Agreement</SelectItem>
                            <SelectItem value="sync">Sync Licensing</SelectItem>
                            <SelectItem value="distribution">Distribution Agreement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateContract(false)}
                          className="h-8"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateContract}
                          disabled={loading || !contractData.title.trim() || !contractData.counterparty_name.trim()}
                          size="sm"
                          className="h-8"
                        >
                          {loading ? "Creating..." : "Create Contract"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Original Publisher Selection */}
                {selectedAgreement && (
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Original Publisher (OP#) *</Label>
                    <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select original publisher" />
                      </SelectTrigger>
                      <SelectContent>
                        {originalPublishers.map((publisher) => (
                          <SelectItem key={publisher.id} value={publisher.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{publisher.op_id}</Badge>
                              <span>{publisher.publisher_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Writer Selection */}
                {selectedPublisher && (
                  <div className="space-y-2">
                    <Label htmlFor="writer">Writer (Writer ID) *</Label>
                    <Select value={selectedWriter} onValueChange={setSelectedWriter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select writer" />
                      </SelectTrigger>
                      <SelectContent>
                        {writers.map((writer) => (
                          <SelectItem key={writer.id} value={writer.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{writer.writer_id}</Badge>
                              <span>{writer.writer_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selected Hierarchy Display */}
                {selectedWriter && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Hierarchy:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge>{selectedAgreementData?.agreement_id}</Badge>
                      <span>→</span>
                      <Badge>{selectedPublisherData?.op_id}</Badge>
                      <span>→</span>
                      <Badge>{selectedWriterData?.writer_id}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payee_name">Payee Name *</Label>
                    <Input
                      id="payee_name"
                      value={payeeData.payee_name}
                      onChange={(e) => handlePayeeFormChange("payee_name", e.target.value)}
                      placeholder="Enter payee name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payee_type">Payee Type</Label>
                    <Select
                      value={payeeData.payee_type}
                      onValueChange={(value) => handlePayeeFormChange("payee_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="writer">Writer</SelectItem>
                        <SelectItem value="attorney">Attorney</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="heir">Heir</SelectItem>
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
                      value={payeeData.email}
                      onChange={(e) => handlePayeeFormChange("email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={payeeData.phone}
                      onChange={(e) => handlePayeeFormChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={payeeData.address}
                    onChange={(e) => handlePayeeFormChange("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / SSN</Label>
                    <Input
                      id="tax_id"
                      value={payeeData.tax_id}
                      onChange={(e) => handlePayeeFormChange("tax_id", e.target.value)}
                      placeholder="Enter tax identification number"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={payeeData.is_primary}
                      onChange={(e) => handlePayeeFormChange("is_primary", e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="is_primary">Primary Payee for this Writer</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
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
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedWriter}
          >
            {loading ? (editingPayee ? "Updating..." : "Adding...") : (editingPayee ? "Update Payee" : "Add Payee")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}