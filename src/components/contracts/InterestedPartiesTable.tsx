import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InterestedPartiesTableProps {
  contractId: string;
}

export function InterestedPartiesTable({ contractId }: InterestedPartiesTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const { contracts, addInterestedParty, removeInterestedParty, validateRoyaltySplits } = useContracts();
  const { toast } = useToast();

  const contract = contracts.find(c => c.id === contractId);
  const interestedParties = contract?.interested_parties || [];

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
      await addInterestedParty(contractId, formData);
      setIsAddDialogOpen(false);
      setFormData({
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
      
      // Validate splits after adding
      const results = await validateRoyaltySplits(contractId);
      setValidationResults(results || []);
    } catch (error) {
      console.error('Error adding party:', error);
    }
  };

  const handleRemoveParty = async (partyId: string) => {
    try {
      await removeInterestedParty(partyId);
      
      // Validate splits after removing
      const results = await validateRoyaltySplits(contractId);
      setValidationResults(results || []);
    } catch (error) {
      console.error('Error removing party:', error);
    }
  };

  const getControlledTotal = () => {
    return interestedParties
      .filter(party => party.controlled_status === 'C')
      .reduce((total, party) => {
        return total + Math.max(
          party.performance_percentage || 0,
          party.mechanical_percentage || 0,
          party.synch_percentage || 0
        );
      }, 0);
  };

  const partyTypes = [
    { value: "writer", label: "Writer" },
    { value: "producer", label: "Producer" },
    { value: "publisher", label: "Publisher" },
    { value: "administrator", label: "Administrator" },
    { value: "co_publisher", label: "Co-Publisher" },
    { value: "label", label: "Label" },
  ];

  const affiliations = [
    "ASCAP", "BMI", "SESAC", "SOCAN", "PRS", "GEMA", "SACEM", "Other"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Interested Parties
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
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
                  {/* Party Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Legal or credited name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dba_alias">DBA / Alias</Label>
                      <Input
                        id="dba_alias"
                        value={formData.dba_alias}
                        onChange={(e) => setFormData({...formData, dba_alias: e.target.value})}
                        placeholder="Professional alias"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="party_type">Party Type</Label>
                      <Select onValueChange={(value) => setFormData({...formData, party_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C">Controlled (C)</SelectItem>
                          <SelectItem value="NC">Non-Controlled (NC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="affiliation">PRO Affiliation</Label>
                      <Select onValueChange={(value) => setFormData({...formData, affiliation: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PRO" />
                        </SelectTrigger>
                        <SelectContent>
                          {affiliations.map(aff => (
                            <SelectItem key={aff} value={aff}>{aff}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Royalty Splits */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Royalty Splits by Right Type (%)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="performance_percentage">Performance</Label>
                        <Input
                          id="performance_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.performance_percentage}
                          onChange={(e) => setFormData({...formData, performance_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mechanical_percentage">Mechanical</Label>
                        <Input
                          id="mechanical_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.mechanical_percentage}
                          onChange={(e) => setFormData({...formData, mechanical_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="synch_percentage">Synch</Label>
                        <Input
                          id="synch_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.synch_percentage}
                          onChange={(e) => setFormData({...formData, synch_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="print_percentage">Print</Label>
                        <Input
                          id="print_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.print_percentage}
                          onChange={(e) => setFormData({...formData, print_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="grand_rights_percentage">Grand Rights</Label>
                        <Input
                          id="grand_rights_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.grand_rights_percentage}
                          onChange={(e) => setFormData({...formData, grand_rights_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="karaoke_percentage">Karaoke</Label>
                        <Input
                          id="karaoke_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.karaoke_percentage}
                          onChange={(e) => setFormData({...formData, karaoke_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="contact@email.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddParty} disabled={!formData.name}>
                      Add Party
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage all contributors and their rights splits. Total Controlled: {getControlledTotal().toFixed(1)}%
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
          
          {interestedParties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No interested parties added yet. Click "Add Party" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                {interestedParties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{party.name}</div>
                        {party.dba_alias && (
                          <div className="text-sm text-muted-foreground">DBA: {party.dba_alias}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {party.party_type.charAt(0).toUpperCase() + party.party_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={party.controlled_status === 'C' ? 'default' : 'secondary'}>
                        {party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}
                      </Badge>
                    </TableCell>
                    <TableCell>{party.performance_percentage}%</TableCell>
                    <TableCell>{party.mechanical_percentage}%</TableCell>
                    <TableCell>{party.synch_percentage}%</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParty(party.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}