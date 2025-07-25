import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  Mic,
  Truck,
  Star,
  Eye,
  Calendar,
  DollarSign,
  Globe,
  Info,
  Filter,
  Sparkles
} from "lucide-react";
import { demoPublishingContracts, DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { demoArtistContracts, DemoArtistContract } from "@/data/demo-artist-contracts";
import { AgreementType } from "./PublishingAgreementForm";
import { format } from "date-fns";

interface DemoContractsProps {
  onLoadDemo: (demoContract: DemoPublishingContract | DemoArtistContract) => void;
}

type DemoContract = DemoPublishingContract | DemoArtistContract;

export function DemoContracts({ onLoadDemo }: DemoContractsProps) {
  const [selectedType, setSelectedType] = useState<AgreementType | "all">("all");
  const [viewingContract, setViewingContract] = useState<DemoContract | null>(null);

  // Combine all demo contracts
  const allContracts: DemoContract[] = [...demoPublishingContracts, ...demoArtistContracts];
  
  const filteredContracts = selectedType === "all" 
    ? allContracts 
    : allContracts.filter(contract => contract.agreementType === selectedType);

  const getAgreementTypeIcon = (type: AgreementType) => {
    switch (type) {
      case "administration":
        return Building2;
      case "co_publishing":
        return Users;
      case "exclusive_songwriter":
        return Mic;
      case "catalog_acquisition":
        return Star;
      case "artist":
        return Mic;
      case "distribution":
        return Truck;
      default:
        return Building2;
    }
  };

  const getAgreementTypeLabel = (type: AgreementType) => {
    switch (type) {
      case "administration":
        return "Administration";
      case "co_publishing":
        return "Co-Publishing";
      case "exclusive_songwriter":
        return "Exclusive Songwriter";
      case "catalog_acquisition":
        return "Catalog Acquisition";
      case "artist":
        return "Artist Agreement";
      case "distribution":
        return "Distribution";
      default:
        return type;
    }
  };

  const getAgreementTypeBadgeColor = (type: AgreementType) => {
    switch (type) {
      case "administration":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "co_publishing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "exclusive_songwriter":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "catalog_acquisition":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "artist":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      case "distribution":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getKeyTerms = (contract: DemoContract) => {
    const { formData, agreementType } = contract;
    
    switch (agreementType) {
      case "administration":
        return `${formData.admin_fee_percentage}% admin fee, ${formData.controlled_percentage}% controlled`;
      case "co_publishing":
        return `${formData.publisher_share_percentage}% publisher share, $${formData.advance_amount?.toLocaleString()} advance`;
      case "exclusive_songwriter":
        return `${formData.songs_per_year} songs/year, $${formData.advance_amount?.toLocaleString()} advance`;
      case "catalog_acquisition":
        return `$${formData.purchase_price?.toLocaleString()} purchase, ${formData.royalty_percentage}% ongoing`;
      case "artist":
        return `${formData.artistRoyaltyRate}% royalty, $${formData.recordingAdvance?.toLocaleString()} advance`;
      case "distribution":
        return `${formData.artistShare}% artist share, $${formData.minimumAdvance?.toLocaleString()} advance`;
      default:
        return "Standard terms apply";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Demo Templates
          </h2>
          <p className="text-muted-foreground">
            Pre-configured contract templates for each agreement type with realistic data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AgreementType | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="administration">Administration</SelectItem>
              <SelectItem value="co_publishing">Co-Publishing</SelectItem>
              <SelectItem value="exclusive_songwriter">Exclusive Songwriter</SelectItem>
              <SelectItem value="catalog_acquisition">Catalog Acquisition</SelectItem>
              <SelectItem value="artist">Artist Agreement</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-lg font-medium">Available Demo Templates</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => {
          const Icon = getAgreementTypeIcon(contract.agreementType);
          
          return (
            <Card key={contract.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                  <Badge 
                    variant="secondary" 
                    className={getAgreementTypeBadgeColor(contract.agreementType)}
                  >
                    {getAgreementTypeLabel(contract.agreementType)}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {contract.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {contract.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Counterparty:
                  </div>
                  <div className="text-sm font-medium">
                    {contract.interestedParties.find(p => p.partyType !== 'writer' && p.partyType !== 'artist')?.name || 
                     contract.interestedParties[1]?.name || 'Various Parties'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Key Terms:
                  </div>
                  <div className="text-sm">
                    {getKeyTerms(contract)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {contract.interestedParties.length} parties
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {contract.scheduleWorks.length} works
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewingContract(contract)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onLoadDemo(contract)}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Load Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No demo contracts found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try selecting a different contract type from the filter above.
          </p>
        </div>
      )}

      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingContract && (
                <>
                  {(() => {
                    const Icon = getAgreementTypeIcon(viewingContract.agreementType);
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {viewingContract.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewingContract?.description}
            </DialogDescription>
          </DialogHeader>

          {viewingContract && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="parties">Parties</TabsTrigger>
                <TabsTrigger value="works">Works</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Agreement Type</h4>
                    <p className="text-sm text-muted-foreground">{getAgreementTypeLabel(viewingContract.agreementType)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge variant="secondary">Demo Template</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="terms" className="mt-6">
                <div className="space-y-4">
                  {Object.entries(viewingContract.formData).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-4 py-2 border-b border-border/50">
                      <div className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="parties" className="mt-6">
                <div className="space-y-4">
                  {viewingContract.interestedParties.map((party, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{party.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {party.partyType} • {party.controlledStatus === 'C' ? 'Controlled' : 'Non-Controlled'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Performance</div>
                            <div>{party.performancePercentage}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Mechanical</div>
                            <div>{party.mechanicalPercentage}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Sync</div>
                            <div>{party.syncPercentage}%</div>
                          </div>
                        </div>
                        {party.email && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            <div>Email: {party.email}</div>
                            {party.phone && <div>Phone: {party.phone}</div>}
                            {party.address && <div>Address: {party.address}</div>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="works" className="mt-6">
                <div className="space-y-3">
                  {viewingContract.scheduleWorks.map((work, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">{work.songTitle}</h4>
                            <p className="text-sm text-muted-foreground">
                              {work.artistName} • {work.albumTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <div>Work ID: {work.workId}</div>
                              {work.isrc && <div>ISRC: {work.isrc}</div>}
                              {work.iswc && <div>ISWC: {work.iswc}</div>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}