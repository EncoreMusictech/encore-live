import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, List, History } from 'lucide-react';
import { BulkWorksUpload } from './BulkWorksUpload';
import { AssignedWorksList } from './AssignedWorksList';
import { BulkUploadHistory } from './BulkUploadHistory';

interface SubAccountWorksProps {
  companyId: string;
  companyName: string;
}

export function SubAccountWorks({ companyId, companyName }: SubAccountWorksProps) {
  return (
    <Tabs defaultValue="upload" className="space-y-6">
      <TabsList>
        <TabsTrigger value="upload">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </TabsTrigger>
        <TabsTrigger value="list">
          <List className="h-4 w-4 mr-2" />
          Assigned Works
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="h-4 w-4 mr-2" />
          Upload History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <BulkWorksUpload companyId={companyId} companyName={companyName} />
      </TabsContent>

      <TabsContent value="list">
        <AssignedWorksList companyId={companyId} />
      </TabsContent>

      <TabsContent value="history">
        <BulkUploadHistory companyId={companyId} />
      </TabsContent>
    </Tabs>
  );
}
