import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationChecklistProps {
  isFormValid: boolean;
}

export const ValidationChecklist: React.FC<ValidationChecklistProps> = ({ 
  isFormValid 
}) => {
  const checks = [
    {
      id: 'title',
      label: 'Work title provided',
      status: isFormValid ? 'valid' : 'invalid',
      required: true
    },
    {
      id: 'writers',
      label: 'At least one writer added',
      status: 'pending',
      required: true
    },
    {
      id: 'ownership',
      label: 'Ownership percentages total 100%',
      status: 'pending',
      required: true
    },
    {
      id: 'territories',
      label: 'Collection territories specified',
      status: 'optional',
      required: false
    },
    {
      id: 'rights',
      label: 'Rights types defined',
      status: 'optional',
      required: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />;
      case 'invalid':
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready for Registration Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map(check => (
          <div key={check.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{check.label}</span>
              {check.required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>
            <Badge className={getStatusColor(check.status)} variant="outline">
              <div className="flex items-center gap-1">
                {getStatusIcon(check.status)}
                {check.status === 'valid' ? 'Complete' : 
                 check.status === 'invalid' ? 'Missing' :
                 check.status === 'pending' ? 'Pending' : 'Optional'}
              </div>
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};