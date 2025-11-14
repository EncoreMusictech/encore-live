import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';

export function ViewModeBanner() {
  const { isViewingAsSubAccount, viewContext, exitViewMode } = useViewMode();
  const { toast } = useToast();

  if (!isViewingAsSubAccount || !viewContext) {
    return null;
  }

  const handleExit = () => {
    exitViewMode();
    toast({
      title: 'View Restored',
      description: 'Returned to system administrator view',
    });
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-warning/10 backdrop-blur supports-[backdrop-filter]:bg-warning/5">
      <Alert className="rounded-none border-0 bg-transparent py-3">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/20 border border-warning/30">
              <Eye className="h-4 w-4 text-warning-foreground animate-pulse" />
              <span className="text-sm font-semibold text-warning-foreground">
                Viewing as Sub-Account
              </span>
            </div>
            <AlertDescription className="text-sm font-medium m-0">
              You are viewing the system as <span className="font-bold">{viewContext.companyName}</span>. 
              All data and permissions are limited to this sub-account's view.
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="shrink-0 border-warning/30 hover:bg-warning/20"
          >
            <X className="h-4 w-4 mr-2" />
            Exit View Mode
          </Button>
        </div>
      </Alert>
    </div>
  );
}
