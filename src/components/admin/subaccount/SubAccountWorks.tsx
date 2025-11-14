import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, List } from 'lucide-react';
import { BulkWorksUpload } from './BulkWorksUpload';
import { SmartCSVImporter } from './SmartCSVImporter';
import { AssignedWorksList } from './AssignedWorksList';

interface SubAccountWorksProps {
  companyId: string;
  companyName: string;
}

export function SubAccountWorks({ companyId, companyName }: SubAccountWorksProps) {
  return (
    <Tabs defaultValue="smart" className="space-y-6">
      <TabsList>
        <TabsTrigger value="smart">
          <Upload className="h-4 w-4 mr-2" />
          Smart Import
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Upload className="h-4 w-4 mr-2" />
          Template Upload
        </TabsTrigger>
        <TabsTrigger value="list">
          <List className="h-4 w-4 mr-2" />
          Assigned Works
        </TabsTrigger>
      </TabsList>

      <TabsContent value="smart">
        <SmartCSVImporter companyId={companyId} companyName={companyName} />
      </TabsContent>

      <TabsContent value="upload">
        <BulkWorksUpload companyId={companyId} companyName={companyName} />
      </TabsContent>

      <TabsContent value="list">
        <AssignedWorksList companyId={companyId} />
      </TabsContent>
    </Tabs>
  );
}
