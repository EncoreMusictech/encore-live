import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Plus, X, AlertTriangle, CheckCircle, Search, Music, FileText, Users, Gavel, Link2, Loader2, ExternalLink } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CopyrightInsert, useCopyright, Copyright } from '@/hooks/useCopyright';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from './AudioPlayer';
import { useWriterContracts } from '@/hooks/useWriterContracts';
import { WriterAgreementSection } from './WriterAgreementSection';

interface EnhancedCopyrightFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingCopyright?: Copyright | null;
}

interface Writer {
  id: string;
  name: string;
  ipi: string;
  share: number;
  proAffiliation: string;
  controlled: 'C' | 'NC';
  publisherName: string;
  publisherIpi: string;
}

interface SpotifyMetadata {
  albumTitle?: string;
  masterOwner?: string;
  previewUrl?: string;
  popularity?: number;
  isrc?: string;
  artist?: string;
  duration?: number;
  releaseDate?: string;
}

export const EnhancedCopyrightForm: React.FC<EnhancedCopyrightFormProps> = ({ onSuccess, onCancel, editingCopyright }) => {
  const { createCopyright, updateCopyright, getWritersForCopyright } = useCopyright();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [ascapLoading, setAscapLoading] = useState(false);
  
  // Collapsible section states
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [writersOpen, setWritersOpen] = useState(true);
  const [proRegistrationOpen, setProRegistrationOpen] = useState(false);
  const [legalFilingOpen, setLegalFilingOpen] = useState(false);
  const [contractLinkOpen, setContractLinkOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<CopyrightInsert & {
    work_id?: string;
    album_title?: string;
    masters_ownership?: string;
    mp3_link?: string;
    contains_sample?: boolean;
    akas?: string[];
    ascap_work_id?: string;
    bmi_work_id?: string;
    socan_work_id?: string;
    sesac_work_id?: string;
    ascap_status?: string;
    bmi_status?: string;
    socan_status?: string;
    sesac_status?: string;
    registration_status?: string;
    date_submitted?: string;
    copyright_reg_number?: string;
    copyright_date?: string;
    notice_date?: string;
    isrc?: string;
  }>>({
    work_title: '',
    work_type: 'original',
    language_code: 'EN',
    registration_type: 'new',
    status: 'draft',
    supports_ddex: true,
    supports_cwr: true,
    collection_territories: [],
    rights_types: [],
    contains_sample: false,
    akas: [],
    registration_status: 'not_registered'
  });

  const [writers, setWriters] = useState<Writer[]>([]);
  const [spotifyMetadata, setSpotifyMetadata] = useState<SpotifyMetadata | null>(null);
  const [newAka, setNewAka] = useState('');

  // Calculate total controlled share
  const totalControlledShare = writers
    .filter(w => w.controlled === 'C')
    .reduce((sum, w) => sum + w.share, 0);

  const totalWriterShare = writers.reduce((sum, w) => sum + w.share, 0);

  // Debounced Spotify metadata fetch
  const fetchSpotifyMetadata = useCallback(async (workTitle: string, artist?: string) => {
    if (!workTitle.trim() || workTitle.length < 3) return;

    setSpotifyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-track-metadata', {
        body: { workTitle: artist ? `${workTitle} ${artist}` : workTitle }
      });

      if (error) {
        console.error('Error fetching Spotify metadata:', error);
        return;
      }

      if (data?.success && data?.bestMatch) {
        const metadata: SpotifyMetadata = {
          albumTitle: data.bestMatch.albumName,
          masterOwner: data.bestMatch.label,
          previewUrl: data.bestMatch.previewUrl,
          popularity: data.bestMatch.popularity,
          isrc: data.bestMatch.isrc,
          artist: data.bestMatch.artist,
          duration: data.bestMatch.duration,
          releaseDate: data.bestMatch.releaseDate
        };

        setSpotifyMetadata(metadata);
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          album_title: metadata.albumTitle || prev.album_title,
          masters_ownership: metadata.masterOwner || prev.masters_ownership,
          mp3_link: metadata.previewUrl || prev.mp3_link,
          duration_seconds: metadata.duration || prev.duration_seconds,
          isrc: metadata.isrc || prev.isrc
        }));

        toast({
          title: "Spotify Metadata Found",
          description: `Auto-filled metadata for "${data.bestMatch.trackName}" by ${data.bestMatch.artist}`,
        });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setSpotifyLoading(false);
    }
  }, [toast]);

  // Debounce the metadata fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.work_title) {
        fetchSpotifyMetadata(formData.work_title);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
   }, [formData.work_title, fetchSpotifyMetadata]);

  // Load existing copyright data when editing
  useEffect(() => {
    const loadEditingData = async () => {
      if (editingCopyright) {
        // Populate form with existing copyright data
        setFormData({
          work_title: editingCopyright.work_title || '',
          work_type: editingCopyright.work_type || 'original',
          language_code: editingCopyright.language_code || 'EN',
          registration_type: editingCopyright.registration_type || 'new',
          status: editingCopyright.status || 'draft',
          supports_ddex: editingCopyright.supports_ddex ?? true,
          supports_cwr: editingCopyright.supports_cwr ?? true,
          collection_territories: editingCopyright.collection_territories || [],
          rights_types: editingCopyright.rights_types || [],
          contains_sample: editingCopyright.contains_sample || false,
          akas: editingCopyright.akas || [],
          registration_status: editingCopyright.registration_status || 'not_registered',
          ascap_work_id: editingCopyright.ascap_work_id || '',
          bmi_work_id: editingCopyright.bmi_work_id || '',
          socan_work_id: editingCopyright.socan_work_id || '',
          sesac_work_id: editingCopyright.sesac_work_id || '',
          ascap_status: (editingCopyright as any).ascap_status || 'not_registered',
          bmi_status: (editingCopyright as any).bmi_status || 'not_registered',
          socan_status: (editingCopyright as any).socan_status || 'not_registered',
          sesac_status: (editingCopyright as any).sesac_status || 'not_registered',
          copyright_reg_number: editingCopyright.copyright_reg_number || '',
          copyright_date: editingCopyright.copyright_date || '',
          notice_date: editingCopyright.notice_date || '',
          creation_date: editingCopyright.creation_date || '',
          work_classification: editingCopyright.work_classification || '',
          notes: editingCopyright.notes || '',
          internal_id: editingCopyright.internal_id || '',
          iswc: editingCopyright.iswc || '',
          catalogue_number: editingCopyright.catalogue_number || '',
          opus_number: editingCopyright.opus_number || '',
          duration_seconds: editingCopyright.duration_seconds || null,
          album_title: editingCopyright.album_title || '',
          masters_ownership: editingCopyright.masters_ownership || '',
          mp3_link: editingCopyright.mp3_link || ''
        });

        // Load existing writers
        try {
          const existingWriters = await getWritersForCopyright(editingCopyright.id);
          const formattedWriters: Writer[] = existingWriters.map((writer, index) => ({
            id: writer.id || `writer-${index}`,
            name: writer.writer_name || '',
            ipi: writer.ipi_number || '',
            share: writer.ownership_percentage || 0,
            proAffiliation: writer.pro_affiliation || '',
            controlled: (writer.controlled_status as 'C' | 'NC') || 'NC',
            publisherName: '',
            publisherIpi: ''
          }));
          setWriters(formattedWriters);
        } catch (error) {
          console.error('Error loading existing writers:', error);
        }
      }
    };

    loadEditingData();
  }, [editingCopyright, getWritersForCopyright]);

  const searchASCAP = () => {
    window.open('https://www.ascap.com/repertory#/', '_blank');
  };

  const addWriter = () => {
    const newWriter: Writer = {
      id: `writer-${Date.now()}`,
      name: '',
      ipi: '',
      share: 0,
      proAffiliation: '',
      controlled: 'NC',
      publisherName: '',
      publisherIpi: ''
    };
    setWriters([...writers, newWriter]);
  };

  const removeWriter = (id: string) => {
    setWriters(writers.filter(w => w.id !== id));
  };

  const updateWriter = (id: string, field: keyof Writer, value: any) => {
    setWriters(writers.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const addAka = () => {
    if (newAka && !formData.akas?.includes(newAka)) {
      const updatedAkas = [...(formData.akas || []), newAka];
      setFormData(prev => ({ ...prev, akas: updatedAkas }));
      setNewAka('');
    }
  };

  const removeAka = (aka: string) => {
    const updatedAkas = formData.akas?.filter(a => a !== aka) || [];
    setFormData(prev => ({ ...prev, akas: updatedAkas }));
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'not_registered': return 'bg-gray-400';
      case 'pending_registration': return 'bg-yellow-400';
      case 'fully_registered': return 'bg-green-400';
      case 'needs_amendment': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getRegistrationStatusValue = (status: string) => {
    switch (status) {
      case 'not_registered': return 0;
      case 'pending_registration': return 33;
      case 'fully_registered': return 100;
      case 'needs_amendment': return 66;
      default: return 0;
    }
  };

  // Function to reset the form to initial state
  const resetForm = () => {
    setFormData({
      work_title: '',
      work_type: 'original',
      language_code: 'EN',
      registration_type: 'new',
      status: 'draft',
      supports_ddex: true,
      supports_cwr: true,
      collection_territories: [],
      rights_types: [],
      contains_sample: false,
      akas: [],
      registration_status: 'not_registered'
    });
    setWriters([]);
    setSpotifyMetadata(null);
    setNewAka('');
    
    // Reset collapsible sections to initial state
    setMetadataOpen(true);
    setWritersOpen(true);
    setProRegistrationOpen(false);
    setLegalFilingOpen(false);
    setContractLinkOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.work_title) return;

    // Validate writer shares
    if (totalWriterShare !== 100) {
      toast({
        title: "Invalid Writer Shares",
        description: `Writer shares must total 100%. Current total: ${totalWriterShare}%`,
        variant: "destructive"
      });
      return;
    }

    // Validate controlled share
    if (totalControlledShare > 100) {
      toast({
        title: "Invalid Controlled Share",
        description: `Total controlled publisher share cannot exceed 100%. Current total: ${totalControlledShare}%`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare the copyright data with only valid database fields
      const cleanFormData: Omit<CopyrightInsert, 'user_id'> = {
        work_title: formData.work_title || '',
        work_type: formData.work_type,
        language_code: formData.language_code,
        registration_type: formData.registration_type,
        status: formData.status,
        supports_ddex: formData.supports_ddex,
        supports_cwr: formData.supports_cwr,
        collection_territories: formData.collection_territories,
        rights_types: formData.rights_types,
        contains_sample: formData.contains_sample,
        akas: formData.akas,
        registration_status: formData.registration_status,
        ascap_work_id: formData.ascap_work_id,
        bmi_work_id: formData.bmi_work_id,
        socan_work_id: formData.socan_work_id,
        sesac_work_id: formData.sesac_work_id,
        ascap_status: formData.ascap_status,
        bmi_status: formData.bmi_status,
        socan_status: formData.socan_status,
        sesac_status: formData.sesac_status,
        copyright_reg_number: formData.copyright_reg_number,
        copyright_date: formData.copyright_date,
        notice_date: formData.notice_date,
        creation_date: formData.creation_date,
        work_classification: formData.work_classification,
        notes: formData.notes,
        internal_id: formData.internal_id,
        iswc: formData.iswc,
        catalogue_number: formData.catalogue_number,
        opus_number: formData.opus_number,
        duration_seconds: formData.duration_seconds,
        album_title: formData.album_title,
        masters_ownership: formData.masters_ownership,
        mp3_link: formData.mp3_link
      };
      
      let copyrightData;
      if (editingCopyright) {
        // Update existing copyright
        copyrightData = await updateCopyright(editingCopyright.id, cleanFormData as Partial<CopyrightInsert>);
        
        // Delete existing writers and recreate them
        await supabase.from('copyright_writers').delete().eq('copyright_id', editingCopyright.id);
      } else {
        // Create new copyright
        copyrightData = await createCopyright(cleanFormData as CopyrightInsert);
      }
      
      // Create/recreate writer records
      for (const writer of writers) {
        await supabase.from('copyright_writers').insert({
          copyright_id: copyrightData.id,
          writer_name: writer.name,
          ipi_number: writer.ipi || null,
          ownership_percentage: writer.share,
          pro_affiliation: writer.proAffiliation || null,
          controlled_status: writer.controlled,
          writer_role: 'composer'
        });
      }
      
      // Reset the form after successful creation/update (only for new creations)
      if (!editingCopyright) {
        resetForm();
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving copyright:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.work_title && formData.work_title.length > 0 && totalWriterShare === 100 && totalControlledShare <= 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Metadata Section */}
      <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Metadata
                <Badge variant="outline" className="text-xs">Required</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_title">Work Title *</Label>
                  <div className="relative">
                    <Input
                      id="work_title"
                      value={formData.work_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, work_title: e.target.value }))}
                      placeholder="Enter work title"
                      required
                    />
                    {spotifyLoading && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work_id">Work ID</Label>
                  <Input
                    id="work_id"
                    value="Auto-generated"
                    disabled
                    placeholder="W20240714-000001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iswc">ISWC</Label>
                  <Input
                    id="iswc"
                    value={formData.iswc || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, iswc: e.target.value }))}
                    placeholder="T-123.456.789-0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="isrc">ISRC</Label>
                  <Input
                    id="isrc"
                    value={formData.isrc || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, isrc: e.target.value }))}
                    placeholder={spotifyMetadata?.isrc ? "Auto-filled from Spotify" : "USAT21234567"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="track_duration">Track Duration</Label>
                  <Input
                    id="track_duration"
                    value={spotifyMetadata?.duration ? `${Math.floor(spotifyMetadata.duration / 60)}:${(spotifyMetadata.duration % 60).toString().padStart(2, '0')}` : ''}
                    placeholder={spotifyMetadata?.duration ? "Auto-filled from Spotify" : "e.g., 3:45"}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="release_date">Release Date</Label>
                  <Input
                    id="release_date"
                    value={spotifyMetadata?.releaseDate || ''}
                    placeholder={spotifyMetadata?.releaseDate ? "Auto-filled from Spotify" : "YYYY-MM-DD"}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="album_title">Album Title</Label>
                  <Input
                    id="album_title"
                    value={formData.album_title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, album_title: e.target.value }))}
                    placeholder={spotifyMetadata?.albumTitle ? "Auto-filled from Spotify" : "Enter album title"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="masters_ownership">Masters Ownership</Label>
                  <Input
                    id="masters_ownership"
                    value={formData.masters_ownership || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, masters_ownership: e.target.value }))}
                    placeholder={spotifyMetadata?.masterOwner ? "Auto-filled from Spotify" : "Label or distributor"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Audio Preview</Label>
                  <AudioPlayer 
                    src={formData.mp3_link || spotifyMetadata?.previewUrl}
                    title={formData.work_title}
                    artist={spotifyMetadata?.artist}
                  />
                  {(!formData.mp3_link && !spotifyMetadata?.previewUrl) && (
                    <div className="mt-2">
                      <Label htmlFor="mp3_link_manual">Manual Audio URL (optional)</Label>
                      <Input
                        id="mp3_link_manual"
                        type="url"
                        value={formData.mp3_link || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mp3_link: e.target.value }))}
                        placeholder="Enter audio preview URL"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Contains Sample?</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.contains_sample || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contains_sample: checked }))}
                    />
                    <Label className="text-sm text-muted-foreground">
                      {formData.contains_sample ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* AKAs Section */}
              <div className="space-y-2">
                <Label>AKAs (Alternate Titles)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAka}
                    onChange={(e) => setNewAka(e.target.value)}
                    placeholder="Enter alternate title"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAka())}
                  />
                  <Button type="button" onClick={addAka} disabled={!newAka}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.akas?.map(aka => (
                    <Badge key={aka} variant="secondary" className="flex items-center gap-1">
                      {aka}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeAka(aka)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* ASCAP Lookup Button */}
              <div className="flex justify-start">
                <Button 
                  type="button" 
                  onClick={searchASCAP}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search ASCAP Database
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Writers Section */}
      <Collapsible open={writersOpen} onOpenChange={setWritersOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Writers
                <Badge variant={totalWriterShare === 100 ? "default" : "destructive"}>
                  {writers.length} writers • {totalWriterShare}% total
                </Badge>
                <Badge variant={totalControlledShare <= 100 ? "default" : "destructive"}>
                  {totalControlledShare}% controlled
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {writers.map((writer) => (
                <div key={writer.id} className="p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Writer Name *</Label>
                      <Input
                        value={writer.name}
                        onChange={(e) => updateWriter(writer.id, 'name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Writer IPI</Label>
                      <Input
                        value={writer.ipi}
                        onChange={(e) => updateWriter(writer.id, 'ipi', e.target.value)}
                        placeholder="123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Writer Share %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={writer.share}
                        onChange={(e) => updateWriter(writer.id, 'share', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PRO Affiliation</Label>
                      <Select
                        value={writer.proAffiliation}
                        onValueChange={(value) => updateWriter(writer.id, 'proAffiliation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select PRO" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASCAP">ASCAP</SelectItem>
                          <SelectItem value="BMI">BMI</SelectItem>
                          <SelectItem value="SESAC">SESAC</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Publisher Name</Label>
                      <Input
                        value={writer.publisherName}
                        onChange={(e) => updateWriter(writer.id, 'publisherName', e.target.value)}
                        placeholder="Publisher Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Publisher IPI</Label>
                      <Input
                        value={writer.publisherIpi}
                        onChange={(e) => updateWriter(writer.id, 'publisherIpi', e.target.value)}
                        placeholder="Publisher IPI Number"
                      />
                    </div>
                   </div>
                   
                   {/* Agreement Section */}
                   <div className="space-y-2">
                     <Label>Writer Agreements</Label>
                     <WriterAgreementSection 
                       writerName={writer.name}
                       onControlledStatusChange={(hasAgreements) => {
                         if (hasAgreements && writer.controlled !== 'C') {
                           updateWriter(writer.id, 'controlled', 'C');
                         }
                       }}
                     />
                   </div>
                   
                   <div className="flex items-center justify-between">
                     <div className="space-y-2">
                       <Label>Controlled?</Label>
                       <Select
                         value={writer.controlled}
                         onValueChange={(value: 'C' | 'NC') => updateWriter(writer.id, 'controlled', value)}
                       >
                         <SelectTrigger className="w-32">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="C">C (Controlled)</SelectItem>
                           <SelectItem value="NC">NC (Non-Controlled)</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <Button
                       type="button"
                       variant="destructive"
                       size="sm"
                       onClick={() => removeWriter(writer.id)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
              ))}

              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Total Pub Controlled: {totalControlledShare.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Total Writer Share: {totalWriterShare.toFixed(2)}%</p>
                </div>
                <Button type="button" onClick={addWriter} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Writer
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* PRO Registration Section */}
      <Collapsible open={proRegistrationOpen} onOpenChange={setProRegistrationOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                PRO Registration
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ascap_work_id">ASCAP Work ID</Label>
                  <Input
                    id="ascap_work_id"
                    value={formData.ascap_work_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ascap_work_id: e.target.value }))}
                    placeholder="ASCAP Work ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ascap_status">ASCAP Status</Label>
                  <Select
                    value={formData.ascap_status || 'not_registered'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, ascap_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-6"
                    onClick={searchASCAP}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search ASCAP
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bmi_work_id">BMI Work ID</Label>
                  <Input
                    id="bmi_work_id"
                    value={formData.bmi_work_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bmi_work_id: e.target.value }))}
                    placeholder="BMI Work ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bmi_status">BMI Status</Label>
                  <Select
                    value={formData.bmi_status || 'not_registered'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bmi_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => window.open('https://repertoire.bmi.com/Search', '_blank')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search BMI
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="socan_work_id">SOCAN Work ID</Label>
                  <Input
                    id="socan_work_id"
                    value={formData.socan_work_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, socan_work_id: e.target.value }))}
                    placeholder="SOCAN Work ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="socan_status">SOCAN Status</Label>
                  <Select
                    value={formData.socan_status || 'not_registered'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, socan_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => window.open('https://www.socan.com/members/music-search', '_blank')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search SOCAN
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sesac_work_id">SESAC Work ID</Label>
                  <Input
                    id="sesac_work_id"
                    value={formData.sesac_work_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, sesac_work_id: e.target.value }))}
                    placeholder="SESAC Work ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sesac_status">SESAC Status</Label>
                  <Select
                    value={formData.sesac_status || 'not_registered'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sesac_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => window.open('https://www.sesac.com/', '_blank')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search SESAC
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Legal Filing Section */}
      <Collapsible open={legalFilingOpen} onOpenChange={setLegalFilingOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Legal Filing
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="copyright_reg_number">Copyright Reg. Number</Label>
                  <Input
                    id="copyright_reg_number"
                    value={formData.copyright_reg_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyright_reg_number: e.target.value }))}
                    placeholder="From U.S. Copyright Office"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyright_date">Copyright Date</Label>
                  <Input
                    id="copyright_date"
                    type="date"
                    value={formData.copyright_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyright_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_submitted">Date Submitted</Label>
                  <Input
                    id="date_submitted"
                    type="date"
                    value={formData.date_submitted || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_submitted: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice_date">Notice Date / Recordation Date</Label>
                  <Input
                    id="notice_date"
                    type="date"
                    value={formData.notice_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notice_date: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Contract Link Section */}
      <Collapsible open={contractLinkOpen} onOpenChange={setContractLinkOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Contract Link
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dynamic schedules of works will be automatically generated for contracts containing controlled writers from this work.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {editingCopyright ? 'Update Copyright' : 'Create Copyright'}
        </Button>
      </div>
    </form>
  );
};