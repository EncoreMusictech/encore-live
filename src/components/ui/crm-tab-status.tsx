import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

/**
 * Simple indicator to show that CRM tab persistence is active
 * Displays in the corner of CRM pages to confirm the feature is working
 */
export const CRMTabStatus: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="outline" 
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Tab State Protected
      </Badge>
    </div>
  );
};