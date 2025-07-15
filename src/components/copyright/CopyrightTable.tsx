import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronUp, ChevronDown, Music, Users, FileText, CheckCircle, Clock, AlertTriangle, ExternalLink, Edit } from 'lucide-react';
import { Copyright, CopyrightWriter } from '@/hooks/useCopyright';
import { AudioPlayer } from './AudioPlayer';

interface CopyrightTableProps {
  copyrights: Copyright[];
  writers: { [key: string]: CopyrightWriter[] };
  loading: boolean;
  onEdit?: (copyright: Copyright) => void;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'work_title' | 'work_id' | 'created_at' | 'registration_status' | 'controlled_share';

export const CopyrightTable: React.FC<CopyrightTableProps> = ({ copyrights, writers, loading, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('work_title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const calculateControlledShare = (copyrightWriters: CopyrightWriter[]) => {
    return copyrightWriters
      .filter(w => w.controlled_status === 'C')
      .reduce((sum, w) => sum + w.ownership_percentage, 0);
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
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const filteredAndSortedCopyrights = useMemo(() => {
    let filtered = copyrights.filter(copyright =>
      copyright.work_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      copyright.iswc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      copyright.work_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      copyright.album_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writers[copyright.id]?.some(writer => 
        writer.writer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading copyrights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by title, work ID, writer, album..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedCopyrights.length} copyright{filteredAndSortedCopyrights.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            My Copyrights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('work_id')}
                  >
                    <div className="flex items-center">
                      Work ID
                      {getSortIcon('work_id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('work_title')}
                  >
                    <div className="flex items-center">
                      Work Title
                      {getSortIcon('work_title')}
                    </div>
                  </TableHead>
                  <TableHead>ISWC</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Writers</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('controlled_share')}
                  >
                    <div className="flex items-center">
                      Controlled %
                      {getSortIcon('controlled_share')}
                    </div>
                  </TableHead>
                  <TableHead>PRO Registration</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('registration_status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('registration_status')}
                    </div>
                  </TableHead>
                  <TableHead>Audio</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created
                      {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCopyrights.map((copyright) => {
                  const copyrightWriters = writers[copyright.id] || [];
                  const controlledShare = calculateControlledShare(copyrightWriters);
                  
                  return (
                    <TableRow key={copyright.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline" className="text-xs">
                          {copyright.work_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={copyright.work_title}>
                          {copyright.work_title}
                        </div>
                        {copyright.contains_sample && (
                          <Badge variant="secondary" className="text-xs mt-1">Contains Sample</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {copyright.iswc || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={copyright.album_title || ''}>
                          {copyright.album_title || '-'}
                        </div>
                        {copyright.masters_ownership && (
                          <div className="text-xs text-muted-foreground truncate" title={copyright.masters_ownership}>
                            {copyright.masters_ownership}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[200px]">
                          {copyrightWriters.slice(0, 2).map((writer, index) => (
                            <div key={index} className="text-sm">
                              <div className="truncate" title={writer.writer_name}>
                                <strong>{writer.writer_name}</strong> ({writer.ownership_percentage}%)
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {writer.controlled_status === 'C' && (
                                  <Badge variant="secondary" className="text-xs">C</Badge>
                                )}
                                {writer.pro_affiliation && (
                                  <span>{writer.pro_affiliation}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {copyrightWriters.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{copyrightWriters.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-bold text-sm">
                          {controlledShare.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {copyright.ascap_work_id && (
                            <Badge variant="outline" className="text-xs block w-fit">
                              ASCAP: {copyright.ascap_work_id}
                            </Badge>
                          )}
                          {copyright.bmi_work_id && (
                            <Badge variant="outline" className="text-xs block w-fit">
                              BMI: {copyright.bmi_work_id}
                            </Badge>
                          )}
                          {copyright.socan_work_id && (
                            <Badge variant="outline" className="text-xs block w-fit">
                              SOCAN: {copyright.socan_work_id}
                            </Badge>
                          )}
                          {copyright.sesac_work_id && (
                            <Badge variant="outline" className="text-xs block w-fit">
                              SESAC: {copyright.sesac_work_id}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRegistrationStatusBadge(copyright.registration_status || 'not_registered')}
                      </TableCell>
                      <TableCell>
                        {copyright.mp3_link ? (
                          <AudioPlayer 
                            src={copyright.mp3_link}
                            title={copyright.work_title}
                            className="max-w-[180px]"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(copyright.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(copyright)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedCopyrights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No copyrights found</p>
              <p className="text-sm">Try adjusting your search or register a new copyright</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};