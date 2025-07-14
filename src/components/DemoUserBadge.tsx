import React from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function DemoUserBadge() {
  const { isDemoUser } = useModuleAccess();

  if (!isDemoUser) return null;

  return (
    <Badge variant="secondary" className="bg-gradient-primary/10 text-primary border-primary/20">
      <Crown className="w-3 h-3 mr-1" />
      Demo Access
    </Badge>
  );
}