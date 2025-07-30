import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { SenderCodeForm } from './SenderCodeForm';
import { SenderCodeList } from './SenderCodeList';
import { useSenderCodes, type SenderCode } from '@/hooks/useSenderCodes';

export const SenderCodeOnboarding: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<SenderCode | null>(null);
  const { senderCodes, loading } = useSenderCodes();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'submitted':
        return 'Submitted';
      default:
        return 'Not Submitted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const handleEdit = (code: SenderCode) => {
    setEditingCode(code);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCode(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">CWR Sender Codes</h3>
          <p className="text-sm text-muted-foreground">
            Manage your sender codes for CWR file generation and PRO submissions
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sender Code
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          A sender code is required to generate valid CWR files. You'll need to register this code with your target PRO(s) before submitting CWR files.
        </AlertDescription>
      </Alert>

      {/* Quick Status Overview */}
      {senderCodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['not_submitted', 'submitted', 'verified'].map((status) => {
            const count = senderCodes.filter(code => code.status === status).length;
            return (
              <Card key={status} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {count}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal/Panel */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCode ? 'Edit Sender Code' : 'Add New Sender Code'}
            </CardTitle>
            <CardDescription>
              Enter your sender code details and select target PRO(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SenderCodeForm 
              initialData={editingCode}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </CardContent>
        </Card>
      )}

      {/* Sender Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sender Codes</CardTitle>
          <CardDescription>
            Manage and track the status of your registered sender codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : senderCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No sender codes added yet
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Sender Code
              </Button>
            </div>
          ) : (
            <SenderCodeList 
              senderCodes={senderCodes}
              onEdit={handleEdit}
              getStatusIcon={getStatusIcon}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};