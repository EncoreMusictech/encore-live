import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, AlertCircle, Merge, Unlink, Eye, EyeOff, Pencil, Check, X, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MergePartiesDialog } from "./MergePartiesDialog";

interface InterestedParty {
  id: string;
  name: string;
  dba_alias?: string | null;
  party_type: string;
  controlled_status: string;
  performance_percentage: number | null;
  mechanical_percentage: number | null;
  synch_percentage: number | null;
  print_percentage?: number | null;
  grand_rights_percentage?: number | null;
  karaoke_percentage?: number | null;
  ipi_number?: string | null;
  cae_number?: string | null;
  affiliation?: string | null;
  original_publisher?: string | null;
  administrator_role?: string | null;
  co_publisher?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
  merged_into_id?: string | null;
}

interface InterestedPartiesTableProps {
  contractId: string;
}

export function InterestedPartiesTable({ contractId }: InterestedPartiesTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [showMerged, setShowMerged] = useState(false);
  const [allParties, setAllParties] = useState<InterestedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InterestedParty>>({});
  const { toast } = useToast();

  const fetchParties = useCallback(async () => {
    if (!contractId) return;
    try {
      const { data, error } = await supabase
        .from('contract_interested_parties')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setAllParties(data || []);
    } catch (err) {
      console.error('Error fetching interested parties:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const primaryParties = allParties.filter(p => !p.merged_into_id);
  const mergedParties = allParties.filter(p => !!p.merged_into_id);
  const visibleParties = showMerged ? allParties : primaryParties;

  const [formData, setFormData] = useState({
    name: "",
    dba_alias: "",
    party_type: "writer",
    controlled_status: "NC",
    cae_number: "",
    ipi_number: "",
    affiliation: "",
    performance_percentage: 0,
    mechanical_percentage: 0,
    print_percentage: 0,
    synch_percentage: 0,
    grand_rights_percentage: 0,
    karaoke_percentage: 0,
    original_publisher: "",
    administrator_role: "",
    co_publisher: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  const handleAddParty = async () => {
    try {
      const { error } = await supabase
        .from('contract_interested_parties')
        .insert({
          contract_id: contractId,
          ...formData,
        });
      if (error) throw error;
      
      toast({ title: "Success", description: "Interested party added." });
      setIsAddDialogOpen(false);
      setFormData({
        name: "", dba_alias: "", party_type: "writer", controlled_status: "NC",
        cae_number: "", ipi_number: "", affiliation: "",
        performance_percentage: 0, mechanical_percentage: 0, print_percentage: 0,
        synch_percentage: 0, grand_rights_percentage: 0, karaoke_percentage: 0,
        original_publisher: "", administrator_role: "", co_publisher: "",
        email: "", phone: "", address: "", tax_id: "",
      });
      await fetchParties();
    } catch (error) {
      console.error('Error adding party:', error);
      toast({ title: "Error", description: "Failed to add party.", variant: "destructive" });
    }
  };

  const handleRemoveParty = async (partyId: string) => {
    try {
      const { error } = await supabase
        .from('contract_interested_parties')
        .delete()
        .eq('id', partyId);
      if (error) throw error;
      toast({ title: "Removed", description: "Party removed." });
      await fetchParties();
    } catch (error) {
      console.error('Error removing party:', error);
    }
  };

  const handleToggleSelect = (partyId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(partyId);
      else next.delete(partyId);
      return next;
    });
  };

  const handleMergeConfirm = async (primaryId: string, secondaryIds: string[]) => {
    try {
      for (const secId of secondaryIds) {
        await supabase
          .from('contract_interested_parties')
          .update({ merged_into_id: primaryId, merged_at: new Date().toISOString() })
          .eq('id', secId);
      }
      toast({ title: "Merged", description: `Merged ${secondaryIds.length} parties.` });
      setSelectedIds(new Set());
      await fetchParties();
    } catch (error) {
      console.error('Error merging parties:', error);
    }
  };

  const handleUnmerge = async (partyId: string) => {
    try {
      await supabase
        .from('contract_interested_parties')
        .update({ merged_into_id: null, merged_at: null })
        .eq('id', partyId);
      toast({ title: "Unmerged", description: "Party restored." });
      await fetchParties();
    } catch (error) {
      console.error('Error unmerging party:', error);
    }
  };

  const startEditing = (party: InterestedParty) => {
    setEditingId(party.id);
    setEditValues({
      party_type: party.party_type,
      controlled_status: party.controlled_status,
      performance_percentage: party.performance_percentage ?? 0,
      mechanical_percentage: party.mechanical_percentage ?? 0,
      synch_percentage: party.synch_percentage ?? 0,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from('contract_interested_parties')
        .update({
          party_type: editValues.party_type,
          controlled_status: editValues.controlled_status,
          performance_percentage: editValues.performance_percentage,
          mechanical_percentage: editValues.mechanical_percentage,
          synch_percentage: editValues.synch_percentage,
        })
        .eq('id', editingId);
      if (error) throw error;
      toast({ title: "Saved", description: "Royalty rates updated." });
      setEditingId(null);
      setEditValues({});
      await fetchParties();
    } catch (error) {
      console.error('Error updating party:', error);
      toast({ title: "Error", description: "Failed to update party.", variant: "destructive" });
    }
  };

  const getControlledTotal = () => {
    return primaryParties
      .filter(party => party.controlled_status === 'C')
      .reduce((total, party) => {
        return total + Math.max(
          party.performance_percentage || 0,
          party.mechanical_percentage || 0,
          party.synch_percentage || 0
        );
      }, 0);
  };

  const selectedParties = allParties.filter(p => selectedIds.has(p.id));
  const getPrimaryName = (mergedIntoId: string) => {
    const primary = allParties.find(p => p.id === mergedIntoId);
    return primary?.name || 'Unknown';
  };

  const partyTypes = [
    { value: "writer", label: "Writer" },
    { value: "producer", label: "Producer" },
    { value: "publisher", label: "Publisher" },
    { value: "original_publisher", label: "Original Publisher" },
    { value: "administrator", label: "Administrator" },
    { value: "co_publisher", label: "Co-Publisher" },
    { value: "label", label: "Label" },
    { value: "artist", label: "Artist" },
    { value: "buyer", label: "Buyer (Acquiring Party)" },
    { value: "seller", label: "Seller (Transferring Party)" },
  ];

  const affiliations = [
    "ASCAP", "BMI", "SESAC", "SOCAN", "PRS", "GEMA", "SACEM", "Other"
  ];

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading interested parties...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Interested Parties</span>
            <div className="flex items-center gap-2">
              {mergedParties.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowMerged(!showMerged)} className="gap-1">
                  {showMerged ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showMerged ? 'Hide' : 'Show'} Merged ({mergedParties.length})
                </Button>
              )}
              {selectedIds.size >= 2 && (
                <Button variant="outline" size="sm" onClick={() => setMergeDialogOpen(true)} className="gap-1">
                  <Merge className="h-4 w-4" />
                  Merge Selected ({selectedIds.size})
                </Button>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Party
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Interested Party</DialogTitle>
                    <DialogDescription>
                      Add a contributor to this contract with their royalty splits and rights
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Legal or credited name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dba_alias">DBA / Alias</Label>
                        <Input id="dba_alias" value={formData.dba_alias} onChange={(e) => setFormData({...formData, dba_alias: e.target.value})} placeholder="Professional alias" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="party_type">Party Type</Label>
                        <Select onValueChange={(value) => setFormData({...formData, party_type: value})}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {partyTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="controlled_status">Controlled Status</Label>
                        <Select onValueChange={(value) => setFormData({...formData, controlled_status: value})}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">Controlled (C)</SelectItem>
                            <SelectItem value="NC">Non-Controlled (NC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="affiliation">PRO Affiliation</Label>
                        <Select onValueChange={(value) => setFormData({...formData, affiliation: value})}>
                          <SelectTrigger><SelectValue placeholder="Select PRO" /></SelectTrigger>
                          <SelectContent>
                            {affiliations.map(aff => (
                              <SelectItem key={aff} value={aff}>{aff}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Royalty Splits by Right Type (%)</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="performance_percentage">Performance</Label>
                          <Input id="performance_percentage" type="number" min="0" max="100" value={formData.performance_percentage} onChange={(e) => setFormData({...formData, performance_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mechanical_percentage">Mechanical</Label>
                          <Input id="mechanical_percentage" type="number" min="0" max="100" value={formData.mechanical_percentage} onChange={(e) => setFormData({...formData, mechanical_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="synch_percentage">Synch</Label>
                          <Input id="synch_percentage" type="number" min="0" max="100" value={formData.synch_percentage} onChange={(e) => setFormData({...formData, synch_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="print_percentage">Print</Label>
                          <Input id="print_percentage" type="number" min="0" max="100" value={formData.print_percentage} onChange={(e) => setFormData({...formData, print_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grand_rights_percentage">Grand Rights</Label>
                          <Input id="grand_rights_percentage" type="number" min="0" max="100" value={formData.grand_rights_percentage} onChange={(e) => setFormData({...formData, grand_rights_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="karaoke_percentage">Karaoke</Label>
                          <Input id="karaoke_percentage" type="number" min="0" max="100" value={formData.karaoke_percentage} onChange={(e) => setFormData({...formData, karaoke_percentage: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@email.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone number" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddParty} disabled={!formData.name}>Add Party</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Manage all contributors and their rights splits. Total Controlled: {getControlledTotal().toFixed(1)}%</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>These percentages determine how royalty revenue is distributed. Performance, Mechanical, and Synch splits are applied to matching revenue types during payout generation. Only Controlled (C) parties receive payable outputs.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {validationResults.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Royalty split validation issues detected. Review the totals below.
              </AlertDescription>
            </Alert>
          )}
          
          {allParties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No interested parties added yet. Click "Add Party" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance %</TableHead>
                  <TableHead>Mechanical %</TableHead>
                  <TableHead>Synch %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleParties.map((party) => {
                  const isMerged = !!party.merged_into_id;
                  return (
                    <TableRow key={party.id} className={isMerged ? 'opacity-50 bg-muted/30' : ''}>
                      <TableCell>
                        {!isMerged && (
                          <Checkbox
                            checked={selectedIds.has(party.id)}
                            onCheckedChange={(checked) => handleToggleSelect(party.id, !!checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={isMerged ? 'pl-4' : ''}>
                          <div className="font-medium">{party.name}</div>
                          {party.dba_alias && (
                            <div className="text-sm text-muted-foreground">DBA: {party.dba_alias}</div>
                          )}
                          {isMerged && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Linked to: {getPrimaryName(party.merged_into_id!)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === party.id ? (
                          <Select value={editValues.party_type} onValueChange={(v) => setEditValues({...editValues, party_type: v})}>
                            <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {partyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {party.party_type.charAt(0).toUpperCase() + party.party_type.slice(1)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === party.id ? (
                          <Select value={editValues.controlled_status} onValueChange={(v) => setEditValues({...editValues, controlled_status: v})}>
                            <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="C">Controlled</SelectItem>
                              <SelectItem value="NC">Non-Controlled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={party.controlled_status === 'C' ? 'default' : 'secondary'}>
                            {party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === party.id ? (
                          <Input type="number" min="0" max="100" className="h-8 w-20" value={editValues.performance_percentage ?? 0} onChange={(e) => setEditValues({...editValues, performance_percentage: parseFloat(e.target.value) || 0})} />
                        ) : (
                          <span>{party.performance_percentage ?? 0}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === party.id ? (
                          <Input type="number" min="0" max="100" className="h-8 w-20" value={editValues.mechanical_percentage ?? 0} onChange={(e) => setEditValues({...editValues, mechanical_percentage: parseFloat(e.target.value) || 0})} />
                        ) : (
                          <span>{party.mechanical_percentage ?? 0}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === party.id ? (
                          <Input type="number" min="0" max="100" className="h-8 w-20" value={editValues.synch_percentage ?? 0} onChange={(e) => setEditValues({...editValues, synch_percentage: parseFloat(e.target.value) || 0})} />
                        ) : (
                          <span>{party.synch_percentage ?? 0}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === party.id ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="text-green-600 hover:text-green-700">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : isMerged ? (
                            <Button variant="ghost" size="sm" onClick={() => handleUnmerge(party.id)} title="Unmerge">
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEditing(party)} title="Edit rates">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveParty(party.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MergePartiesDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        parties={selectedParties}
        onConfirm={handleMergeConfirm}
      />
    </div>
  );
}
