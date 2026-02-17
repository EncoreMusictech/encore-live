import { Badge } from '@/components/ui/badge';

const ASSIGNEE_STYLES: Record<string, string> = {
  'ENCORE': 'bg-blue-100 text-blue-700 border-blue-200',
  'Client': 'bg-orange-100 text-orange-700 border-orange-200',
  'ENCORE + Client': 'bg-purple-100 text-purple-700 border-purple-200',
};

interface AssigneeBadgeProps {
  assignee: 'ENCORE' | 'Client' | 'ENCORE + Client';
  clientName?: string;
  className?: string;
}

export function AssigneeBadge({ assignee, clientName, className = '' }: AssigneeBadgeProps) {
  const displayLabel = clientName
    ? assignee.replace('Client', clientName)
    : assignee;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 leading-4 ${ASSIGNEE_STYLES[assignee]} ${className}`}>
      {displayLabel}
    </Badge>
  );
}
