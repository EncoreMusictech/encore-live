import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, CheckCircle, Music, Calendar, Clock, User, Building } from 'lucide-react';
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
}

export function WorkSelectionDialog({ contractId, onSuccess, onCancel }: WorkSelectionDialogProps) {
  const { toast } = useToast();
  const { copyrights, loading } = useCopyright();
  const { addScheduleWork } = useContracts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [workInheritance, setWorkInheritance] = useState<{[key: string]: {
    inherits_royalty_splits: boolean;
    inherits_recoupment_status: boolean;
    inherits_controlled_status: boolean;
    work_specific_advance: number;
    work_specific_rate_reduction: number;
  }}>({});

  // Filter copyrights based on search term
  const filteredCopyrights = copyrights.filter(copyright => 
    copyright.work_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.album_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.internal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.iswc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      for (const copyrightId of selectedWorks) {
        const copyright = copyrights.find(c => c.id === copyrightId);
        if (!copyright) continue;

        const inheritance = workInheritance[copyrightId] || {
          inherits_royalty_splits: true,
          inherits_recoupment_status: true,
          inherits_controlled_status: true,
          work_specific_advance: 0,
          work_specific_rate_reduction: 0
        };

        console.log('Adding work to schedule:', {
          copyrightId,
          workTitle: copyright.work_title,
          inheritance
        });

        await addScheduleWork(contractId, {
          copyright_id: copyrightId,
          song_title: copyright.work_title,
          artist_name: null, // We'll get this from recordings if available
          album_title: copyright.album_title,
          work_id: copyright.work_id,
          isrc: null, // We'll get this from recordings if available
          iswc: copyright.iswc,
          inherits_royalty_splits: inheritance.inherits_royalty_splits,
          inherits_recoupment_status: inheritance.inherits_recoupment_status,
          inherits_controlled_status: inheritance.inherits_controlled_status,
          work_specific_advance: inheritance.work_specific_advance,
          work_specific_rate_reduction: inheritance.work_specific_rate_reduction
        });
      }

      toast({
        title: "Success",
        description: `Added ${selectedWorks.size} work(s) to contract schedule.`,
      });

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
                placeholder="Search by title, album, internal ID, or ISWC..."
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
                            type="button"
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
                    <Button type="button" onClick={handleAddSelectedWorks} className="flex-1">
                      Add {selectedWorks.size} Work(s) to Schedule
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedWorks(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Copyright Works Table */}
            {loading ? (
              <div className="text-center py-8">Loading copyright works...</div>
            ) : filteredCopyrights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No works found matching your search.' : 'No copyright works found. Create your first work using the "Create New Work" tab.'}
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
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Work Title</TableHead>
                        <TableHead>Internal ID</TableHead>
                        <TableHead>Album</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PRO Registration</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCopyrights.map((copyright) => (
                        <TableRow 
                          key={copyright.id}
                          className={selectedWorks.has(copyright.id) ? 'bg-accent' : ''}
                        >
                          <TableCell>
                            <Button
                              type="button"
                              variant={selectedWorks.has(copyright.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleWorkSelection(copyright.id)}
                            >
                              {selectedWorks.has(copyright.id) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{copyright.work_title}</div>
                              {copyright.iswc && (
                                <div className="text-xs text-muted-foreground">ISWC: {copyright.iswc}</div>
                              )}
                              {copyright.akas && copyright.akas.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  AKA: {copyright.akas.join(', ')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{copyright.internal_id || 'No ID'}</Badge>
                          </TableCell>
                          <TableCell>{copyright.album_title || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={copyright.status === 'published' ? 'default' : 'secondary'}>
                              {copyright.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {getRegistrationStatus(copyright)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(copyright.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}