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
import { PublishingAgreementForm } from "@/components/contracts/PublishingAgreementForm";
import { EditContractForm } from "@/components/contracts/EditContractForm";
import { TemplateLibrary } from "@/components/contracts/TemplateLibrary";
import { DocuSignImport } from "@/components/contracts/DocuSignImport";
import { DemoPublishingContracts } from "@/components/contracts/DemoPublishingContracts";
import { DemoPublishingContract } from "@/data/demo-publishing-contracts";
import { CopyrightWritersDebug } from "@/components/debug/CopyrightWritersDebug";

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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
                <DialogDescription>
                  Complete all sections to create your agreement
                </DialogDescription>
              </DialogHeader>
              
              {/* Use the Publishing Agreement Form directly for the step-by-step flow */}
              <PublishingAgreementForm 
                onCancel={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedContractType(null);
                  setCreationMethod(null);
                  setSelectedDemoData(null);
                }}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedContractType(null);
                  setCreationMethod(null);
                  setSelectedDemoData(null);
                }}
                demoData={selectedDemoData}
              />
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="demos">Demo Contracts</TabsTrigger>
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
            <DemoPublishingContracts 
              onLoadDemo={(demoContract: DemoPublishingContract) => {
                // Store the demo data and open the form
                setSelectedDemoData(demoContract);
                setSelectedContractType("publishing");
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
              
              {/* Temporary Debug Component */}
              <CopyrightWritersDebug />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractManagement;