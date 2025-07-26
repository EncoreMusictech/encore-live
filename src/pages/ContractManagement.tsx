import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Upload, Calendar, DollarSign, Users, Search, Filter, ArrowLeft, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { ContractList } from "@/components/contracts/ContractList";
import { EnhancedContractForm } from "@/components/contracts/EnhancedContractForm";
import { OrganizedContractForm } from "@/components/contracts/OrganizedContractForm";
import { PublishingAgreementForm } from "@/components/contracts/PublishingAgreementForm";
import { EditContractForm } from "@/components/contracts/EditContractForm";
import { TemplateLibrary } from "@/components/contracts/TemplateLibrary";
import { DocuSignImport } from "@/components/contracts/DocuSignImport";
import { ContractUpload } from "@/components/contracts/ContractUpload";
import { DemoContracts } from "@/components/contracts/DemoContracts";
import { DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { DemoArtistContract } from "@/data/demo-artist-contracts";
import { CopyrightWritersDebug } from "@/components/debug/CopyrightWritersDebug";
import { ArtistAgreementForm } from "@/components/contracts/ArtistAgreementForm";
import { useContracts } from "@/hooks/useContracts";

const ContractManagement = () => {
  const [activeTab, setActiveTab] = useState("contracts");
  const { canAccess } = useDemoAccess();
  const { contracts, loading } = useContracts();

  useEffect(() => {
    updatePageMetadata('contractManagement');
  }, []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [creationMethod, setCreationMethod] = useState<string | null>(null);
  const [showDocuSignImport, setShowDocuSignImport] = useState(false);
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [selectedDemoData, setSelectedDemoData] = useState<DemoPublishingContract | null>(null);

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setIsEditDialogOpen(true);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back to Demo Modules */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link to="/demo-modules">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo Modules
            </Link>
          </Button>
        </div>
        {/* Demo Limit Banner */}
        <DemoLimitBanner module="contractManagement" className="mb-6" />

        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contract Management</h1>
            <p className="text-muted-foreground">
              Simulate, upload, generate, and manage music industry agreements with automated royalty extraction.
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            console.log('Dialog state changing:', open);
            setIsCreateDialogOpen(open);
            if (!open) {
              // Reset all states when dialog closes
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
                onClick={() => console.log('New Contract button clicked')}
              >
                <Plus className="h-4 w-4" />
                {canAccess('contractManagement') ? 'New Contract' : 'Demo Limit Reached'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                      <CardTitle className="text-lg">Use Template</CardTitle>
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
                    onTemplateSelect={(template) => {
                      setSelectedContractType(template.contract_type);
                      // Pre-fill form with template data
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
                          <CardTitle className="text-lg">Upload PDF</CardTitle>
                          <CardDescription>
                            Upload a contract PDF and we'll extract the key terms
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            className="w-full" 
                            onMouseDown={() => console.log('Choose File - mouse down')}
                            onMouseUp={() => console.log('Choose File - mouse up')}
                            onTouchStart={() => console.log('Choose File - touch start')}
                            onClick={(e) => {
                              console.log('Choose File button clicked - event details:', e);
                              console.log('Event target:', e.target);
                              console.log('Current target:', e.currentTarget);
                              console.log('Current states before update:', { 
                                creationMethod, 
                                showContractUpload, 
                                showDocuSignImport,
                                isCreateDialogOpen 
                              });
                              e.preventDefault();
                              e.stopPropagation();
                              setShowContractUpload(true);
                              console.log('showContractUpload set to true');
                            }}
                            type="button"
                          >
                            Choose File
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : showDocuSignImport ? (
                  // DocuSign Import Flow
                  <DocuSignImport
                    onBack={() => setShowDocuSignImport(false)}
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                      setShowDocuSignImport(false);
                    }}
                  />
                ) : showContractUpload ? (
                  // Contract Upload Flow
                  <ContractUpload
                    onBack={() => setShowContractUpload(false)}
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedContractType(null);
                      setCreationMethod(null);
                      setShowContractUpload(false);
                    }}
                  />
                ) : null
              ) : (
                 // Step 3: Contract form based on type
                 selectedContractType === "publishing" ? (
                   <PublishingAgreementForm 
                      onCancel={() => {
                        setSelectedContractType(null);
                        setCreationMethod(null);
                        setSelectedDemoData(null);
                        setShowContractUpload(false);
                        setShowDocuSignImport(false);
                      }}
                      onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        setSelectedContractType(null);
                        setCreationMethod(null);
                        setSelectedDemoData(null);
                        setShowContractUpload(false);
                        setShowDocuSignImport(false);
                      }}
                     demoData={selectedDemoData}
                   />
                 ) : selectedContractType === "artist" ? (
                   <ArtistAgreementForm />
                 ) : (
                   <OrganizedContractForm 
                     contractType={selectedContractType}
                      onCancel={() => {
                        setSelectedContractType(null);
                        setCreationMethod(null);
                        setSelectedDemoData(null);
                        setShowContractUpload(false);
                        setShowDocuSignImport(false);
                      }}
                      onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        setSelectedContractType(null);
                        setCreationMethod(null);
                        setSelectedDemoData(null);
                        setShowContractUpload(false);
                        setShowDocuSignImport(false);
                      }}
                   />
                 )
               )}
            </DialogContent>
          </Dialog>

          {/* Edit Contract Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Contract</DialogTitle>
                <DialogDescription>
                  Update your contract details and manage parties and works.
                </DialogDescription>
              </DialogHeader>
              
              {editingContract && (
                <EditContractForm 
                  contract={editingContract}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    setEditingContract(null);
                  }}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    setEditingContract(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="bg-primary/10 rounded-lg p-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="demos">Demos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search contracts by title, counterparty, or type..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            <ContractList onEdit={handleEditContract} />
          </TabsContent>

          <TabsContent value="demos">
            <DemoContracts 
              onLoadDemo={(demoContract: DemoPublishingContract | DemoArtistContract) => {
                // Store the demo data and open the form
                setSelectedDemoData(demoContract);
                // Determine contract type based on agreement type
                if (demoContract.agreementType === "artist" || demoContract.agreementType === "distribution") {
                  setSelectedContractType(demoContract.agreementType);
                } else {
                  setSelectedContractType("publishing");
                }
                setCreationMethod("new");
                setIsCreateDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateLibrary />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Contract Status Distribution */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Status Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of contracts by current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contracts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No contracts to analyze</p>
                        <p className="text-sm">Create your first contract to see analytics</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const statusCounts = contracts.reduce((acc, contract) => {
                            const status = contract.contract_status || 'draft';
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          return Object.entries(statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'outline'}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {count} contract{count !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <span className="font-medium">
                                {Math.round((count / contracts.length) * 100)}%
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contract Types</CardTitle>
                    <CardDescription>
                      Distribution by agreement type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contracts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No contract types to show</p>
                        <p className="text-sm">Create contracts to see type distribution</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const typeCounts = contracts.reduce((acc, contract) => {
                            const type = contract.contract_type || 'other';
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          return Object.entries(typeCounts).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                <span className="capitalize">
                                  {type.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{count}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({Math.round((count / contracts.length) * 100)}%)
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest contract updates and changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Contract updates will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contracts
                        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                        .slice(0, 5)
                        .map((contract) => (
                          <div key={contract.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                            <div>
                              <p className="font-medium">{contract.title}</p>
                              <p className="text-sm text-muted-foreground">
                                with {contract.counterparty_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={contract.contract_status === 'active' ? 'default' : 'secondary'}>
                                {contract.contract_status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(contract.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractManagement;