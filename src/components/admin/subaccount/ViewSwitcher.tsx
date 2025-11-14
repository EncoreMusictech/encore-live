import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ViewSwitcherProps {
  companyId: string;
  companyName: string;
}

export function ViewSwitcher({ companyId, companyName }: ViewSwitcherProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSwitchToSubAccountView = () => {
    setShowDialog(true);
  };

  const confirmSwitch = async () => {
    try {
      // Generate session ID for audit logging
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current user for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Log view mode entry for audit trail
        await supabase.rpc('log_admin_view_mode_action', {
          p_admin_user_id: user.id,
          p_session_id: sessionId,
          p_action_type: 'view_mode_entered',
          p_company_id: companyId,
          p_company_name: companyName,
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_request_path: window.location.pathname,
          p_risk_level: 'low'
        });
      }
      
      // Store current view context in sessionStorage with session ID
      sessionStorage.setItem('viewContext', JSON.stringify({
        mode: 'subaccount',
        companyId,
        companyName,
        returnPath: window.location.pathname,
        sessionId
      }));

      setIsViewMode(true);
      setShowDialog(false);

      // Dispatch custom event to notify ViewModeContext
      window.dispatchEvent(new Event('viewContextChanged'));

      toast({
        title: 'View Switched',
        description: `Now viewing as ${companyName} user`,
      });

      // Navigate to dashboard with sub-account context
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch view mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch view mode',
        variant: 'destructive'
      });
    }
  };

  const handleReturnToSystemView = () => {
    const context = sessionStorage.getItem('viewContext');
    if (context) {
      const { returnPath } = JSON.parse(context);
      sessionStorage.removeItem('viewContext');
      setIsViewMode(false);
      
      // Dispatch custom event to notify ViewModeContext
      window.dispatchEvent(new Event('viewContextChanged'));
      
      toast({
        title: 'View Restored',
        description: 'Returned to system administrator view',
      });

      navigate(returnPath || '/dashboard/operations');
    }
  };

  // Check if currently in view mode on mount
  useState(() => {
    const context = sessionStorage.getItem('viewContext');
    if (context) {
      const { mode, companyId: storedId } = JSON.parse(context);
      if (mode === 'subaccount' && storedId === companyId) {
        setIsViewMode(true);
      }
    }
  });

  if (isViewMode) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="animate-pulse">
          <Eye className="h-3 w-3 mr-1" />
          Viewing as {companyName}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleReturnToSystemView}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit View Mode
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleSwitchToSubAccountView}>
        <Eye className="h-4 w-4 mr-2" />
        View as User
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Sub-Account View?</AlertDialogTitle>
            <AlertDialogDescription>
              You will see the application as a user from <strong>{companyName}</strong> would see it.
              This helps you understand their experience and verify permissions.
              <br /><br />
              You can return to the system administrator view at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>
              Switch View
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
