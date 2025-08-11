import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Music } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useContacts } from "@/hooks/useContacts";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RoyaltyAllocationFormProps {
  onCancel: () => void;
  allocation?: any;
}

export function RoyaltyAllocationForm({ onCancel, allocation }: RoyaltyAllocationFormProps) {
  const [writers, setWriters] = useState<any[]>([]);
  const [availableCopyrights, setAvailableCopyrights] = useState<any[]>([]);
  const [loadingCopyrights, setLoadingCopyrights] = useState(false);
  const { createAllocation, updateAllocation } = useRoyaltyAllocations();
  const { contacts } = useContacts();
  const { batches } = useReconciliationBatches();
  const { user } = useAuth();
  
  // Track initialization to prevent infinite loops
  const initializationRef = useRef({
    hasLoadedCopyrights: false,
    hasInitializedWriters: false,
    currentAllocationId: null as string | null,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      song_title: allocation?.song_title || '',
      isrc: allocation?.isrc || '',
      iswc: allocation?.iswc || '',
      artist: allocation?.artist || '',
      gross_royalty_amount: allocation?.gross_royalty_amount || 0,
      controlled_status: allocation?.controlled_status || 'Non-Controlled',
      recoupable_expenses: allocation?.recoupable_expenses || false,
      batch_id: allocation?.batch_id || '',
      copyright_id: allocation?.copyright_id || '',
      comments: allocation?.comments || '',
      media_type: allocation?.media_type || '',
      quantity: allocation?.quantity || '',
      country: allocation?.country || '',
    }
  });

  // Stable memoized data
  const availableContacts = useMemo(() => 
    contacts.filter(c => c.contact_type === 'writer'), 
    [contacts]
  );
  
  const processedBatches = useMemo(() => 
    batches.filter(b => b.status === 'Processed'), 
    [batches]
  );

  // Load copyrights once on mount
  useEffect(() => {
    if (!user || initializationRef.current.hasLoadedCopyrights) return;
    
    console.log('Loading copyrights...');
    setLoadingCopyrights(true);
    initializationRef.current.hasLoadedCopyrights = true;
    
    const loadCopyrights = async () => {
      try {
        const { data, error } = await supabase
          .from('copyrights')
          .select(`
            id,
            work_title,
            internal_id,
            iswc,
            copyright_writers (
              id,
              writer_name,
              ownership_percentage,
              performance_share,
              mechanical_share,
              synchronization_share,
              ipi_number,
              pro_affiliation,
              writer_role,
              controlled_status
            )
          `)
          .eq('user_id', user.id)
          .order('work_title');

        if (error) throw error;
        console.log('Loaded copyrights:', data?.length || 0);
        setAvailableCopyrights(data || []);
      } catch (error) {
        console.error('Error loading copyrights:', error);
        toast({
          title: "Error",
          description: "Failed to load copyrights",
          variant: "destructive",
        });
      } finally {
        setLoadingCopyrights(false);
      }
    };

    loadCopyrights();
  }, [user?.id]);

  // Initialize writers once when allocation data is available
  useEffect(() => {
    const currentAllocationId = allocation?.id || 'new';
    
    // Check if we need to initialize writers
    if (
      initializationRef.current.hasInitializedWriters && 
      initializationRef.current.currentAllocationId === currentAllocationId
    ) {
      return;
    }

    console.log('Initializing writers for allocation:', currentAllocationId);
    
    // Mark as initialized
    initializationRef.current.hasInitializedWriters = true;
    initializationRef.current.currentAllocationId = currentAllocationId;

    if (!allocation) {
      // For new allocations, start with empty writers
      console.log('New allocation - starting with empty writers');
      setWriters([]);
      return;
    }

    // Initialize writers from existing allocation
    if (allocation.ownership_splits && Object.keys(allocation.ownership_splits).length > 0) {
      console.log('Loading writers from ownership_splits');
      
      const extractedWriters = Object.entries(allocation.ownership_splits).map(([key, value]: [string, any]) => {
        if (key.startsWith('copyright_writer_')) {
          return {
            id: Date.now() + Math.random(),
            contact_id: '',
            writer_name: value.writer_name || 'Unknown Writer',
            writer_ipi: '',
            pro_affiliation: '',
            writer_role: 'composer',
            controlled_status: 'NC',
            writer_share_percentage: value.writer_share || 0,
            performance_share: value.performance_share || 0,
            mechanical_share: value.mechanical_share || 0,
            synchronization_share: value.synchronization_share || 0,
          };
        } else {
          const contact = availableContacts.find(c => c.id === key);
          return {
            id: Date.now() + Math.random(),
            contact_id: key,
            writer_name: contact?.name || 'Unknown Writer',
            writer_ipi: '',
            pro_affiliation: '',
            writer_role: 'composer',
            controlled_status: 'NC',
            writer_share_percentage: value.writer_share || 0,
            performance_share: value.performance_share || 0,
            mechanical_share: value.mechanical_share || 0,
            synchronization_share: value.synchronization_share || 0,
          };
        }
      });
      
      setWriters(extractedWriters);
      return;
    }
    
    // Try to load from copyright if linked
    if (allocation.copyright_id && availableCopyrights.length > 0) {
      const linkedCopyright = availableCopyrights.find(c => c.id === allocation.copyright_id);
      console.log('Loading writers from linked copyright:', linkedCopyright);
      
      if (linkedCopyright?.copyright_writers?.length > 0) {
        const mappedWriters = linkedCopyright.copyright_writers.map((writer: any) => {
          const matchingContact = availableContacts.find(contact => 
            contact.name?.toLowerCase().trim() === writer.writer_name?.toLowerCase().trim()
          );
          
          return {
            id: Date.now() + Math.random(),
            contact_id: matchingContact?.id || '',
            writer_name: writer.writer_name || '',
            writer_ipi: writer.ipi_number || '',
            pro_affiliation: writer.pro_affiliation || '',
            writer_role: writer.writer_role || 'composer',
            controlled_status: writer.controlled_status || 'NC',
            writer_share_percentage: writer.ownership_percentage || 0,
            performance_share: writer.performance_share || 0,
            mechanical_share: writer.mechanical_share || 0,
            synchronization_share: writer.synchronization_share || 0,
          };
        });
        
        setWriters(mappedWriters);
      } else {
        setWriters([]);
      }
    } else {
      setWriters([]);
    }
  }, [allocation?.id, allocation?.copyright_id, allocation?.ownership_splits, availableCopyrights.length, availableContacts.length]);

  // Handle copyright selection
  const handleCopyrightChange = useCallback((copyrightId: string) => {
    setValue('copyright_id', copyrightId === 'none' ? '' : copyrightId);
    
    if (copyrightId && copyrightId !== 'none') {
      const selectedCopyright = availableCopyrights.find(c => c.id === copyrightId);
      
      if (selectedCopyright) {
        setValue('song_title', selectedCopyright.work_title);
        setValue('iswc', selectedCopyright.iswc || '');
        
        if (selectedCopyright.copyright_writers) {
          const copyrightWriters = selectedCopyright.copyright_writers.map((writer: any) => {
            const matchingContact = availableContacts.find(contact => 
              contact.name?.toLowerCase().trim() === writer.writer_name?.toLowerCase().trim()
            );
            
            return {
              id: Date.now() + Math.random(),
              contact_id: matchingContact?.id || '',
              writer_name: writer.writer_name,
              writer_ipi: writer.ipi_number || '',
              pro_affiliation: writer.pro_affiliation || '',
              writer_role: writer.writer_role || '',
              controlled_status: writer.controlled_status || '',
              writer_share_percentage: writer.ownership_percentage || 0,
              performance_share: writer.performance_share || 0,
              mechanical_share: writer.mechanical_share || 0,
              synchronization_share: writer.synchronization_share || 0,
            };
          });
          
          setWriters(copyrightWriters);
          
          if (copyrightWriters.length > 0) {
            toast({
              title: "Copyright Linked",
              description: `Work title, ISWC, and ${copyrightWriters.length} writers loaded from copyright`,
            });
          }
        }
      }
    } else {
      setValue('song_title', '');
      setValue('iswc', '');
      setWriters([]);
    }
  }, [availableCopyrights, availableContacts, setValue]);

  const onSubmit = async (data: any) => {
    try {
      console.log('🚀 FORM SUBMISSION STARTED');
      console.log('Form submission data:', data);
      
      const baseData = {
        ...data,
        batch_id: data.batch_id && data.batch_id !== '' ? data.batch_id : null,
        copyright_id: data.copyright_id && data.copyright_id !== '' ? data.copyright_id : null,
        controlled_status: undefined,
      };

      if (allocation) {
        const validWriters = writers.filter(writer => writer.contact_id && writer.contact_id !== 'none' && writer.contact_id !== '');
        const cleanedData = {
          ...baseData,
          ownership_splits: validWriters.length > 0 ? validWriters.reduce((acc, writer) => {
            acc[writer.contact_id] = {
              writer_share: writer.writer_share_percentage || 0,
              performance_share: writer.performance_share || 0,
              mechanical_share: writer.mechanical_share || 0,
              synchronization_share: writer.synchronization_share || 0,
            };
            return acc;
          }, {}) : {},
        };
        await updateAllocation(allocation.id, cleanedData);
      } else {
        const validWriters = writers.filter(writer => writer.contact_id && writer.contact_id !== 'none' && writer.contact_id !== '');
        const copyrightWriters = writers.filter(writer => !writer.contact_id || writer.contact_id === '' || writer.contact_id === 'none');
        
        const controlledValidWriters = validWriters.filter(writer => writer.controlled_status === 'C');
        const controlledCopyrightWriters = copyrightWriters.filter(writer => writer.controlled_status === 'C');
        
        if (baseData.copyright_id && (controlledValidWriters.length > 0 || controlledCopyrightWriters.length > 0)) {
          const grossAmount = parseFloat(data.gross_royalty_amount) || 0;
          const allControlledWritersToProcess = [...controlledValidWriters, ...controlledCopyrightWriters];
          
          for (const writer of allControlledWritersToProcess) {
            const writerShare = writer.writer_share_percentage || 0;
            const writerAmount = (grossAmount * writerShare) / 100;
            
            const writerAllocationData = {
              ...baseData,
              gross_royalty_amount: writerAmount,
              work_writers: writer.writer_name,
              share: `${writerShare}%`,
              ownership_splits: writer.contact_id ? {
                [writer.contact_id]: {
                  writer_share: writerShare,
                  performance_share: writer.performance_share || 0,
                  mechanical_share: writer.mechanical_share || 0,
                  synchronization_share: writer.synchronization_share || 0,
                }
              } : {
                [`copyright_writer_${writer.id}`]: {
                  writer_share: writerShare,
                  writer_name: writer.writer_name,
                  performance_share: writer.performance_share || 0,
                  mechanical_share: writer.mechanical_share || 0,
                  synchronization_share: writer.synchronization_share || 0,
                }
              }
            };
            
            await createAllocation(writerAllocationData);
          }
        } else {
          const validWriters = writers.filter(writer => writer.contact_id && writer.contact_id !== 'none' && writer.contact_id !== '');
          const cleanedData = {
            ...baseData,
            ownership_splits: validWriters.length > 0 ? validWriters.reduce((acc, writer) => {
              acc[writer.contact_id] = {
                writer_share: writer.writer_share_percentage || 0,
                performance_share: writer.performance_share || 0,
                mechanical_share: writer.mechanical_share || 0,
                synchronization_share: writer.synchronization_share || 0,
              };
              return acc;
            }, {}) : {},
          };
          await createAllocation(cleanedData);
        }
      }
      onCancel();
    } catch (error) {
      console.error('Error saving allocation:', error);
    }
  };

  const addWriter = useCallback(() => {
    setWriters(prev => [...prev, {
      id: Date.now(),
      contact_id: '',
      writer_name: '',
      writer_ipi: '',
      pro_affiliation: '',
      writer_role: 'composer',
      controlled_status: 'NC',
      writer_share_percentage: 0,
      performance_share: 0,
      mechanical_share: 0,
      synchronization_share: 0,
    }]);
  }, []);

  const removeWriter = useCallback((index: number) => {
    setWriters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateWriter = useCallback((index: number, field: string, value: any) => {
    setWriters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const totalWriterShares = useMemo(() => 
    writers.reduce((sum, writer) => sum + (writer.writer_share_percentage || 0), 0),
    [writers]
  );

  if (loadingCopyrights) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading copyrights...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="song_title">
            Work Title{!watch('copyright_id') && ' *'}
          </Label>
          <Input
            id="song_title"
            {...register('song_title', { 
              required: !watch('copyright_id') ? 'Work title is required' : false 
            })}
            readOnly={!!watch('copyright_id')}
            className={watch('copyright_id') ? 'bg-muted/50' : ''}
          />
          {errors.song_title && (
            <p className="text-sm text-red-600">{String(errors.song_title.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="isrc">ISRC</Label>
          <Input
            id="isrc"
            placeholder="USRC17607839"
            {...register('isrc')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="iswc">ISWC</Label>
          <Input
            id="iswc"
            placeholder="T-034.524.680-1"
            {...register('iswc')}
            readOnly={!!watch('copyright_id')}
            className={watch('copyright_id') ? 'bg-muted/50' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gross_royalty_amount">Royalty Amount</Label>
          <Input
            id="gross_royalty_amount"
            type="number"
            step="0.01"
            {...register('gross_royalty_amount', { valueAsNumber: true })}
          />
        </div>

        {(processedBatches.length > 0 || watch('batch_id')) && (
          <div className="space-y-2">
            <Label htmlFor="batch_id">Source Batch</Label>
            <Select onValueChange={(value) => setValue('batch_id', value)} defaultValue={watch('batch_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {processedBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batch_id} - {batch.source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="copyright_id">Linked Copyright</Label>
          <Select 
            onValueChange={handleCopyrightChange} 
            defaultValue={watch('copyright_id')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a copyright" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="none">No copyright linked</SelectItem>
              {availableCopyrights.map((copyright) => (
                <SelectItem key={copyright.id} value={copyright.id}>
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span>{copyright.work_title}</span>
                    {copyright.internal_id && (
                      <Badge variant="outline" className="text-xs">
                        {copyright.internal_id}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(!allocation || !allocation?.statement_id) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="media_type">Media Type</Label>
            <Select onValueChange={(value) => setValue('media_type', value)} defaultValue={watch('media_type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select media type" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="PERF">PERF - Performance Rights</SelectItem>
                <SelectItem value="MECH">MECH - Mechanical Rights</SelectItem>
                <SelectItem value="SYNCH">SYNCH - Synchronization Rights</SelectItem>
                <SelectItem value="PRINT">PRINT - Print Rights</SelectItem>
                <SelectItem value="OTHER">OTHER - Other Rights</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              placeholder="e.g., 1000 units, 50,000 streams"
              {...register('quantity')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Territory</Label>
            <Select onValueChange={(value) => setValue('country', value)} defaultValue={watch('country')}>
              <SelectTrigger>
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
                <SelectItem value="BR">Brazil</SelectItem>
                <SelectItem value="MX">Mexico</SelectItem>
                <SelectItem value="Worldwide">Worldwide</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Writers & Shares</h3>
          <Button type="button" onClick={addWriter} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Writer
          </Button>
        </div>

        {totalWriterShares > 100 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Warning: Total writer shares exceed 100% ({totalWriterShares}%)
            </p>
          </div>
        )}

        {writers.map((writer, index) => (
          <Card key={writer.id || index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Writer {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWriter(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {watch('copyright_id') && writer.writer_name ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Name *</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.writer_name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer IPI</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm text-muted-foreground">
                          {writer.writer_ipi || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm font-medium">{writer.writer_share_percentage}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PRO Affiliation</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">
                          {writer.pro_affiliation || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Performance Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.performance_share}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mechanical Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.mechanical_share}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Controlled?</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">
                          {writer.controlled_status === 'C' ? 'C (Controlled)' : 'NC (Non-Controlled)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Link to Contact (for payments)</Label>
                      <Select
                        value={writer.contact_id || "none"}
                        onValueChange={(value) => updateWriter(index, 'contact_id', value === "none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact for payments" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value="none">No contact linked</SelectItem>
                          {availableContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Name *</Label>
                      <Input
                        value={writer.writer_name || ''}
                        onChange={(e) => updateWriter(index, 'writer_name', e.target.value)}
                        placeholder="Enter writer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer IPI</Label>
                      <Input
                        value={writer.writer_ipi || ''}
                        onChange={(e) => updateWriter(index, 'writer_ipi', e.target.value)}
                        placeholder="IPI Number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Share %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max="100"
                        value={writer.writer_share_percentage}
                        onChange={(e) => updateWriter(index, 'writer_share_percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PRO Affiliation</Label>
                      <Select
                        value={writer.pro_affiliation || ""}
                        onValueChange={(value) => updateWriter(index, 'pro_affiliation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select PRO" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value="ASCAP">ASCAP</SelectItem>
                          <SelectItem value="BMI">BMI</SelectItem>
                          <SelectItem value="SESAC">SESAC</SelectItem>
                          <SelectItem value="SOCAN">SOCAN</SelectItem>
                          <SelectItem value="PRS">PRS</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Performance Share %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max="100"
                        value={writer.performance_share}
                        onChange={(e) => updateWriter(index, 'performance_share', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mechanical Share %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max="100"
                        value={writer.mechanical_share}
                        onChange={(e) => updateWriter(index, 'mechanical_share', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Controlled?</Label>
                      <Select
                        value={writer.controlled_status || "NC"}
                        onValueChange={(value) => updateWriter(index, 'controlled_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value="C">C (Controlled)</SelectItem>
                          <SelectItem value="NC">NC (Non-Controlled)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Link to Contact (for payments)</Label>
                      <Select
                        value={writer.contact_id || "none"}
                        onValueChange={(value) => updateWriter(index, 'contact_id', value === "none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact for payments" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value="none">No contact linked</SelectItem>
                          {availableContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Link this writer to an existing contact for royalty payments
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {writers.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-md">
            <p className="text-muted-foreground">No writers added yet</p>
            <Button type="button" onClick={addWriter} size="sm" className="mt-2">
              Add First Writer
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          placeholder="Add any additional notes..."
          {...register('comments')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {allocation ? 'Update Royalty' : 'Create Royalty'}
        </Button>
      </div>
    </form>
  );
}
