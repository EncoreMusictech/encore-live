import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CopyrightTable } from "@/components/copyright/CopyrightTable";
import { CopyrightForm } from "@/components/copyright/CopyrightForm";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CRMCopyrightPage() {
  const [copyrights, setCopyrights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCopyrights();
  }, []);

  const fetchCopyrights = async () => {
    try {
      const { data, error } = await supabase
        .from('copyrights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch copyrights",
          variant: "destructive",
        });
        return;
      }

      setCopyrights(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchCopyrights();
    toast({
      title: "Success",
      description: "Copyright work registered successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading copyright works...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Copyright Management</h1>
          <p className="text-muted-foreground">
            Register and track your musical works and copyright ownership
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Work
        </Button>
      </div>

      <Tabs defaultValue="works" className="space-y-4">
        <TabsList>
          <TabsTrigger value="works">Registered Works</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="works" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Copyright Works ({copyrights.length})</CardTitle>
              <CardDescription>
                Manage your registered musical works and track ownership splits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyrightTable 
                copyrights={copyrights} 
                onUpdate={fetchCopyrights}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{copyrights.length}</div>
                <p className="text-muted-foreground text-sm">Registered works</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {copyrights.filter(c => {
                    const date = new Date(c.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </div>
                <p className="text-muted-foreground text-sm">New registrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">98%</div>
                <p className="text-muted-foreground text-sm">Compliance rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Copyright registration compliance and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Copyright Registration</h4>
                    <p className="text-sm text-muted-foreground">All works properly registered</p>
                  </div>
                  <div className="text-success font-medium">Complete</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ownership Splits</h4>
                    <p className="text-sm text-muted-foreground">All splits properly documented</p>
                  </div>
                  <div className="text-success font-medium">Complete</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">PRO Registration</h4>
                    <p className="text-sm text-muted-foreground">Performance rights organization filing</p>
                  </div>
                  <div className="text-orange-600 font-medium">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Register New Work</h2>
                <Button variant="ghost" onClick={() => setShowForm(false)}>×</Button>
              </div>
              <CopyrightForm onSuccess={handleFormSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}