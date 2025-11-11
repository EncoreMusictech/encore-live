import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

  const confirmSwitch = () => {
    // Store current view context in sessionStorage
    sessionStorage.setItem('viewContext', JSON.stringify({
      mode: 'subaccount',
      companyId,
      companyName,
      returnPath: window.location.pathname
    }));

    setIsViewMode(true);
    setShowDialog(false);

    toast({
      title: 'View Switched',
      description: `Now viewing as ${companyName} user`,
    });

    // Navigate to dashboard with sub-account context
    navigate('/dashboard');
  };

  const handleReturnToSystemView = () => {
    const context = sessionStorage.getItem('viewContext');
    if (context) {
      const { returnPath } = JSON.parse(context);
      sessionStorage.removeItem('viewContext');
      setIsViewMode(false);
      
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
