import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

export function DataSeedButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();

  // Only show to ENCORE admin
  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech'];
  const isAuthorized = adminEmails.includes(user?.email?.toLowerCase() || '') || isAdmin;

  const seedData = async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('operations-data-seeder');
      
      if (error) throw error;
      
      toast({
        title: "Data Seeded Successfully",
        description: "Sample operations data has been created for testing.",
      });
      
      // Refresh the page to show new data
      window.location.reload();
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast({
        title: "Seeding Failed", 
        description: error.message || "Failed to seed operations data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Development Setup
        </CardTitle>
        <CardDescription>
          Seed sample operations data for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={seedData} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed Sample Data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This will create sample customer health metrics, support tickets, and revenue events for demonstration purposes.
        </p>
      </CardContent>
    </Card>
  );
}