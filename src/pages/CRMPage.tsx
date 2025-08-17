import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CRMPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptInvitation } = useClientPortal();
  const { toast } = useToast();
  const token = searchParams.get('token');

  useEffect(() => {
    const handleInvitationAcceptance = async () => {
      if (token && user) {
        try {
          const result = await acceptInvitation(token);
          if (result) {
            toast({
              title: "Welcome to the CRM!",
              description: "Your invitation has been accepted and you now have access to the CRM system.",
            });
            // Remove token from URL
            navigate('/crm', { replace: true });
          }
        } catch (error: any) {
          console.error('Failed to accept invitation:', error);
          toast({
            title: "Invitation Error",
            description: "There was an issue accepting your invitation. Please contact support if this continues.",
            variant: "destructive"
          });
        }
      }
    };

    if (user && token) {
      handleInvitationAcceptance();
    }
  }, [token, user, acceptInvitation, navigate, toast]);

  // Show loading if we're processing an invitation
  if (token && user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <div>Processing invitation...</div>
        </CardContent>
      </Card>
    );
  }

  return <CRMDashboard />;
}