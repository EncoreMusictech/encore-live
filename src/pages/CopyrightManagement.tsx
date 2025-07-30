import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Music, FileText, Users, CheckCircle, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useCopyright } from "@/hooks/useCopyright";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useSubscription } from "@/hooks/useSubscription";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { EnhancedCopyrightForm } from "@/components/copyright/EnhancedCopyrightForm";
import { AudioPlayer } from "@/components/copyright/AudioPlayer";
import { CopyrightTable } from "@/components/copyright/CopyrightTable";
import { BulkUpload } from "@/components/copyright/BulkUpload";
import { ActivityLog } from "@/components/copyright/ActivityLog";
import { CopyrightValidationPanel } from "@/components/copyright/CopyrightValidationPanel";
import { ExportDialog } from "@/components/copyright/ExportDialog";
import { SenderCodeOnboarding } from "@/components/copyright/SenderCodeOnboarding";
import { TransmissionHistory } from "@/components/copyright/TransmissionHistory";


const CopyrightManagement = () => {
  const { toast } = useToast();
  const { copyrights, loading, realtimeError, getWritersForCopyright, deleteCopyright, refetch } = useCopyright();
  const { canAccess } = useDemoAccess();
  const { subscribed } = useSubscription();
  const [writers, setWriters] = useState<{[key: string]: any[]}>({});
  const [editingCopyright, setEditingCopyright] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("copyrights");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedCopyrights, setSelectedCopyrights] = useState<any[]>([]);
  
  // Only show demo navigation for non-subscribers
  const showDemoNavigation = !subscribed;

  // Debug logging
  useEffect(() => {
    console.log('CopyrightManagement - Data debug:', {
      copyrightsCount: copyrights.length,
      loading,
      realtimeError,
      firstThreeCopyrights: copyrights.slice(0, 3).map(c => ({ id: c.id, work_title: c.work_title, created_at: c.created_at }))
    });
  }, [copyrights, loading, realtimeError]);

  useEffect(() => {
    updatePageMetadata('copyrightManagement');
  }, []);

  // Load writers for each copyright
  useEffect(() => {
    const loadWriters = async () => {
      const writersData: {[key: string]: any[]} = {};
      for (const copyright of copyrights) {
        try {
          const copyrightWriters = await getWritersForCopyright(copyright.id);
          writersData[copyright.id] = copyrightWriters;
        } catch (error) {
          console.error('Error loading writers:', error);
        }
      }
      setWriters(writersData);
    };

    if (copyrights.length > 0) {
      loadWriters();
    }
  }, [copyrights, getWritersForCopyright]);


  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_registered':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Fully Registered</Badge>;
      case 'pending_registration':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'needs_amendment':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Needs Amendment</Badge>;
      case 'not_registered':
      default:
        return <Badge variant="outline">Not Registered</Badge>;
    }
  };

  const getRegistrationProgress = (status: string) => {
    switch (status) {
      case 'not_registered': return 0;
      case 'pending_registration': return 33;
      case 'needs_amendment': return 66;
      case 'fully_registered': return 100;
      default: return 0;
    }
  };

  const calculateControlledShare = (copyrightWriters: any[]) => {
    return copyrightWriters
      .filter(w => w.controlled_status === 'C')
      .reduce((sum, w) => sum + w.ownership_percentage, 0);
  };

  const handleEdit = (copyright: any) => {
    setEditingCopyright(copyright);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    console.log('handleEditSuccess called, refreshing copyright data...');
    setEditingCopyright(null);
    setIsEditDialogOpen(false);
    
    // Immediately refetch the data to ensure table updates
    try {
      await refetch();
      
      toast({
        title: "Copyright Updated", 
        description: "Your copyright work has been successfully updated."
      });
      
      console.log('Copyright data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing copyright data:', error);
      toast({
        title: "Refresh Error",
        description: "Data was saved but failed to refresh the table. Please reload the page.",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async (copyrights: any[]) => {
    try {
      // Delete copyrights one by one
      for (const copyright of copyrights) {
        await deleteCopyright(copyright.id);
      }
      
      toast({
        title: "Copyrights Deleted",
        description: `Successfully deleted ${copyrights.length} copyright${copyrights.length > 1 ? 's' : ''}.`
      });
    } catch (error) {
      console.error('Error deleting copyrights:', error);
      toast({
        title: "Deletion Error",
        description: "Some copyrights could not be deleted. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCancel = () => {
    setEditingCopyright(null);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (copyright: any) => {
    try {
      await deleteCopyright(copyright.id);
      // No need to refetch as the deleteCopyright function in the hook already updates the state
    } catch (error) {
      console.error('Error deleting copyright:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back to Demo Modules - Only show for non-subscribers */}
        {showDemoNavigation && (
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
        )}
        {/* Demo Limit Banner */}
        <DemoLimitBanner module="copyrightManagement" className="mb-6" />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Copyright Management</h1>
          <p className="text-muted-foreground">
            Register and track copyrights with split assignments and metadata management
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="copyrights">My Copyrights</TabsTrigger>
            <TabsTrigger value="cwr-ddex-export">CWR/DDEX Export</TabsTrigger>
            <TabsTrigger value="register" disabled={!canAccess('copyrightManagement')}>
              {canAccess('copyrightManagement') ? 'Register New' : 'Demo Limit Reached'}
            </TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="copyrights" className="space-y-6">
            <CopyrightTable 
              copyrights={copyrights}
              writers={writers}
              loading={loading}
              realtimeError={realtimeError}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
            />
          </TabsContent>


          <TabsContent value="cwr-ddex-export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  CWR/DDEX Export Center
                </CardTitle>
                <CardDescription>
                  Export your copyright catalog in industry-standard CWR (Common Works Registration) or DDEX (Digital Data Exchange) formats. 
                  These formats are used for registering works with performing rights organizations and digital music platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nested Tabs for CWR/DDEX functionality */}
                <Tabs defaultValue="export" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="export">Export Works</TabsTrigger>
                    <TabsTrigger value="transmission-history">Transmission History</TabsTrigger>
                    <TabsTrigger value="sender-codes">Sender Codes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="export" className="space-y-6 mt-6">
                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">
                            {copyrights.filter(c => {
                              const copyrightWriters = writers[c.id] || [];
                              const hasRequiredFields = c.work_title && c.language_code && copyrightWriters.length > 0;
                              const validShares = copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) <= 100;
                              return hasRequiredFields && validShares;
                            }).length}
                          </div>
                          <p className="text-sm text-muted-foreground">CWR Ready</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-blue-600">
                            {copyrights.filter(c => {
                              const hasStructuredData = c.work_title && c.iswc && c.language_code;
                              return hasStructuredData;
                            }).length}
                          </div>
                          <p className="text-sm text-muted-foreground">DDEX Ready</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-orange-600">
                            {copyrights.filter(c => {
                              const copyrightWriters = writers[c.id] || [];
                              const hasIssues = !c.work_title || !c.language_code || copyrightWriters.length === 0 ||
                                               copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) > 100;
                              return hasIssues;
                            }).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Need Validation</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {copyrights.length}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Works</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Export Actions */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Button 
                        onClick={() => {
                          setSelectedCopyrights(copyrights.filter(c => {
                            const copyrightWriters = writers[c.id] || [];
                            const hasRequiredFields = c.work_title && c.language_code && copyrightWriters.length > 0;
                            const validShares = copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) <= 100;
                            return hasRequiredFields && validShares;
                          }));
                          setShowExportDialog(true);
                        }}
                        disabled={copyrights.filter(c => {
                          const copyrightWriters = writers[c.id] || [];
                          const hasRequiredFields = c.work_title && c.language_code && copyrightWriters.length > 0;
                          const validShares = copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) <= 100;
                          return hasRequiredFields && validShares;
                        }).length === 0}
                        size="lg"
                        className="h-20 flex-col gap-2"
                      >
                        <FileText className="w-6 h-6" />
                        Export CWR Ready Works
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setSelectedCopyrights(copyrights.filter(c => {
                            const hasStructuredData = c.work_title && c.iswc && c.language_code;
                            return hasStructuredData;
                          }));
                          setShowExportDialog(true);
                        }}
                        disabled={copyrights.filter(c => {
                          const hasStructuredData = c.work_title && c.iswc && c.language_code;
                          return hasStructuredData;
                        }).length === 0}
                        variant="outline"
                        size="lg"
                        className="h-20 flex-col gap-2"
                      >
                        <FileText className="w-6 h-6" />
                        Export DDEX Ready Works
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setSelectedCopyrights(copyrights);
                          setShowExportDialog(true);
                        }}
                        disabled={copyrights.length === 0}
                        variant="outline"
                        size="lg"
                        className="h-20 flex-col gap-2"
                      >
                        <FileText className="w-6 h-6" />
                        Export All Works
                      </Button>
                    </div>

                    {/* Compliance Table */}
                    <CopyrightTable 
                      copyrights={copyrights}
                      writers={writers}
                      loading={loading}
                      realtimeError={realtimeError}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onBulkDelete={handleBulkDelete}
                    />
                  </TabsContent>
                  
                  <TabsContent value="transmission-history" className="space-y-6 mt-6">
                    <TransmissionHistory />
                  </TabsContent>
                  
                  <TabsContent value="sender-codes" className="space-y-6 mt-6">
                    <SenderCodeOnboarding />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <EnhancedCopyrightForm 
              onSuccess={() => {
                // Switch to the copyrights tab - let real-time updates handle the data refresh
                setActiveTab("copyrights");
                toast({
                  title: "Copyright Created",
                  description: "Your copyright work has been successfully created with all metadata."
                });
              }}
              onCancel={() => setActiveTab("copyrights")}
            />
          </TabsContent>

          <TabsContent value="bulk-upload">
            <BulkUpload 
              onSuccess={() => {
                refetch();
                setActiveTab("copyrights");
              }}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog />
          </TabsContent>


          <TabsContent value="analytics">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Copyrights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{copyrights.length}</div>
                  <p className="text-muted-foreground text-sm">Registered works</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fully Registered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {copyrights.filter(c => {
                      // Check if any PRO status contains "registered"
                      const ascapRegistered = (c as any).ascap_status?.toLowerCase().includes('registered');
                      const bmiRegistered = (c as any).bmi_status?.toLowerCase().includes('registered');
                      const socanRegistered = (c as any).socan_status?.toLowerCase().includes('registered');
                      const sesacRegistered = (c as any).sesac_status?.toLowerCase().includes('registered');
                      const mlcRegistered = (c as any).mlc_status?.toLowerCase().includes('registered');
                      
                      return ascapRegistered || bmiRegistered || socanRegistered || sesacRegistered || mlcRegistered ||
                             c.registration_status === "fully_registered" || 
                             c.registration_status === "registered";
                    }).length}
                  </div>
                  <p className="text-muted-foreground text-sm">Complete registration</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {copyrights.filter(c => 
                      c.status === "draft" ||
                      c.registration_status === "pending_registration" ||
                      c.registration_status === "pending"
                    ).length}
                  </div>
                  <p className="text-muted-foreground text-sm">Awaiting registration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Controlled Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {copyrights.filter(c => {
                      const copyrightWriters = writers[c.id] || [];
                      return calculateControlledShare(copyrightWriters) > 0;
                    }).length}
                  </div>
                  <p className="text-muted-foreground text-sm">With controlled shares</p>
                </CardContent>
              </Card>
            </div>
            
            {/* CWR/DDEX Compliance Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>CWR/DDEX Compliance Overview</CardTitle>
                <CardDescription>
                  Monitor compliance status across your copyright portfolio for industry-standard exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                       {copyrights.filter(c => {
                         const copyrightWriters = writers[c.id] || [];
                         const hasRequiredFields = c.work_title && c.language_code && copyrightWriters.length > 0;
                         const validShares = copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) <= 100;
                         return hasRequiredFields && validShares;
                       }).length}
                    </div>
                    <p className="text-sm text-muted-foreground">CWR Ready</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {copyrights.filter(c => {
                        const hasStructuredData = c.work_title && c.iswc && c.language_code;
                        return hasStructuredData;
                      }).length}
                    </div>
                    <p className="text-sm text-muted-foreground">DDEX Ready</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                       {copyrights.filter(c => {
                         const copyrightWriters = writers[c.id] || [];
                         const hasIssues = !c.work_title || !c.language_code || copyrightWriters.length === 0 ||
                                          copyrightWriters.reduce((sum, w) => sum + w.ownership_percentage, 0) > 100;
                         return hasIssues;
                       }).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Need Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Copyright Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Copyright - {editingCopyright?.work_title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-6">
              {/* Validation Panel */}
              {editingCopyright && (
                <CopyrightValidationPanel
                  copyright={editingCopyright}
                  writers={writers[editingCopyright.id] || []}
                  publishers={[]}
                  onValidationComplete={(result) => {
                    console.log('Validation completed:', result);
                  }}
                />
              )}
              
              <EnhancedCopyrightForm 
                editingCopyright={editingCopyright}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          selectedCopyrights={selectedCopyrights.map(c => c.id)}
          copyrightTitles={selectedCopyrights.reduce((acc: { [key: string]: string }, c: any) => {
            acc[c.id] = c.work_title || 'Untitled';
            return acc;
          }, {})}
        />
      </main>
    </div>
  );
};

export default CopyrightManagement;