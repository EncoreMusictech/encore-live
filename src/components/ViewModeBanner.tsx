import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye, X, Building2, Users, ChevronRight } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';
import { ClientScopeSelector } from './hierarchy/ClientScopeSelector';
import { EntityScopeSelector } from './hierarchy/EntityScopeSelector';
import { cn } from '@/lib/utils';

export function ViewModeBanner() {
  const { 
    isViewingAsSubAccount, 
    isViewingAsClient,
    isAggregateView,
    viewContext, 
    exitViewMode 
  } = useViewMode();
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

  // Determine the label based on view mode
  const getModeLabel = () => {
    if (isAggregateView) {
      return 'Viewing All Clients';
    }
    if (isViewingAsClient) {
      return 'Viewing Client Label';
    }
    return 'Viewing as Sub-Account';
  };

  const getModeIcon = () => {
    if (isAggregateView) {
      return <Users className="h-4 w-4 text-warning-foreground animate-pulse" />;
    }
    if (isViewingAsClient) {
      return <Building2 className="h-4 w-4 text-warning-foreground animate-pulse" />;
    }
    return <Eye className="h-4 w-4 text-warning-foreground animate-pulse" />;
  };

  // Build breadcrumb for hierarchical view
  const renderBreadcrumb = () => {
    const crumbs = [];

    // Parent company in hierarchy
    if (viewContext.parentCompanyName && viewContext.companyName !== viewContext.parentCompanyName) {
      crumbs.push(
        <span key="parent" className="text-muted-foreground">
          {viewContext.parentCompanyName}
        </span>
      );
      crumbs.push(
        <ChevronRight key="sep" className="h-3 w-3 text-muted-foreground" />
      );
    }

    // Current company
    crumbs.push(
      <span key="current" className="font-bold">
        {isAggregateView ? 'All Clients' : viewContext.companyName}
      </span>
    );

    return crumbs;
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-warning/10 backdrop-blur supports-[backdrop-filter]:bg-warning/5">
      <Alert className="rounded-none border-0 bg-transparent py-3">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border",
              isAggregateView 
                ? "bg-primary/20 border-primary/30" 
                : "bg-warning/20 border-warning/30"
            )}>
              {getModeIcon()}
              <span className={cn(
                "text-sm font-semibold",
                isAggregateView ? "text-primary" : "text-warning-foreground"
              )}>
                {getModeLabel()}
              </span>
            </div>
            <AlertDescription className="text-sm font-medium m-0 flex items-center gap-1">
              {renderBreadcrumb()}
              <span className="text-muted-foreground ml-2">
                — All data and permissions are limited to this scope.
              </span>
            </AlertDescription>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Entity scope selector for companies with publishing entities */}
            <EntityScopeSelector />
            {/* Client scope selector for publishing firms */}
            <ClientScopeSelector />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExit}
              className="border-warning/30 hover:bg-warning/20"
            >
              <X className="h-4 w-4 mr-2" />
              Exit View Mode
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
