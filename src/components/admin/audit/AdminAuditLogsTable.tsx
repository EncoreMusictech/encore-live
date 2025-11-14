import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, AlertTriangle, Info, Shield } from 'lucide-react';
import { useAdminAuditLogs, AdminAuditLog } from '@/hooks/useAdminAuditLogs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AdminAuditLogsTable() {
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { logs, summary, loading } = useAdminAuditLogs();

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" />Medium</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Low</Badge>;
    }
  };

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      'view_mode_entered': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'view_mode_exited': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'data_created': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'data_updated': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'data_deleted': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'export_performed': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };

    return (
      <Badge variant="outline" className={colors[actionType] || ''}>
        {actionType.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const handleViewDetails = (log: AdminAuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading audit logs...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summary.slice(0, 1).map((s) => (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.total_sessions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.total_actions}</div>
                  <p className="text-xs text-muted-foreground mt-1">All activity</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Companies Accessed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.companies_accessed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique companies</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">High Risk Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{s.high_risk_actions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires review</p>
                </CardContent>
              </Card>
            </>
          ))}
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admin View Mode Audit Log</CardTitle>
            <CardDescription>
              Complete history of system administrator actions when viewing as sub-accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.admin_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>
                        {log.company_name ? (
                          <div className="text-sm">
                            <div className="font-medium">{log.company_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.resource_type ? (
                          <Badge variant="outline">{log.resource_type}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatDuration(log.session_duration_seconds)}
                      </TableCell>
                      <TableCell>{getRiskBadge(log.risk_level)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this admin action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.session_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Email</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Level</label>
                  <div className="mt-1">{getRiskBadge(selectedLog.risk_level)}</div>
                </div>
              </div>

              {selectedLog.company_name && (
                <div>
                  <label className="text-sm font-medium">Company Context</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.company_name}</p>
                </div>
              )}

              {selectedLog.resource_type && (
                <div>
                  <label className="text-sm font-medium">Resource</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.resource_type} {selectedLog.resource_id && `(${selectedLog.resource_id})`}
                  </p>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium">User Agent</label>
                  <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.action_details && Object.keys(selectedLog.action_details).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Action Details</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.action_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
