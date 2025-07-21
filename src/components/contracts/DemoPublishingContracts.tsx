import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  FileText, 
  Users, 
  Music, 
  Building2,
  Filter,
  Sparkles
} from "lucide-react";
import { demoPublishingContracts, getDemoContractsByType, DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { AgreementType } from "./PublishingAgreementForm";

interface DemoPublishingContractsProps {
  onLoadDemo: (demoContract: DemoPublishingContract) => void;
}

export function DemoPublishingContracts({ onLoadDemo }: DemoPublishingContractsProps) {
  const [selectedType, setSelectedType] = useState<AgreementType | "all">("all");

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

      {/* Demo Contracts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredContracts.map((contract) => {
          const Icon = getAgreementTypeIcon(contract.agreementType);
          
          return (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{contract.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {contract.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getAgreementTypeBadgeColor(contract.agreementType)}
                  >
                    {getAgreementTypeLabel(contract.agreementType)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Contract Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Counterparty:</span>
                      <p className="font-medium">{contract.formData.counterparty_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Territory:</span>
                      <p className="font-medium">
                        {Array.isArray(contract.formData.territory) 
                          ? contract.formData.territory.slice(0, 2).join(", ") + 
                            (contract.formData.territory.length > 2 ? ` +${contract.formData.territory.length - 2}` : "")
                          : contract.formData.territory
                        }
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {contract.interestedParties.length} parties
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {contract.scheduleWorks.length} works
                    </div>
                  </div>

                  {/* Agreement-specific highlights */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Key Terms:</div>
                    {contract.agreementType === "administration" && (
                      <div className="text-sm">
                        <span className="font-medium">{contract.formData.admin_fee_percentage}% admin fee</span>
                        {contract.formData.admin_controlled_share && (
                          <span className="text-muted-foreground"> • {contract.formData.admin_controlled_share}% controlled</span>
                        )}
                      </div>
                    )}
                    
                    {contract.agreementType === "co_publishing" && (
                      <div className="text-sm">
                        <span className="font-medium">{contract.formData.publisher_share_percentage}% publisher share</span>
                        {contract.formData.advance_amount && (
                          <span className="text-muted-foreground"> • ${contract.formData.advance_amount.toLocaleString()} advance</span>
                        )}
                      </div>
                    )}
                    
                    {contract.agreementType === "exclusive_songwriter" && (
                      <div className="text-sm">
                        <span className="font-medium">Exclusive writer deal</span>
                        {contract.formData.advance_amount && (
                          <span className="text-muted-foreground"> • ${contract.formData.advance_amount.toLocaleString()} advance</span>
                        )}
                        {contract.formData.delivery_requirement && (
                          <span className="text-muted-foreground"> • {contract.formData.delivery_requirement} songs/year</span>
                        )}
                      </div>
                    )}
                    
                    {contract.agreementType === "catalog_acquisition" && (
                      <div className="text-sm">
                        <span className="font-medium">${contract.formData.acquisition_price.toLocaleString()} acquisition</span>
                        {contract.formData.perpetual_rights && (
                          <span className="text-muted-foreground"> • Perpetual rights</span>
                        )}
                        {contract.formData.royalty_override_to_seller && (
                          <span className="text-muted-foreground"> • {contract.formData.royalty_override_to_seller}% override</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Load Demo Button */}
                  <Button 
                    onClick={() => onLoadDemo(contract)}
                    className="w-full"
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Load Demo Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}