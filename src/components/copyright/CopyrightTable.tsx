import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Search, ChevronUp, ChevronDown, Music, Users, FileText, CheckCircle, Clock, AlertTriangle, ExternalLink, Edit, Download, Trash2, X, FileOutput } from 'lucide-react';
import { Copyright, CopyrightWriter, CopyrightRecording } from '@/hooks/useCopyright';
import { AudioPlayer } from './AudioPlayer';
import { ExportDialog } from './ExportDialog';
interface CopyrightTableProps {
  copyrights: Copyright[];
  writers: {
    [key: string]: CopyrightWriter[];
  };
  recordings?: {
    [key: string]: CopyrightRecording[];
  };
  loading: boolean;
  realtimeError?: string | null;
  onEdit?: (copyright: Copyright) => void;
  onDelete?: (copyright: Copyright) => void;
  onBulkDelete?: (copyrights: Copyright[]) => void;
  deletingProgress?: {
    current: number;
    total: number;
  };
}
type SortDirection = 'asc' | 'desc';
type SortField = 'work_title' | 'work_id' | 'created_at' | 'registration_status' | 'controlled_share';
export const CopyrightTable: React.FC<CopyrightTableProps> = ({
  copyrights,
  writers,
  recordings = {},
  loading,
  realtimeError,
  onEdit,
  onDelete,
  onBulkDelete,
  deletingProgress
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('work_title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedCopyrights.map(c => c.id)));
    } else {
      setSelectedItems(new Set());
    }
  };
  const handleSelectOne = (copyrightId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(copyrightId);
    } else {
      newSelected.delete(copyrightId);
    }
    setSelectedItems(newSelected);
  };
  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.size > 0) {
      const selectedCopyrights = copyrights.filter(c => selectedItems.has(c.id));
      onBulkDelete(selectedCopyrights);
      setSelectedItems(new Set()); // Clear selection after delete
    }
  };
  const clearSelection = () => {
    setSelectedItems(new Set());
  };
  const calculateControlledShare = (copyrightWriters: CopyrightWriter[]) => {
    return copyrightWriters.filter(w => w.controlled_status === 'C').reduce((sum, w) => sum + w.ownership_percentage, 0);
  };
  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_registered':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Fully Registered</Badge>;
      case 'pending_registration':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'needs_amendment':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Needs Amendment</Badge>;
      case 'not_registered':
      default:
        return <Badge variant="outline">Not Registered</Badge>;
    }
  };
  const getProRegistrationStatuses = (copyright: any) => {
    const statuses = [];
    if (copyright.ascap_status && copyright.ascap_status !== 'not_registered') {
      statuses.push({
        pro: 'ASCAP',
        status: copyright.ascap_status
      });
    }
    if (copyright.bmi_status && copyright.bmi_status !== 'not_registered') {
      statuses.push({
        pro: 'BMI',
        status: copyright.bmi_status
      });
    }
    if (copyright.socan_status && copyright.socan_status !== 'not_registered') {
      statuses.push({
        pro: 'SOCAN',
        status: copyright.socan_status
      });
    }
    if (copyright.sesac_status && copyright.sesac_status !== 'not_registered') {
      statuses.push({
        pro: 'SESAC',
        status: copyright.sesac_status
      });
    }
    if (copyright.mlc_status && copyright.mlc_status !== 'not_registered') {
      statuses.push({
        pro: 'MLC',
        status: copyright.mlc_status
      });
    }
    return statuses;
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };
  const exportToCSV = () => {
    if (filteredAndSortedCopyrights.length === 0) {
      return;
    }

    // Define CSV headers
    const headers = ['Work ID', 'Work Title', 'ISWC', 'Album Title', 'Masters Ownership', 'Creation Date', 'Copyright Date', 'Registration Status', 'Work Type', 'Language', 'Contains Sample', 'Duration (seconds)', 'Notes', 'Writers', 'Writers Ownership %', 'Controlled Share %', 'ASCAP Work ID', 'ASCAP Status', 'BMI Work ID', 'BMI Status', 'SOCAN Work ID', 'SOCAN Status', 'SESAC Work ID', 'SESAC Status', 'MLC Work ID', 'MLC Status', 'Created At', 'Updated At'];

    // Convert data to CSV rows
    const rows = filteredAndSortedCopyrights.map(copyright => {
      const copyrightWriters = writers[copyright.id] || [];
      const controlledShare = calculateControlledShare(copyrightWriters);
      const writerNames = copyrightWriters.map(w => w.writer_name).join('; ');
      const writerOwnership = copyrightWriters.map(w => `${w.writer_name}: ${w.ownership_percentage}%`).join('; ');
      return [copyright.work_id || '', copyright.work_title || '', copyright.iswc || '', copyright.album_title || '', copyright.masters_ownership || '', copyright.creation_date || '', copyright.copyright_date || '', copyright.registration_status || '', copyright.work_type || '', copyright.language_code || '', copyright.contains_sample ? 'Yes' : 'No', copyright.duration_seconds || '', copyright.notes || '', writerNames, writerOwnership, `${controlledShare.toFixed(1)}%`, copyright.ascap_work_id || '', copyright.ascap_status || 'Not Registered', copyright.bmi_work_id || '', copyright.bmi_status || 'Not Registered', copyright.socan_work_id || '', copyright.socan_status || 'Not Registered', copyright.sesac_work_id || '', copyright.sesac_status || 'Not Registered', (copyright as any).mlc_work_id || '', (copyright as any).mlc_status || 'Not Registered', new Date(copyright.created_at).toISOString(), new Date(copyright.updated_at).toISOString()];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map(row => row.map(field => {
      // Escape fields containing commas, quotes, or newlines
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    }).join(',')).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Generate filename with current date and filter info
      const timestamp = new Date().toISOString().split('T')[0];
      const filterSuffix = searchTerm ? `_filtered_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      link.setAttribute('download', `copyrights_export_${timestamp}${filterSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  const filteredAndSortedCopyrights = useMemo(() => {
    let filtered = copyrights.filter(copyright => copyright.work_title?.toLowerCase().includes(searchTerm.toLowerCase()) || copyright.iswc?.toLowerCase().includes(searchTerm.toLowerCase()) || copyright.work_id?.toLowerCase().includes(searchTerm.toLowerCase()) || copyright.album_title?.toLowerCase().includes(searchTerm.toLowerCase()) || writers[copyright.id]?.some(writer => writer.writer_name.toLowerCase().includes(searchTerm.toLowerCase())));
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'work_title':
          aValue = a.work_title?.toLowerCase() || '';
          bValue = b.work_title?.toLowerCase() || '';
          break;
        case 'work_id':
          aValue = a.work_id || '';
          bValue = b.work_id || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'registration_status':
          aValue = a.registration_status || 'not_registered';
          bValue = b.registration_status || 'not_registered';
          break;
        case 'controlled_share':
          aValue = calculateControlledShare(writers[a.id] || []);
          bValue = calculateControlledShare(writers[b.id] || []);
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [copyrights, writers, searchTerm, sortField, sortDirection]);

  // Debug logging
  console.log('CopyrightTable - Debug:', {
    copyrightsCount: copyrights.length,
    loading,
    filteredCount: filteredAndSortedCopyrights.length,
    searchTerm,
    firstThreeCopyrights: copyrights.slice(0, 3).map(c => ({
      id: c.id,
      work_title: c.work_title
    }))
  });
  if (loading) {
    return <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading copyrights...</p>
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search by title, work ID, writer, album..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedCopyrights.length} copyright{filteredAndSortedCopyrights.length !== 1 ? 's' : ''}
        </div>
        <Button onClick={exportToCSV} disabled={filteredAndSortedCopyrights.length === 0} variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedItems.size} copyright{selectedItems.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} disabled={!!deletingProgress}>
                  <FileOutput className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
                {onBulkDelete && <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={!!deletingProgress}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>}
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Deletion Progress */}
      {deletingProgress && <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-orange-900">
                  Deleting copyrights...
                </span>
                <span className="text-orange-700">
                  {deletingProgress.current} of {deletingProgress.total}
                </span>
              </div>
              <Progress value={deletingProgress.current / deletingProgress.total * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedItems.size > 0 && selectedItems.size === filteredAndSortedCopyrights.length} onCheckedChange={handleSelectAll} aria-label="Select all copyrights" />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('work_id')}>
                    <div className="flex items-center">
                      Work ID
                      {getSortIcon('work_id')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('work_title')}>
                    <div className="flex items-center">
                      Work Title
                      {getSortIcon('work_title')}
                    </div>
                  </TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>ISWC</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Writers</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('controlled_share')}>
                    <div className="flex items-center">
                      Controlled %
                      {getSortIcon('controlled_share')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('registration_status')}>
                    <div className="flex items-center">
                      Status
                      {getSortIcon('registration_status')}
                    </div>
                  </TableHead>
                  <TableHead>CWR/DDEX</TableHead>
                  <TableHead>Audio</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Created
                      {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCopyrights.map(copyright => {
                const copyrightWriters = writers[copyright.id] || [];
                // Use copyright_recordings from the joined query data first, fallback to recordings prop
                const copyrightRecordings = (copyright as any).copyright_recordings || recordings[copyright.id] || [];
                const firstRecording = copyrightRecordings[0];
                const controlledShare = calculateControlledShare(copyrightWriters);
                return <TableRow key={copyright.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox checked={selectedItems.has(copyright.id)} onCheckedChange={checked => handleSelectOne(copyright.id, checked as boolean)} aria-label={`Select ${copyright.work_title}`} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline" className="text-xs">
                          {copyright.work_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={copyright.work_title}>
                          {copyright.work_title}
                        </div>
                        {copyright.contains_sample && <Badge variant="secondary" className="text-xs mt-1">Contains Sample</Badge>}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={firstRecording?.artist_name || ''}>
                          {firstRecording?.artist_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {firstRecording?.isrc || '-'}
                      </TableCell>
                      <TableCell>
                        {copyright.work_type && copyright.work_type !== 'original' ? (
                          <Badge variant="outline">
                            {copyright.work_type}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Audio
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {copyright.iswc || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={copyright.album_title || ''}>
                          {copyright.album_title || '-'}
                        </div>
                        {copyright.masters_ownership && <div className="text-xs text-muted-foreground truncate" title={copyright.masters_ownership}>
                            {copyright.masters_ownership}
                          </div>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[200px]">
                          {copyrightWriters.slice(0, 2).map((writer, index) => <div key={index} className="text-sm">
                              <div className="truncate" title={writer.writer_name}>
                                <strong>{writer.writer_name}</strong> ({writer.ownership_percentage}%)
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {writer.controlled_status === 'C' && <Badge variant="secondary" className="text-xs">C</Badge>}
                                {writer.pro_affiliation && <span>{writer.pro_affiliation}</span>}
                              </div>
                            </div>)}
                          {copyrightWriters.length > 2 && <div className="text-xs text-muted-foreground">
                              +{copyrightWriters.length - 2} more
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-bold text-sm">
                          {controlledShare.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(() => {
                        const proStatuses = getProRegistrationStatuses(copyright);
                        if (proStatuses.length === 0) {
                          return <Badge variant="outline">Not Registered</Badge>;
                        }
                        return proStatuses.map((proStatus, index) => <div key={index} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {proStatus.pro}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {proStatus.status.replace('_', ' ')}
                                </span>
                              </div>);
                      })()}
                         </div>
                       </TableCell>
                         <TableCell>
                          <div className="space-y-1">
                            {(() => {
                        // Badge logic should reflect whether compliance checks are 100%
                        const proStatuses = getProRegistrationStatuses(copyright);
                        const cwrReady = (copyright as any).cwr_compliance === 100 || (copyright as any).cwr_score === 100 || proStatuses.some((s: any) => s.status === 'registered' || s.status === 'fully_registered');

                        // DDEX readiness: true only when checks are complete (100%) or core fields present
                        const ddexReady = Boolean((copyright as any).ddex_compliance === 100 || (copyright as any).ddex_score === 100 || copyright.work_title && copyright.iswc && copyright.language_code);
                        return <div className="flex flex-col gap-1">
                                  <Badge className={cwrReady ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>
                                    CWR {cwrReady ? '✓' : '✗'}
                                  </Badge>
                                  <Badge className={ddexReady ? "bg-blue-100 text-blue-800 text-xs" : "bg-orange-100 text-orange-800 text-xs"}>
                                    DDEX {ddexReady ? '✓' : '✗'}
                                  </Badge>
                                </div>;
                      })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {copyright.mp3_link ? <AudioPlayer src={copyright.mp3_link} title={copyright.work_title} artist={writers[copyright.id]?.[0]?.writer_name || "Unknown Artist"} className="max-w-[180px]" /> : <span className="text-muted-foreground text-sm">-</span>}
                        </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(copyright.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(copyright)} className="h-8 w-8 p-0" disabled={!!deletingProgress}>
                              <Edit className="h-4 w-4" />
                            </Button>}
                          {onDelete && <Button variant="outline" size="sm" onClick={() => onDelete(copyright)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={!!deletingProgress}>
                              <Trash2 className="h-4 w-4" />
                            </Button>}
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedCopyrights.length === 0 && <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No copyrights found</p>
              <p className="text-sm">Try adjusting your search or register a new copyright</p>
            </div>}
        </CardContent>
      </Card>
      
      {/* Export Dialog */}
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} selectedCopyrights={Array.from(selectedItems)} copyrightTitles={Object.fromEntries(copyrights.map(c => [c.id, c.work_title]))} />
    </div>;
};