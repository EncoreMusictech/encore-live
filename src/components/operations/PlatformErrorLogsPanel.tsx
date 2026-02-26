import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bug, CheckCircle, Info, RefreshCw, Search, XCircle } from 'lucide-react';
import { usePlatformErrorLogs, type PlatformErrorLog } from '@/hooks/usePlatformErrorLogs';
import { format } from 'date-fns';

const severityConfig: Record<string, { icon: typeof Bug; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  critical: { icon: XCircle, color: 'text-red-600', badgeVariant: 'destructive' },
  error: { icon: Bug, color: 'text-orange-600', badgeVariant: 'destructive' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', badgeVariant: 'secondary' },
  info: { icon: Info, color: 'text-blue-600', badgeVariant: 'outline' },
};

export function PlatformErrorLogsPanel() {
  const { logs, loading, filters, setFilters, fetchLogs, markResolved } = usePlatformErrorLogs();
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<PlatformErrorLog | null>(null);
  const [resolveDialog, setResolveDialog] = useState<PlatformErrorLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.error_message.toLowerCase().includes(q) ||
      log.error_source.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.company_name?.toLowerCase().includes(q)
    );
  });

  const handleResolve = async () => {
    if (!resolveDialog) return;
    await markResolved(resolveDialog.id, resolutionNotes);
    setResolveDialog(null);
    setResolutionNotes('');
  };

  const unresolvedCount = logs.filter(l => !l.resolved).length;
  const criticalCount = logs.filter(l => l.severity === 'critical' && !l.resolved).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Bug className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unresolved</p>
                <p className="text-2xl font-bold text-orange-600">{unresolvedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{logs.length - unresolvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors, users, companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.severity} onValueChange={(v) => setFilters(f => ({ ...f, severity: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.resolved} onValueChange={(v) => setFilters(f => ({ ...f, resolved: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.source} onValueChange={(v) => setFilters(f => ({ ...f, source: v }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="bulk-upload">Bulk Upload</SelectItem>
                <SelectItem value="contract-upload">Contract Upload</SelectItem>
                <SelectItem value="catalog-import">Catalog Import</SelectItem>
                <SelectItem value="edge-function">Edge Function</SelectItem>
                <SelectItem value="api-call">API Call</SelectItem>
                <SelectItem value="file-processing">File Processing</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="database">Database</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bug className="h-5 w-5" />
            Error Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600/40" />
              <p className="font-medium">No errors found</p>
              <p className="text-sm">All clear! No matching error logs.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const config = severityConfig[log.severity] || severityConfig.error;
                  const Icon = config.icon;
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        log.resolved ? 'opacity-60' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={config.badgeVariant} className="text-xs">
                            {log.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{log.error_source}</Badge>
                          {log.module && <Badge variant="secondary" className="text-xs">{log.module}</Badge>}
                          {log.resolved && (
                            <Badge variant="default" className="text-xs bg-green-600">Resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{log.error_message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                          {log.user_email && <span>User: {log.user_email}</span>}
                          {log.company_name && <span>Company: {log.company_name}</span>}
                        </div>
                      </div>
                      {!log.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolveDialog(log);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const config = severityConfig[selectedLog.severity] || severityConfig.error;
                    const Icon = config.icon;
                    return <Icon className={`h-5 w-5 ${config.color}`} />;
                  })()}
                  Error Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Timestamp</p>
                    <p className="font-medium">{format(new Date(selectedLog.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Severity</p>
                    <Badge variant={severityConfig[selectedLog.severity]?.badgeVariant || 'destructive'}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Source</p>
                    <p className="font-medium">{selectedLog.error_source}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedLog.error_type}</p>
                  </div>
                  {selectedLog.module && (
                    <div>
                      <p className="text-muted-foreground">Module</p>
                      <p className="font-medium">{selectedLog.module}</p>
                    </div>
                  )}
                  {selectedLog.action && (
                    <div>
                      <p className="text-muted-foreground">Action</p>
                      <p className="font-medium">{selectedLog.action}</p>
                    </div>
                  )}
                  {selectedLog.user_email && (
                    <div>
                      <p className="text-muted-foreground">User</p>
                      <p className="font-medium">{selectedLog.user_email}</p>
                    </div>
                  )}
                  {selectedLog.company_name && (
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedLog.company_name}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Error Message</p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm font-mono">
                    {selectedLog.error_message}
                  </div>
                </div>

                {selectedLog.error_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Error Details (JSON)</p>
                    <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                      {JSON.stringify(selectedLog.error_details, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.resolved && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded space-y-1">
                    <p className="text-sm font-medium text-green-800">✅ Resolved</p>
                    {selectedLog.resolved_at && (
                      <p className="text-xs text-green-700">
                        Resolved on: {format(new Date(selectedLog.resolved_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                    {selectedLog.resolution_notes && (
                      <p className="text-sm text-green-700">{selectedLog.resolution_notes}</p>
                    )}
                  </div>
                )}

                {!selectedLog.resolved && (
                  <Button
                    onClick={() => {
                      setSelectedLog(null);
                      setResolveDialog(selectedLog);
                    }}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Error</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {resolveDialog?.error_message}
            </p>
            <Textarea
              placeholder="Resolution notes — what was the fix?"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>Cancel</Button>
            <Button onClick={handleResolve}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
