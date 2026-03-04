import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, CheckCircle, Music, Calendar, Clock, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCopyright } from '@/hooks/useCopyright';
import { useContracts } from '@/hooks/useContracts';
import { EnhancedScheduleWorkForm } from './EnhancedScheduleWorkForm';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Copyright = Database['public']['Tables']['copyrights']['Row'];

interface WorkSelectionDialogProps {
  contractId: string;
  onSuccess: () => void;
  onCancel: () => void;
  copyrights?: Copyright[];
  loading?: boolean;
  onSpotifyFetchChange?: (isLoading: boolean) => void;
}

export function WorkSelectionDialog({ 
  contractId, 
  onSuccess, 
  onCancel, 
  copyrights: propCopyrights,
  loading: propLoading,
  onSpotifyFetchChange
}: WorkSelectionDialogProps) {
  const { toast } = useToast();
  
  // Debug logging for contract ID
  console.log('WorkSelectionDialog - Contract ID:', contractId);
  
  // Use prop data first, fallback to hook if not provided
  const copyrightHook = useCopyright();
  const copyrights = propCopyrights || copyrightHook.copyrights;
  const loading = propLoading !== undefined ? propLoading : copyrightHook.loading;
  
  const { addScheduleWork, addScheduleWorksBatch } = useContracts();
  
  // Debug logging for copyrights data
  console.log('WorkSelectionDialog - Copyrights:', { 
    count: copyrights.length, 
    loading,
    addScheduleWorkExists: !!addScheduleWork
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [writersMap, setWritersMap] = useState<Record<string, Array<{
    writer_name: string;
    ownership_percentage: number;
    controlled_status: string | null;
    pro_affiliation: string | null;
  }>>>({});
  const [recordingsMap, setRecordingsMap] = useState<Record<string, string>>({});
  const [workInheritance, setWorkInheritance] = useState<{[key: string]: {
    inherits_royalty_splits: boolean;
    inherits_recoupment_status: boolean;
    inherits_controlled_status: boolean;
    work_specific_advance: number;
    work_specific_rate_reduction: number;
  }}>({});

  // Fetch writers and recordings for all copyrights in chunked batches
  useEffect(() => {
    if (copyrights.length === 0) return;
    const ids = copyrights.map(c => c.id);
    const CHUNK_SIZE = 100;

    const fetchWriters = async () => {
      const map: Record<string, Array<{
        writer_name: string;
        ownership_percentage: number;
        controlled_status: string | null;
        pro_affiliation: string | null;
        copyright_id: string;
      }>> = {};
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { data } = await supabase
          .from('copyright_writers')
          .select('copyright_id, writer_name, ownership_percentage, controlled_status, pro_affiliation')
          .in('copyright_id', chunk);
        (data || []).forEach(w => {
          if (!map[w.copyright_id]) map[w.copyright_id] = [];
          map[w.copyright_id].push(w);
        });
      }
      setWritersMap(map);
    };

    const fetchRecordings = async () => {
      const map: Record<string, string> = {};
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { data } = await supabase
          .from('copyright_recordings')
          .select('copyright_id, artist_name')
          .in('copyright_id', chunk);
        (data || []).forEach(r => {
          if (r.artist_name && !map[r.copyright_id]) map[r.copyright_id] = r.artist_name;
        });
      }
      setRecordingsMap(map);
    };

    fetchWriters();
    fetchRecordings();
  }, [copyrights]);

  // Filter copyrights based on search term (including songwriter)
  const filteredCopyrights = copyrights.filter(copyright => {
    const term = searchTerm.toLowerCase();
    return (
      copyright.work_title.toLowerCase().includes(term) ||
      copyright.album_title?.toLowerCase().includes(term) ||
      copyright.internal_id?.toLowerCase().includes(term) ||
      copyright.iswc?.toLowerCase().includes(term) ||
      writersMap[copyright.id]?.some(w => w.writer_name.toLowerCase().includes(term))
    );
  });

  const allFilteredSelected = filteredCopyrights.length > 0 && filteredCopyrights.every(c => selectedWorks.has(c.id));
  const someFilteredSelected = filteredCopyrights.some(c => selectedWorks.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered
      const newSelected = new Set(selectedWorks);
      const newInheritance = { ...workInheritance };
      filteredCopyrights.forEach(c => {
        newSelected.delete(c.id);
        delete newInheritance[c.id];
      });
      setSelectedWorks(newSelected);
      setWorkInheritance(newInheritance);
    } else {
      // Select all filtered
      const newSelected = new Set(selectedWorks);
      const newInheritance = { ...workInheritance };
      filteredCopyrights.forEach(c => {
        newSelected.add(c.id);
        if (!newInheritance[c.id]) {
          newInheritance[c.id] = {
            inherits_royalty_splits: true,
            inherits_recoupment_status: true,
            inherits_controlled_status: true,
            work_specific_advance: 0,
            work_specific_rate_reduction: 0
          };
        }
      });
      setSelectedWorks(newSelected);
      setWorkInheritance(newInheritance);
    }
  };

  const toggleWorkSelection = (copyrightId: string) => {
    const newSelected = new Set(selectedWorks);
    if (newSelected.has(copyrightId)) {
      newSelected.delete(copyrightId);
      // Remove inheritance settings for unselected work
      const newInheritance = { ...workInheritance };
      delete newInheritance[copyrightId];
      setWorkInheritance(newInheritance);
    } else {
      newSelected.add(copyrightId);
      // Add default inheritance settings for new selection
      setWorkInheritance(prev => ({
        ...prev,
        [copyrightId]: {
          inherits_royalty_splits: true,
          inherits_recoupment_status: true,
          inherits_controlled_status: true,
          work_specific_advance: 0,
          work_specific_rate_reduction: 0
        }
      }));
    }
    setSelectedWorks(newSelected);
  };

  const updateWorkInheritance = (copyrightId: string, field: string, value: any) => {
    setWorkInheritance(prev => ({
      ...prev,
      [copyrightId]: {
        ...prev[copyrightId],
        [field]: value
      }
    }));
  };

  const handleAddSelectedWorks = async () => {
    if (selectedWorks.size === 0) {
      toast({
        title: "No Works Selected",
        description: "Please select at least one work to add to the schedule.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding selected works to contract:', { contractId, selectedWorksCount: selectedWorks.size });
      
      const worksToAdd = Array.from(selectedWorks).map(copyrightId => {
        const copyright = copyrights.find(c => c.id === copyrightId);
        if (!copyright) return null;

        const inheritance = workInheritance[copyrightId] || {
          inherits_royalty_splits: true,
          inherits_recoupment_status: true,
          inherits_controlled_status: true,
          work_specific_advance: 0,
          work_specific_rate_reduction: 0
        };

        return {
          copyright_id: copyrightId,
          song_title: copyright.work_title,
          artist_name: null as string | null,
          album_title: copyright.album_title,
          work_id: copyright.work_id,
          isrc: null as string | null,
          iswc: copyright.iswc,
          inherits_royalty_splits: inheritance.inherits_royalty_splits,
          inherits_recoupment_status: inheritance.inherits_recoupment_status,
          inherits_controlled_status: inheritance.inherits_controlled_status,
          work_specific_advance: inheritance.work_specific_advance,
          work_specific_rate_reduction: inheritance.work_specific_rate_reduction
        };
      }).filter(Boolean) as any[];

      const results = await addScheduleWorksBatch(contractId, worksToAdd);

      // Auto-create interested parties from the selected works' writers/publishers
      try {
        const selectedIds = Array.from(selectedWorks);
        
        // Get existing parties to avoid duplicates
        const { data: existingParties } = await supabase
          .from('contract_interested_parties')
          .select('name')
          .eq('contract_id', contractId);
        const existingNames = new Set((existingParties || []).map(p => p.name.toLowerCase()));
        
        const newParties: any[] = [];
        
        for (const copyrightId of selectedIds) {
          const writers = writersMap[copyrightId] || [];
          for (const writer of writers) {
            if (!existingNames.has(writer.writer_name.toLowerCase())) {
              newParties.push({
                contract_id: contractId,
                name: writer.writer_name,
                party_type: 'writer',
                performance_percentage: writer.ownership_percentage || 0,
                mechanical_percentage: writer.ownership_percentage || 0,
                synch_percentage: writer.ownership_percentage || 0,
                controlled_status: writer.controlled_status || 'no',
                affiliation: writer.pro_affiliation || null,
              });
              existingNames.add(writer.writer_name.toLowerCase());
            }
          }
        }
        
        // Fetch publishers for selected works
        const { data: pubData } = await supabase
          .from('copyright_publishers')
          .select('copyright_id, publisher_name, ownership_percentage, pro_affiliation')
          .in('copyright_id', selectedIds);
        
        for (const pub of (pubData || [])) {
          if (!existingNames.has(pub.publisher_name.toLowerCase())) {
            newParties.push({
              contract_id: contractId,
              name: pub.publisher_name,
              party_type: 'publisher',
              performance_percentage: pub.ownership_percentage || 0,
              mechanical_percentage: pub.ownership_percentage || 0,
              synch_percentage: pub.ownership_percentage || 0,
              controlled_status: 'yes',
              affiliation: pub.pro_affiliation || null,
            });
            existingNames.add(pub.publisher_name.toLowerCase());
          }
        }
        
        if (newParties.length > 0) {
          await supabase.from('contract_interested_parties').insert(newParties);
        }
      } catch (partyError) {
        console.error('Error auto-creating interested parties:', partyError);
        // Non-fatal
      }

      if (results.failed > 0) {
        toast({
          title: `Added ${results.success} work(s), ${results.failed} failed`,
          description: results.errors.slice(0, 3).join('\n'),
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Added ${results.success} work(s) to contract schedule.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error adding works to schedule:', error);
      toast({
        title: "Error",
        description: "Failed to add selected works to schedule",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getRegistrationStatus = (copyright: Copyright) => {
    const statuses = [];
    if (copyright.ascap_status && copyright.ascap_status !== 'not_registered') statuses.push('ASCAP');
    if (copyright.bmi_status && copyright.bmi_status !== 'not_registered') statuses.push('BMI');
    if (copyright.socan_status && copyright.socan_status !== 'not_registered') statuses.push('SOCAN');
    if (copyright.sesac_status && copyright.sesac_status !== 'not_registered') statuses.push('SESAC');
    
    return statuses.length > 0 ? statuses.join(', ') : 'Not Registered';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Select Existing Works</TabsTrigger>
          <TabsTrigger value="create">Create New Work</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing" className="space-y-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, album, internal ID, ISWC, or songwriter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Selected Works Summary */}
            {selectedWorks.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Works ({selectedWorks.size})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from(selectedWorks).map(copyrightId => {
                    const copyright = copyrights.find(c => c.id === copyrightId);
                    const inheritance = workInheritance[copyrightId];
                    if (!copyright || !inheritance) return null;

                    return (
                      <div key={copyrightId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{copyright.work_title}</div>
                            <div className="text-sm text-muted-foreground">
                              {copyright.internal_id} • {copyright.album_title || 'No Album'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWorkSelection(copyrightId)}
                          >
                            Remove
                          </Button>
                        </div>
                        
                        {/* Inheritance Settings */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={inheritance.inherits_royalty_splits}
                                onCheckedChange={(checked) => 
                                  updateWorkInheritance(copyrightId, 'inherits_royalty_splits', checked)
                                }
                              />
                              <Label>Inherit Royalty Splits</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={inheritance.inherits_recoupment_status}
                                onCheckedChange={(checked) => 
                                  updateWorkInheritance(copyrightId, 'inherits_recoupment_status', checked)
                                }
                              />
                              <Label>Inherit Recoupment Status</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={inheritance.inherits_controlled_status}
                                onCheckedChange={(checked) => 
                                  updateWorkInheritance(copyrightId, 'inherits_controlled_status', checked)
                                }
                              />
                              <Label>Inherit Controlled Status</Label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label>Work-Specific Advance ($)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={inheritance.work_specific_advance}
                                onChange={(e) => 
                                  updateWorkInheritance(copyrightId, 'work_specific_advance', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                            <div>
                              <Label>Work-Specific Rate Reduction (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={inheritance.work_specific_rate_reduction}
                                onChange={(e) => 
                                  updateWorkInheritance(copyrightId, 'work_specific_rate_reduction', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddSelectedWorks} className="flex-1">
                      Add {selectedWorks.size} Work(s) to Schedule
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedWorks(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Copyright Works Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading copyright works...</div>
                <div className="text-xs text-muted-foreground mt-2">
                  If this takes too long, please check your internet connection or refresh the page.
                </div>
              </div>
            ) : filteredCopyrights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <div>
                    <p>No works found matching "{searchTerm}"</p>
                    <p className="text-xs mt-2">Try adjusting your search terms or clear the search to see all works.</p>
                  </div>
                ) : (
                  <div>
                    <p>No copyright works found in your catalog.</p>
                    <p className="text-xs mt-2">
                      Create your first work using the "Create New Work" tab above to register new works.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Available Copyright Works ({filteredCopyrights.length})
                  </CardTitle>
                  <CardDescription>
                    Select works from your copyright catalog to add to this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allFilteredSelected}
                            ref={(el) => {
                              if (el) {
                                (el as any).indeterminate = someFilteredSelected && !allFilteredSelected;
                              }
                            }}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Work ID</TableHead>
                        <TableHead>Work Title</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead>ISRC</TableHead>
                        <TableHead>Media Type</TableHead>
                        <TableHead>ISWC</TableHead>
                        <TableHead>Album</TableHead>
                        <TableHead>Writers</TableHead>
                        <TableHead>Controlled %</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCopyrights.map((copyright) => {
                        const writers = writersMap[copyright.id] || [];
                        const controlledPct = writers
                          .filter(w => w.controlled_status === 'C')
                          .reduce((sum, w) => sum + (w.ownership_percentage || 0), 0);

                        return (
                          <TableRow 
                            key={copyright.id}
                            className={`cursor-pointer ${selectedWorks.has(copyright.id) ? 'bg-accent' : ''}`}
                            onClick={() => toggleWorkSelection(copyright.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedWorks.has(copyright.id)}
                                onCheckedChange={() => toggleWorkSelection(copyright.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-mono">
                                {copyright.work_id || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{copyright.work_title}</div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {recordingsMap[copyright.id] || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {copyright.isrc || '-'}
                            </TableCell>
                            <TableCell>
                              {copyright.work_type ? (
                                <Badge variant="outline" className="text-xs">{copyright.work_type}</Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {copyright.iswc || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {copyright.album_title || '-'}
                            </TableCell>
                            <TableCell>
                              {writers.length > 0 ? (
                                <div className="space-y-1 text-sm">
                                  {writers.slice(0, 2).map((w, i) => (
                                    <div key={i}>
                                      <span className="font-medium">{w.writer_name}</span>
                                      {w.ownership_percentage ? (
                                        <span className="text-muted-foreground"> ({w.ownership_percentage}%)</span>
                                      ) : null}
                                      {w.pro_affiliation && (
                                        <div className="text-xs text-muted-foreground">{w.pro_affiliation}</div>
                                      )}
                                    </div>
                                  ))}
                                  {writers.length > 2 && (
                                    <span className="text-xs text-muted-foreground">+{writers.length - 2} more</span>
                                  )}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {controlledPct > 0 ? `${controlledPct}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={copyright.status === 'published' ? 'default' : 'secondary'}>
                                {copyright.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <EnhancedScheduleWorkForm 
            contractId={contractId}
            onSuccess={onSuccess}
            onCancel={onCancel}
            onSpotifyFetchChange={onSpotifyFetchChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}