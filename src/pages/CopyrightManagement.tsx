import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Music, FileText, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCopyright } from "@/hooks/useCopyright";
import { EnhancedCopyrightForm } from "@/components/copyright/EnhancedCopyrightForm";
import { AudioPlayer } from "@/components/copyright/AudioPlayer";
import { CopyrightTable } from "@/components/copyright/CopyrightTable";


const CopyrightManagement = () => {
  const { toast } = useToast();
  const { copyrights, loading, getWritersForCopyright, refetch } = useCopyright();
  const [writers, setWriters] = useState<{[key: string]: any[]}>({});
  const [editingCopyright, setEditingCopyright] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("copyrights");

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

  const handleEditSuccess = () => {
    refetch();
    setEditingCopyright(null);
    setIsEditDialogOpen(false);
    toast({
      title: "Copyright Updated",
      description: "Your copyright work has been successfully updated."
    });
  };

  const handleEditCancel = () => {
    setEditingCopyright(null);
    setIsEditDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Copyright Management</h1>
          <p className="text-muted-foreground">
            Register and track copyrights with split assignments and metadata management
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="copyrights">My Copyrights</TabsTrigger>
            <TabsTrigger value="register">Register New</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="copyrights" className="space-y-6">
            <CopyrightTable 
              copyrights={copyrights}
              writers={writers}
              loading={loading}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="register">
            <EnhancedCopyrightForm 
              onSuccess={() => {
                refetch();
                toast({
                  title: "Copyright Created",
                  description: "Your copyright work has been successfully created with all metadata."
                });
              }}
              onCancel={() => {}}
            />
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
                    {copyrights.filter(c => c.registration_status === "fully_registered").length}
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
                    {copyrights.filter(c => c.registration_status === "pending_registration").length}
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
          </TabsContent>
        </Tabs>

        {/* Edit Copyright Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Copyright - {editingCopyright?.work_title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              <EnhancedCopyrightForm 
                editingCopyright={editingCopyright}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CopyrightManagement;