import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Search, 
  Download, 
  FileText, 
  Edit, 
  Trash, 
  Upload,
  Clock,
  User,
  Calendar,
  Eye
} from 'lucide-react';
import { useActivityLog, ActivityLogEntry } from '@/hooks/useActivityLog';
import { format } from 'date-fns';

interface ActivityLogProps {
  copyrightId?: string;
  showUserFilter?: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ copyrightId, showUserFilter = true }) => {
  const { getActivityLogs, getUserActivityStats, loading } = useActivityLog();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [stats, setStats] = useState<{
    total_activities: number;
    creates: number;
    updates: number;
    deletes: number;
    bulk_uploads: number;
    last_activity?: string;
  }>({
    total_activities: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
    bulk_uploads: 0
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [copyrightId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter]);

  const fetchLogs = async () => {
    const data = await getActivityLogs(copyrightId);
    setLogs(data);
  };

  const fetchStats = async () => {
    if (!copyrightId) {
      const data = await getUserActivityStats();
      setStats(data);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.operation_details || {}).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.copyright_id && log.copyright_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <FileText className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash className="w-4 h-4" />;
      case 'bulk_upload':
        return <Upload className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    const variants = {
      create: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      update: { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      delete: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      bulk_upload: { variant: 'outline' as const, color: 'bg-purple-100 text-purple-800' }
    };

    const config = variants[actionType as keyof typeof variants] || variants.create;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {getActionIcon(actionType)}
        <span className="ml-1 capitalize">{actionType.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  };

  const exportLogs = () => {
    const csvHeaders = [
      'Date/Time',
      'Action',
      'Copyright ID',
      'Details',
      'Affected Fields',
      'Batch ID',
      'IP Address'
    ];

    const csvData = filteredLogs.map(log => [
      formatDateTime(log.created_at),
      log.action_type,
      log.copyright_id || '',
      JSON.stringify(log.operation_details || {}),
      (log.affected_fields || []).join('; '),
      log.batch_id || '',
      log.ip_address || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Track all copyright operations including who made changes, when, and what was modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              {!copyrightId && <TabsTrigger value="stats">Statistics</TabsTrigger>}
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="bulk_upload">Bulk Upload</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredLogs.length} activit{filteredLogs.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <Button
                    onClick={exportLogs}
                    disabled={filteredLogs.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Action</TableHead>
                        {!copyrightId && <TableHead>Copyright ID</TableHead>}
                        <TableHead>Details</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={copyrightId ? 5 : 6} 
                            className="text-center py-8 text-muted-foreground"
                          >
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {formatDateTime(log.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getActionBadge(log.action_type)}
                            </TableCell>
                            {!copyrightId && (
                              <TableCell className="font-mono text-xs">
                                {log.copyright_id ? (
                                  <Badge variant="outline" className="text-xs">
                                    {log.copyright_id.slice(0, 8)}...
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            )}
                            <TableCell className="max-w-[200px]">
                              {log.operation_details && Object.keys(log.operation_details).length > 0 ? (
                                <div className="text-sm space-y-1">
                                  {Object.entries(log.operation_details).slice(0, 2).map(([key, value]) => (
                                    <div key={key} className="truncate">
                                      <span className="font-medium">{key}:</span> {String(value)}
                                    </div>
                                  ))}
                                  {Object.keys(log.operation_details).length > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{Object.keys(log.operation_details).length - 2} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              {log.affected_fields && log.affected_fields.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {log.affected_fields.slice(0, 3).map((field, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {field}
                                    </Badge>
                                  ))}
                                  {log.affected_fields.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{log.affected_fields.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.ip_address || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            {!copyrightId && (
              <TabsContent value="stats">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Total Activities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_activities}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        Creates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.creates}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Edit className="w-4 h-4 text-blue-600" />
                        Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Trash className="w-4 h-4 text-red-600" />
                        Deletes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-600" />
                        Bulk Uploads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{stats.bulk_uploads}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {stats.last_activity ? 
                          formatDateTime(stats.last_activity) : 
                          'No activity yet'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};