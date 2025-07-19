import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SyncLicenseFormPreview } from '@/components/sync-licensing/SyncLicenseFormPreview';
import { useSyncLicenses } from '@/hooks/useSyncLicenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SyncLicensingPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: licenses, isLoading } = useSyncLicenses();
  
  const license = licenses?.find(l => l.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!license) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>License Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The requested sync license could not be found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <SyncLicenseFormPreview license={license} />;
}