import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, List } from 'lucide-react';
import { SubAccountContractUpload } from './SubAccountContractUpload';
import { BulkContractImport } from './BulkContractImport';
import { SubAccountContractsList } from './SubAccountContractsList';

interface SubAccountContractsProps {
  companyId: string;
  companyName: string;
}

export function SubAccountContracts({ companyId, companyName }: SubAccountContractsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="contracts-list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts-list">
            <List className="h-4 w-4 mr-2" />
            Active Contracts
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Contract
          </TabsTrigger>
          <TabsTrigger value="bulk-import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts-list">
          <SubAccountContractsList companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="upload">
          <SubAccountContractUpload companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="bulk-import">
          <BulkContractImport companyId={companyId} companyName={companyName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
