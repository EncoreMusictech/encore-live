import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Upload, Calendar, DollarSign, Users, Search, Filter, ArrowLeft } from "lucide-react";
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
import { DemoPublishingContracts } from "@/components/contracts/DemoPublishingContracts";
import { DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { CopyrightWritersDebug } from "@/components/debug/CopyrightWritersDebug";
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

  // Calculate real-time stats from contract data
  const activeContracts = contracts?.filter(c => c.contract_status === 'active' || c.contract_status === 'signed') || [];
  const pendingSignatures = contracts?.filter(c => c.signature_status === 'pending' || c.signature_status === 'sent') || [];
  const expiringContracts = contracts?.filter(c => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && endDate >= new Date();
  }) || [];
  
  const totalValue = contracts?.reduce((sum, contract) => {
    return sum + (contract.advance_amount || 0);
  }, 0) || 0;

  const stats = [
    { 
      title: "Active Contracts", 
      value: activeContracts.length.toString(), 
      change: contracts && contracts.length > 0 ? `${contracts.length} total` : "No contracts yet"
    },
    { 
      title: "Pending Signatures", 
      value: pendingSignatures.length.toString(), 
      change: pendingSignatures.length > 2 ? `${pendingSignatures.length - 2} urgent` : "On track"
    },
    { 
      title: "Expiring Soon", 
      value: expiringContracts.length.toString(), 
      change: "Next 30 days"
    },
    { 
      title: "Total Value", 
      value: `$${totalValue.toLocaleString()}`, 
      change: activeContracts.length > 0 ? `${activeContracts.length} active deals` : "No active deals"
    }
  ];

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


        {/* Real-time Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  {index === 0 && <FileText className="h-4 w-4" />}
                  {index === 1 && <Users className="h-4 w-4" />}
                  {index === 2 && <Calendar className="h-4 w-4" />}
                  {index === 3 && <DollarSign className="h-4 w-4" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts">All Contracts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts">
            <ContractList onEdit={handleEditContract} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateLibrary />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['draft', 'signed', 'active', 'expired', 'terminated'].map((status) => {
                      const count = contracts?.filter(c => c.contract_status === status).length || 0;
                      const percentage = contracts && contracts.length > 0 ? (count / contracts.length * 100).toFixed(1) : 0;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{count}</span>
                            <span className="text-xs text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contract Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contractTypes.map((type) => {
                      const count = contracts?.filter(c => c.contract_type === type.id).length || 0;
                      return (
                        <div key={type.id} className="flex items-center justify-between">
                          <span>{type.title}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
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