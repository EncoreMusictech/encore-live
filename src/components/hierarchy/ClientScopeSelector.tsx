import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';
import { cn } from '@/lib/utils';

interface ClientScopeSelectorProps {
  className?: string;
}

export function ClientScopeSelector({ className }: ClientScopeSelectorProps) {
  const { viewContext, setViewScope, isAggregateView } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);

  // Get the parent company ID (could be the current company if it's a publishing firm)
  const parentCompanyId = viewContext?.parentCompanyId || viewContext?.companyId;
  
  const { childCompanies, loading, isPublishingFirm, hasChildren } = useClientHierarchy(
    parentCompanyId || undefined
  );

  // Only show selector for publishing firms with children
  if (!viewContext || !hasChildren) {
    return null;
  }

  const currentSelection = isAggregateView 
    ? 'All Clients' 
    : viewContext.companyName || 'Select Client';

  const handleSelectAll = () => {
    if (parentCompanyId) {
      setViewScope('all', parentCompanyId);
    }
    setIsOpen(false);
  };

  const handleSelectClient = (companyId: string) => {
    setViewScope('single', companyId);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex items-center gap-2 min-w-[180px] justify-between',
            isAggregateView && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <div className="flex items-center gap-2">
            {isAggregateView ? (
              <Users className="h-4 w-4 text-primary" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="truncate max-w-[140px]">{currentSelection}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          View Scope
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* All Clients option */}
        <DropdownMenuItem 
          onClick={handleSelectAll}
          className={cn(
            'flex items-center justify-between',
            isAggregateView && 'bg-primary/10'
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>All Clients</span>
          </div>
          {isAggregateView && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Individual Clients
        </DropdownMenuLabel>
        
        {loading ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Loading...</span>
          </DropdownMenuItem>
        ) : childCompanies.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No client labels</span>
          </DropdownMenuItem>
        ) : (
          childCompanies.map((client) => {
            const isSelected = !isAggregateView && viewContext.companyId === client.company_id;
            return (
              <DropdownMenuItem
                key={client.company_id}
                onClick={() => handleSelectClient(client.company_id)}
                className={cn(
                  'flex items-center justify-between',
                  isSelected && 'bg-primary/10'
                )}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate max-w-[140px]">
                    {client.display_name || client.company_name}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
