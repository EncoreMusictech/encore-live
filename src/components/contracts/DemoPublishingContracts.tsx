import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  FileText, 
  Users, 
  Music, 
  Building2,
  Filter,
  Sparkles,
  Eye,
  Calendar,
  DollarSign,
  Globe,
  Info
} from "lucide-react";
import { demoPublishingContracts, getDemoContractsByType, DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { AgreementType } from "./PublishingAgreementForm";
import { format } from "date-fns";

interface DemoPublishingContractsProps {
  onLoadDemo: (demoContract: DemoPublishingContract) => void;
}

export function DemoPublishingContracts({ onLoadDemo }: DemoPublishingContractsProps) {
  const [selectedType, setSelectedType] = useState<AgreementType | "all">("all");
  const [viewingContract, setViewingContract] = useState<DemoPublishingContract | null>(null);

  const filteredContracts = selectedType === "all" 
    ? demoPublishingContracts 
    : getDemoContractsByType(selectedType);

  const getAgreementTypeIcon = (type: AgreementType) => {
    switch (type) {
      case "administration":
        return Building2;
      case "co_publishing":
        return Users;
      case "exclusive_songwriter":
        return Music;
      case "catalog_acquisition":
        return FileText;
      default:
        return FileText;
    }
  };

  const getAgreementTypeLabel = (type: AgreementType) => {
    const labels = {
      administration: "Administration",
      co_publishing: "Co-Publishing", 
      exclusive_songwriter: "Exclusive Songwriter",
      catalog_acquisition: "Catalog Acquisition",
    };
    return labels[type];
  };

  const getAgreementTypeBadgeColor = (type: AgreementType) => {
    const colors = {
      administration: "bg-blue-100 text-blue-800",
      co_publishing: "bg-green-100 text-green-800",
      exclusive_songwriter: "bg-purple-100 text-purple-800", 
      catalog_acquisition: "bg-orange-100 text-orange-800",
    };
    return colors[type];
  };

  const getKeyTerms = (contract: DemoPublishingContract) => {
    const { formData, agreementType } = contract;
    
    switch (agreementType) {
      case "administration":
        return `${formData.admin_fee_percentage}% admin fee, ${formData.admin_controlled_share}% controlled`;
      case "co_publishing":
        return `${formData.publisher_share_percentage}% publisher share, $${formData.advance_amount?.toLocaleString()} advance`;
      case "exclusive_songwriter":
        return `${formData.delivery_requirement} songs/year, $${formData.advance_amount?.toLocaleString()} advance`;
      case "catalog_acquisition":
        return `$${formData.acquisition_price?.toLocaleString()} acquisition, ${formData.perpetual_rights ? 'Perpetual' : 'Term'} rights`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Demo Publishing Contracts</h3>
            <p className="text-sm text-muted-foreground">
              Pre-configured contracts for each agreement type with realistic data
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AgreementType | "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="administration">Administration</SelectItem>
              <SelectItem value="co_publishing">Co-Publishing</SelectItem>
              <SelectItem value="exclusive_songwriter">Exclusive Songwriter</SelectItem>
              <SelectItem value="catalog_acquisition">Catalog Acquisition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Demo Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Demo Contracts</CardTitle>
          <CardDescription>
            Click "View Details" to see the complete contract data, or "Load Demo" to use as a starting point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Key Terms</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Works</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const Icon = getAgreementTypeIcon(contract.agreementType);
                
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{contract.title}</div>
                          <div className="text-sm text-muted-foreground">{contract.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getAgreementTypeBadgeColor(contract.agreementType)}
                      >
                        {getAgreementTypeLabel(contract.agreementType)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">{contract.formData.counterparty_name}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{getKeyTerms(contract)}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {Array.isArray(contract.formData.territory) 
                          ? contract.formData.territory.slice(0, 2).join(", ") + 
                            (contract.formData.territory.length > 2 ? ` +${contract.formData.territory.length - 2}` : "")
                          : contract.formData.territory
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {contract.interestedParties.length}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Music className="h-3 w-3" />
                        {contract.scheduleWorks.length}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setViewingContract(contract)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {contract.title}
                              </DialogTitle>
                              <DialogDescription>
                                Complete contract details and data structure
                              </DialogDescription>
                            </DialogHeader>
                            
                            {viewingContract && (
                              <Tabs defaultValue="basic" className="space-y-4">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                  <TabsTrigger value="terms">Terms</TabsTrigger>
                                  <TabsTrigger value="parties">Parties</TabsTrigger>
                                  <TabsTrigger value="works">Works</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="basic" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        Agreement Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Title</label>
                                          <p className="font-medium">{viewingContract.formData.title}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Counterparty</label>
                                          <p className="font-medium">{viewingContract.formData.counterparty_name}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Agreement Type</label>
                                          <p className="font-medium">{getAgreementTypeLabel(viewingContract.agreementType)}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                                          <Badge variant="outline">{viewingContract.formData.status}</Badge>
                                        </div>
                                        {viewingContract.formData.effective_date && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Effective Date</label>
                                            <p className="font-medium">{format(new Date(viewingContract.formData.effective_date), "MMM dd, yyyy")}</p>
                                          </div>
                                        )}
                                        {viewingContract.formData.end_date && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">End Date</label>
                                            <p className="font-medium">{format(new Date(viewingContract.formData.end_date), "MMM dd, yyyy")}</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Territory</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Array.isArray(viewingContract.formData.territory) ? 
                                            viewingContract.formData.territory.map((territory: string) => (
                                              <Badge key={territory} variant="outline">{territory}</Badge>
                                            )) :
                                            <Badge variant="outline">{viewingContract.formData.territory}</Badge>
                                          }
                                        </div>
                                      </div>
                                      
                                      {viewingContract.formData.governing_law && (
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Governing Law</label>
                                          <p className="font-medium">{viewingContract.formData.governing_law}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="terms" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Agreement-Specific Terms
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        {viewingContract.agreementType === "administration" && (
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Admin Fee</label>
                                              <p className="font-medium">{viewingContract.formData.admin_fee_percentage}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Controlled Share</label>
                                              <p className="font-medium">{viewingContract.formData.admin_controlled_share}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Approval Rights</label>
                                              <p className="font-medium">{viewingContract.formData.approval_rights}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Tail Period</label>
                                              <p className="font-medium">{viewingContract.formData.tail_period_months} months</p>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {viewingContract.agreementType === "co_publishing" && (
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Publisher Share</label>
                                              <p className="font-medium">{viewingContract.formData.publisher_share_percentage}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Writer Share</label>
                                              <p className="font-medium">{viewingContract.formData.writer_share_percentage}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Advance Amount</label>
                                              <p className="font-medium">${viewingContract.formData.advance_amount?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Delivery Commitment</label>
                                              <p className="font-medium">{viewingContract.formData.delivery_commitment} songs</p>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {viewingContract.agreementType === "exclusive_songwriter" && (
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Advance Amount</label>
                                              <p className="font-medium">${viewingContract.formData.advance_amount?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Delivery Requirement</label>
                                              <p className="font-medium">{viewingContract.formData.delivery_requirement} songs/year</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Mechanical Rate</label>
                                              <p className="font-medium">{viewingContract.formData.mechanical_royalty_rate}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Sync Rate</label>
                                              <p className="font-medium">{viewingContract.formData.sync_royalty_rate}%</p>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {viewingContract.agreementType === "catalog_acquisition" && (
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Acquisition Price</label>
                                              <p className="font-medium">${viewingContract.formData.acquisition_price?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Rights Acquired</label>
                                              <p className="font-medium">{viewingContract.formData.rights_acquired.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Seller Override</label>
                                              <p className="font-medium">{viewingContract.formData.royalty_override_to_seller}%</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-muted-foreground">Perpetual Rights</label>
                                              <p className="font-medium">{viewingContract.formData.perpetual_rights ? 'Yes' : 'No'}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="parties" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Interested Parties ({viewingContract.interestedParties.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Performance %</TableHead>
                                            <TableHead>Mechanical %</TableHead>
                                            <TableHead>Sync %</TableHead>
                                            <TableHead>Controlled</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {viewingContract.interestedParties.map((party: any) => (
                                            <TableRow key={party.id}>
                                              <TableCell>
                                                <div>
                                                  <div className="font-medium">{party.name}</div>
                                                  {party.email && (
                                                    <div className="text-sm text-muted-foreground">{party.email}</div>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant="outline">
                                                  {party.party_type}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>{party.performance_percentage}%</TableCell>
                                              <TableCell>{party.mechanical_percentage}%</TableCell>
                                              <TableCell>{party.synch_percentage}%</TableCell>
                                              <TableCell>
                                                <Badge variant={party.controlled_status === 'C' ? 'default' : 'outline'}>
                                                  {party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="works" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Music className="h-4 w-4" />
                                        Schedule of Works ({viewingContract.scheduleWorks.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Song Title</TableHead>
                                            <TableHead>Work ID</TableHead>
                                            <TableHead>Artist</TableHead>
                                            <TableHead>Album</TableHead>
                                            <TableHead>ISWC</TableHead>
                                            <TableHead>ISRC</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {viewingContract.scheduleWorks.map((work: any) => (
                                            <TableRow key={work.id}>
                                              <TableCell className="font-medium">{work.song_title}</TableCell>
                                              <TableCell className="font-mono text-sm">{work.work_id}</TableCell>
                                              <TableCell>{work.artist_name}</TableCell>
                                              <TableCell>{work.album_title || '-'}</TableCell>
                                              <TableCell className="font-mono text-sm">{work.iswc || '-'}</TableCell>
                                              <TableCell className="font-mono text-sm">{work.isrc || '-'}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          onClick={() => onLoadDemo(contract)}
                          size="sm"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Load Demo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredContracts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <Filter className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No demo contracts found for the selected type.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setSelectedType("all")}
              >
                Show All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}