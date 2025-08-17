import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { updatePageMetadata } from "@/utils/seo";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { ContractList } from "@/components/contracts/ContractList";
import { StandardizedPublishingForm } from "@/components/contracts/StandardizedPublishingForm";
import { StandardizedArtistForm } from "@/components/contracts/StandardizedArtistForm";
import { StandardizedProducerForm } from "@/components/contracts/StandardizedProducerForm";
import { StandardizedSyncForm } from "@/components/contracts/StandardizedSyncForm";
import { StandardizedDistributionForm } from "@/components/contracts/StandardizedDistributionForm";
import { EditContractForm } from "@/components/contracts/EditContractForm";
import TemplateLibrary from "@/components/contracts/TemplateLibrary";
import { DocuSignImport } from "@/components/contracts/DocuSignImport";
import { ContractUpload } from "@/components/contracts/ContractUpload";
import { DemoContracts } from "@/components/contracts/DemoContracts";
import { useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, Plus, Upload, Calendar, DollarSign, Users, Search, Filter, X, 
  TrendingUp, Clock, CalendarIcon 
} from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CRMContractsPage() {
  const [activeTab, setActiveTab] = useState("contracts");
  const { contracts, loading } = useContracts();
  const { canAccess, isDemo } = useDemoAccess();
  const { toast } = useToast();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [signatureFilter, setSignatureFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [creationMethod, setCreationMethod] = useState<string | null>(null);
  const [showDocuSignImport, setShowDocuSignImport] = useState(false);
  const [showContractUpload, setShowContractUpload] = useState(false);

  useEffect(() => {
    updatePageMetadata('contractManagement');
  }, []);

  const contractTypes = [
    {
      id: "publishing",
      title: "Publishing Agreement",
      description: "Administration, Co-Publishing, Songwriter, or Catalog Acquisition",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      id: "artist",
      title: "Artist Agreement", 
      description: "Indie, Label, 360, or Distribution deals with advances",
      icon: Users,
      color: "bg-purple-500"
    },
    {
      id: "producer",
      title: "Producer Agreement",
      description: "Flat fee, points, or hybrid producer deals",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      id: "sync",
      title: "Sync License",
      description: "TV, Film, Web, Ads sync licensing agreements",
      icon: Calendar,
      color: "bg-orange-500"
    },
    {
      id: "distribution",
      title: "Distribution Agreement",
      description: "Distribution-only or full label deals",
      icon: Upload,
      color: "bg-red-500"
    }
  ];

  // Calculate dynamic stats from actual contract data
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const activeContracts = contracts.filter(contract => 
      contract.contract_status === 'signed'
    ).length;
    
    const pendingSignatures = contracts.filter(contract => 
      contract.signature_status === 'pending' || contract.signature_status === 'sent'
    ).length;
    
    const expiringSoon = contracts.filter(contract => {
      if (!contract.end_date) return false;
      const endDate = new Date(contract.end_date);
      return endDate >= now && endDate <= thirtyDaysFromNow;
    }).length;
    
    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.advance_amount || 0);
    }, 0);
    
    const formatValue = (value: number) => {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    };
    
    return [
      { 
        title: "Active Contracts", 
        value: activeContracts.toString(), 
        change: contracts.length === 0 ? "No contracts yet" : `${contracts.length} total`,
        icon: FileText
      },
      { 
        title: "Pending Signatures", 
        value: pendingSignatures.toString(), 
        change: pendingSignatures > 0 ? `${pendingSignatures} awaiting` : "All signed",
        icon: Users
      },
      { 
        title: "Expiring Soon", 
        value: expiringSoon.toString(), 
        change: expiringSoon > 0 ? "Next 30 days" : "None expiring",
        icon: Clock
      },
      { 
        title: "Total Value", 
        value: totalValue > 0 ? formatValue(totalValue) : "$0", 
        change: contracts.length > 0 ? "In advances" : "No advances",
        icon: TrendingUp
      }
    ];
  }, [contracts]);

  // Filtered contracts based on search and filter criteria
  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.counterparty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contract_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(contract => contract.contract_status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(contract => contract.contract_type === typeFilter);
    }

    // Apply signature filter
    if (signatureFilter !== "all") {
      filtered = filtered.filter(contract => {
        if (signatureFilter === "signed") return contract.signature_status === "completed";
        if (signatureFilter === "pending") return contract.signature_status === "pending" || !contract.signature_status;
        return true;
      });
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter(contract => {
        const contractDate = new Date(contract.start_date || contract.created_at);
        return contractDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(contract => {
        const contractDate = new Date(contract.end_date || contract.created_at);
        return contractDate <= endDate;
      });
    }

    return filtered;
  }, [contracts, searchTerm, statusFilter, typeFilter, signatureFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSignatureFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (signatureFilter !== "all") count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DemoLimitBanner module="contractManagement" />

      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contract Management</h1>
          <p className="text-muted-foreground">
            Simulate, upload, generate, and manage music industry agreements with automated royalty extraction.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setCreationMethod(null);
            setSelectedContractType(null);
            setShowContractUpload(false);
            setShowDocuSignImport(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2" 
              disabled={!canAccess('contractManagement')}
            >
              <Plus className="h-4 w-4" />
              {canAccess('contractManagement') ? 'New Contract' : 'Demo Limit Reached'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
              <DialogDescription>
                {!creationMethod ? "Choose how you'd like to create your contract." : 
                 creationMethod === 'new' ? "Choose a contract type to begin creating your agreement." :
                 creationMethod === 'template' ? "Select a template to start with." :
                 "Upload an existing contract to import."}
              </DialogDescription>
            </DialogHeader>
            
            {!creationMethod ? (
              // Step 1: Choose creation method
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCreationMethod('new')}
                >
                  <CardHeader className="pb-3 text-center">
                    <div className="bg-gradient-primary rounded-lg p-3 w-fit mx-auto mb-2">
                      <Plus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">Create New</CardTitle>
                    <CardDescription className="text-sm">
                      Build a contract from scratch using our smart forms
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCreationMethod('template')}
                >
                  <CardHeader className="pb-3 text-center">
                    <div className="bg-gradient-primary rounded-lg p-3 w-fit mx-auto mb-2">
                      <FileText className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">Use Custom Template</CardTitle>
                    <CardDescription className="text-sm">
                      Start with a pre-built industry standard template
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCreationMethod('upload')}
                >
                  <CardHeader className="pb-3 text-center">
                    <div className="bg-gradient-primary rounded-lg p-3 w-fit mx-auto mb-2">
                      <Upload className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">Upload Existing</CardTitle>
                    <CardDescription className="text-sm">
                      Import from DocuSign or upload from your computer
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ) : creationMethod === 'new' && !selectedContractType ? (
              // Step 2a: Choose contract type for new contract
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {contractTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card 
                      key={type.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedContractType(type.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className={`${type.color} rounded-lg p-2 w-fit mb-2`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ) : creationMethod === 'template' ? (
              // Step 2b: Template selection
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCreationMethod(null)}
                  className="gap-2"
                >
                  ← Back to options
                </Button>
                <TemplateLibrary 
                  selectionMode={true}
                  onBack={() => setCreationMethod(null)}
                  onTemplateSelect={(template) => {
                    setSelectedContractType(template.contract_type);
                  }}
                />
              </div>
            ) : creationMethod === 'upload' ? (
              !showContractUpload && !showDocuSignImport ? (
                // Step 2c: Upload options
                <div className="space-y-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCreationMethod(null)}
                    className="gap-2"
                  >
                    ← Back to options
                  </Button>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="text-center">
                        <div className="bg-blue-500 rounded-lg p-3 w-fit mx-auto mb-2">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">Import from DocuSign</CardTitle>
                        <CardDescription>
                          Connect your DocuSign account to import existing contracts
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={() => setShowDocuSignImport(true)}
                        >
                          Connect DocuSign
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="text-center">
                        <div className="bg-green-500 rounded-lg p-3 w-fit mx-auto mb-2">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">Upload PDF Contract</CardTitle>
                        <CardDescription>
                          Upload existing contracts from your computer
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={() => setShowContractUpload(true)}
                        >
                          Upload Contract
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : showDocuSignImport ? (
                <DocuSignImport 
                  onBack={() => setShowDocuSignImport(false)} 
                  onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    setCreationMethod(null);
                    setShowDocuSignImport(false);
                  }} 
                />
              ) : (
                <ContractUpload 
                  onBack={() => setShowContractUpload(false)} 
                  onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    setCreationMethod(null);
                    setShowContractUpload(false);
                  }} 
                />
              )
            ) : selectedContractType ? (
              // Step 3: Show appropriate form based on contract type
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSelectedContractType(null);
                    if (creationMethod !== 'template') {
                      setCreationMethod('new');
                    }
                  }}
                  className="gap-2"
                >
                  ← Back to contract types
                </Button>
                
                {selectedContractType === 'publishing' && (
                  <StandardizedPublishingForm 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                    }} 
                  />
                )}
                {selectedContractType === 'artist' && (
                  <StandardizedArtistForm 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                    }} 
                  />
                )}
                {selectedContractType === 'producer' && (
                  <StandardizedProducerForm 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                    }} 
                  />
                )}
                {selectedContractType === 'sync' && (
                  <StandardizedSyncForm 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                    }} 
                  />
                )}
                {selectedContractType === 'distribution' && (
                  <StandardizedDistributionForm 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                    }} 
                  />
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="contracts">
            <FileText className="w-4 h-4 mr-2" />
            All Contracts
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Upload className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          {isDemo && (
            <TabsTrigger value="demo">
              <Calendar className="w-4 h-4 mr-2" />
              Demo Data
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                  <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        {filtersOpen ? 'Hide' : 'Show'} Filters
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
              </div>
              <CardDescription>
                Filter and search through your contracts
              </CardDescription>
            </CardHeader>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contracts by title or counterparty..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="publishing">Publishing</SelectItem>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="producer">Producer</SelectItem>
                        <SelectItem value="sync">Sync</SelectItem>
                        <SelectItem value="distribution">Distribution</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={signatureFilter} onValueChange={setSignatureFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Signatures" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Signatures</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex space-x-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Start Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-start-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "End Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>
                Contracts ({filteredContracts.length})
              </CardTitle>
              <CardDescription>
                {filteredContracts.length === contracts.length 
                  ? `Showing all ${contracts.length} contracts`
                  : `Showing ${filteredContracts.length} of ${contracts.length} contracts`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractList contracts={filteredContracts} onEdit={handleEditContract} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateLibrary 
            selectionMode={false} 
            onBack={() => {}} 
            onTemplateSelect={() => {}} 
          />
        </TabsContent>

        {isDemo && (
          <TabsContent value="demo">
            <DemoContracts onLoadDemo={() => {}} />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update the contract details below.
            </DialogDescription>
          </DialogHeader>
          {editingContract && (
            <EditContractForm 
              contract={editingContract}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingContract(null);
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingContract(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}