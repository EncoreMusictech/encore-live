import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { updatePageMetadata } from '@/utils/seo';
import { AdminAuditLogsTable } from '@/components/admin/audit/AdminAuditLogsTable';

export default function AdminAuditLogsPage() {
  useEffect(() => {
    updatePageMetadata('adminAuditLogs');
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Security and compliance monitoring for system administrator actions
          </p>
        </div>
      </div>

      <AdminAuditLogsTable />
    </div>
  );
}
