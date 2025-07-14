import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Music, FileText, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCopyright } from "@/hooks/useCopyright";
import { EnhancedCopyrightForm } from "@/components/copyright/EnhancedCopyrightForm";
import { AudioPlayer } from "@/components/copyright/AudioPlayer";


const CopyrightManagement = () => {
  const { toast } = useToast();
  const { copyrights, loading, getWritersForCopyright, refetch } = useCopyright();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [writers, setWriters] = useState<{[key: string]: any[]}>({});

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

  const filteredCopyrights = copyrights.filter(copyright =>
    copyright.work_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.iswc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.work_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );


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

        <Tabs defaultValue="copyrights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="copyrights">My Copyrights</TabsTrigger>
            <TabsTrigger value="register">Register New</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="copyrights" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, songwriter, publisher, ISRC, or ISWC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Register Copyright
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading copyrights...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCopyrights.map((copyright) => {
                  const copyrightWriters = writers[copyright.id] || [];
                  const controlledShare = calculateControlledShare(copyrightWriters);
                  
                  return (
                    <Card key={copyright.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Music className="w-5 h-5" />
                              {copyright.work_title}
                              <Badge variant="outline" className="text-xs">
                                {copyright.work_id}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              Created on {new Date(copyright.created_at).toLocaleDateString()}
                              {copyright.album_title && ` • Album: ${copyright.album_title}`}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getRegistrationStatusBadge(copyright.registration_status || 'not_registered')}
                            <Progress 
                              value={getRegistrationProgress(copyright.registration_status || 'not_registered')}
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Metadata
                            </h4>
                            <div className="space-y-1 text-sm">
                              {copyright.iswc && <div><strong>ISWC:</strong> {copyright.iswc}</div>}
                              {copyright.masters_ownership && <div><strong>Masters:</strong> {copyright.masters_ownership}</div>}
                              {copyright.contains_sample && <div><Badge variant="secondary">Contains Sample</Badge></div>}
                              {copyright.akas && copyright.akas.length > 0 && (
                                <div><strong>AKAs:</strong> {copyright.akas.join(', ')}</div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Writers ({copyrightWriters.length})
                            </h4>
                            <div className="space-y-1 text-sm">
                              {copyrightWriters.slice(0, 3).map((writer, index) => (
                                <div key={index}>
                                  <strong>{writer.writer_name}</strong> ({writer.ownership_percentage}%)
                                  {writer.controlled_status === 'C' && (
                                    <Badge variant="secondary" className="ml-1 text-xs">Controlled</Badge>
                                  )}
                                  {writer.pro_affiliation && (
                                    <div className="text-muted-foreground text-xs">{writer.pro_affiliation}</div>
                                  )}
                                </div>
                              ))}
                              {copyrightWriters.length > 3 && (
                                <div className="text-muted-foreground text-xs">+{copyrightWriters.length - 3} more</div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Ownership & PRO
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <strong>Total Controlled:</strong> {controlledShare.toFixed(1)}%
                              </div>
                              {copyright.ascap_work_id && (
                                <Badge variant="outline" className="text-xs">ASCAP: {copyright.ascap_work_id}</Badge>
                              )}
                              {copyright.bmi_work_id && (
                                <Badge variant="outline" className="text-xs">BMI: {copyright.bmi_work_id}</Badge>
                              )}
                              {copyright.mp3_link && (
                                <div className="mt-2">
                                  <AudioPlayer 
                                    src={copyright.mp3_link}
                                    title={copyright.work_title}
                                    className="max-w-md"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredCopyrights.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No copyrights found</p>
                    <p className="text-sm">Try adjusting your search or register a new copyright</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="register">
            <EnhancedCopyrightForm 
              onSuccess={() => {
                setShowForm(false);
                refetch();
                toast({
                  title: "Copyright Created",
                  description: "Your copyright work has been successfully created with all metadata."
                });
              }}
              onCancel={() => setShowForm(false)}
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
      </main>
    </div>
  );
};

export default CopyrightManagement;