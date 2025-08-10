import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface EmailRestrictedRouteProps {
  children: React.ReactNode;
  allowedEmails: string[];
  redirectTo?: string;
}

const EmailRestrictedRoute = ({ children, allowedEmails, redirectTo = "/" }: EmailRestrictedRouteProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const email = user?.email?.toLowerCase() || "";
  const isAllowed = allowedEmails.map(e => e.toLowerCase()).includes(email);

  useEffect(() => {
    if (!isAllowed && email) {
      toast({
        title: "Access restricted",
        description: "This page is limited to authorized users.",
        variant: "destructive",
      });
    }
  }, [isAllowed, email, toast]);

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default EmailRestrictedRoute;
