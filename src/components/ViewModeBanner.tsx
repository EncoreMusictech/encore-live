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
    <div className="fixed top-0 left-0 right-0 z-[9999] w-full border-b-2 border-warning bg-warning/95 text-warning-foreground shadow-lg">
      <div className="flex items-center justify-between w-full gap-4 px-4 py-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border shrink-0",
            isAggregateView 
              ? "bg-background/20 border-background/30" 
              : "bg-background/20 border-background/30"
          )}>
            {getModeIcon()}
            <span className="text-sm font-bold">
              {getModeLabel()}
            </span>
          </div>
          <span className="text-sm font-medium flex items-center gap-1 truncate">
            {renderBreadcrumb()}
            <span className="opacity-80 ml-2 hidden sm:inline">
              — All data is scoped to this account.
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Entity scope selector for companies with publishing entities */}
          <EntityScopeSelector />
          {/* Client scope selector for publishing firms */}
          <ClientScopeSelector />
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExit}
            className="font-bold"
          >
            <X className="h-4 w-4 mr-2" />
            Exit View Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
