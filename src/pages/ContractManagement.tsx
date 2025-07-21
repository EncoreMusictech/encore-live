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
import { FileText, Plus, Upload, Calendar, DollarSign, Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ContractList } from "@/components/contracts/ContractList";
import { EnhancedContractForm } from "@/components/contracts/EnhancedContractForm";
import { OrganizedContractForm } from "@/components/contracts/OrganizedContractForm";
import { EditContractForm } from "@/components/contracts/EditContractForm";
import { TemplateLibrary } from "@/components/contracts/TemplateLibrary";
import { DocuSignImport } from "@/components/contracts/DocuSignImport";

const ContractManagement = () => {
  const [activeTab, setActiveTab] = useState("contracts");
  const { canAccess } = useDemoAccess();

  useEffect(() => {
    updatePageMetadata('contractManagement');
  }, []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [creationMethod, setCreationMethod] = useState<string | null>(null);
  const [showDocuSignImport, setShowDocuSignImport] = useState(false);

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setIsEditDialogOpen(true);
  };

  const contractTypes = [
    {
      id: "publishing",
      title: "Publishing Agreement",
      description: "Admin, CoPub, Full Pub, or JV deals with royalty splits",
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

  const stats = [
    { title: "Active Contracts", value: "24", change: "+3 this month" },
    { title: "Pending Signatures", value: "5", change: "2 urgent" },
    { title: "Expiring Soon", value: "8", change: "Next 30 days" },
    { title: "Total Value", value: "$2.4M", change: "+12% this quarter" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
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
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2" 
                disabled={!canAccess('contractManagement')}
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
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          id="contract-upload"
                          onChange={(e) => {
                            // Handle file upload
                            console.log('File uploaded:', e.target.files?.[0]);
                          }}
                        />
                        <Button 
                          className="w-full" 
                          onClick={() => document.getElementById('contract-upload')?.click()}
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
                 ) : (
                   // Step 3: Organized Contract form
                   <OrganizedContractForm 
                     contractType={selectedContractType}
                     onCancel={() => {
                       setSelectedContractType(null);
                       setCreationMethod(null);
                     }}
                     onSuccess={() => {
                       setIsCreateDialogOpen(false);
                       setSelectedContractType(null);
                       setCreationMethod(null);
                     }}
                   />
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
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
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

          <TabsContent value="templates">
            <TemplateLibrary />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Contract Analytics</CardTitle>
                <CardDescription>
                  Insights into your contract portfolio and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractManagement;