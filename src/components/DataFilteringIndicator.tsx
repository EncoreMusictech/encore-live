import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { useDataFiltering } from '@/hooks/useDataFiltering';

/**
 * Small indicator showing when data is being filtered by sub-account view
 */
export function DataFilteringIndicator() {
  const { isFilterActive, isEntityFiltered, getFilterSummary } = useDataFiltering();

  if (!isFilterActive && !isEntityFiltered) {
    return null;
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-2">
      <Filter className="h-3 w-3" />
      <span className="text-xs">{getFilterSummary()}</span>
    </Badge>
  );
}
