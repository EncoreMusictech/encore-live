import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Layers, Check } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PublishingEntity {
  id: string;
  name: string;
  display_name?: string | null;
  administrator?: string | null;
  status: string;
}

export function EntityScopeSelector({ className }: { className?: string }) {
  const { viewContext, setPublishingEntity, isEntityFiltered } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);
  const [entities, setEntities] = useState<PublishingEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = viewContext?.companyId;

  useEffect(() => {
    if (!companyId) {
      setEntities([]);
      setLoading(false);
      return;
    }

    const fetchEntities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('publishing_entities')
          .select('id, name, display_name, administrator, status')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setEntities(data || []);
      } catch (err) {
        console.error('Error fetching publishing entities:', err);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [companyId]);

  // Don't render if no entities exist for this company
  if (!viewContext || (!loading && entities.length === 0)) {
    return null;
  }

  const currentSelection = isEntityFiltered
    ? viewContext.publishingEntityName || 'Entity'
    : 'All Entities';

  const handleSelectAll = () => {
    setPublishingEntity(null);
    setIsOpen(false);
  };

  const handleSelectEntity = (entity: PublishingEntity) => {
    const label = entity.display_name || entity.name;
    setPublishingEntity(entity.id, label);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'flex items-center gap-2 min-w-[160px] justify-between',
            isEntityFiltered && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[120px] text-sm">{currentSelection}</span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Publishing Entity
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSelectAll}
          className={cn(
            'flex items-center justify-between',
            !isEntityFiltered && 'bg-primary/10'
          )}
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>All Entities</span>
          </div>
          {!isEntityFiltered && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Entities
        </DropdownMenuLabel>

        {loading ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Loading...</span>
          </DropdownMenuItem>
        ) : (
          entities.map((entity) => {
            const isSelected = isEntityFiltered && viewContext.publishingEntityId === entity.id;
            return (
              <DropdownMenuItem
                key={entity.id}
                onClick={() => handleSelectEntity(entity)}
                className={cn(
                  'flex items-center justify-between',
                  isSelected && 'bg-primary/10'
                )}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate max-w-[140px]">
                    {entity.display_name || entity.name}
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
