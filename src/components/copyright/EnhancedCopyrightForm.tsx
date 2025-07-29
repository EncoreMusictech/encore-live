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
import { ArtistSelector } from './ArtistSelector';
import { ProRegistrationSection } from './ProRegistrationSection';
import { ContractIntegrationPanel } from './ContractIntegrationPanel';
import { CMORegistration, getAllPROs } from '@/data/cmo-territories';
import { DocumentUpload } from '@/components/ui/document-upload';

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
  trackName?: string;
  albumName?: string;
  label?: string;
}

interface SpotifyTrackMetadata {
  isrc?: string;
  artist: string;
  duration: number;
  releaseDate: string;
  trackName: string;
  albumName: string;
  label?: string;
  previewUrl?: string;
  popularity?: number;
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
    mlc_work_id?: string;
    ascap_status?: string;
    bmi_status?: string;
    socan_status?: string;
    sesac_status?: string;
    mlc_status?: string;
    registration_status?: string;
    date_submitted?: string;
    copyright_reg_number?: string;
    copyright_date?: string;
    notice_date?: string;
    isrc?: string;
    artist?: string;
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
  const [spotifyAlternatives, setSpotifyAlternatives] = useState<SpotifyTrackMetadata[]>([]);
  const [newAka, setNewAka] = useState('');
  const [cmoRegistrations, setCmoRegistrations] = useState<CMORegistration[]>([]);

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
        body: { 
          workTitle: workTitle.trim(),
          artist: artist?.trim() || undefined
        }
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
          releaseDate: data.bestMatch.releaseDate,
          trackName: data.bestMatch.trackName,
          albumName: data.bestMatch.albumName,
          label: data.bestMatch.label
        };

        setSpotifyMetadata(metadata);
        
        // Store alternatives if available
        if (data.alternatives && data.alternatives.length > 0) {
          console.log(`Received ${data.alternatives.length} alternatives from Spotify:`, data.alternatives);
          setSpotifyAlternatives(data.alternatives);
        } else {
          console.log('No alternatives received from Spotify');
          setSpotifyAlternatives([]);
        }
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          album_title: metadata.albumTitle || prev.album_title,
          masters_ownership: metadata.masterOwner || prev.masters_ownership,
          mp3_link: metadata.previewUrl || prev.mp3_link,
          duration_seconds: metadata.duration || prev.duration_seconds,
          creation_date: metadata.releaseDate || prev.creation_date,
          artist: metadata.artist || prev.artist
        }));

        // Store ISRC in spotifyMetadata for display/use
        setSpotifyMetadata(prev => ({
          ...prev,
          isrc: metadata.isrc
        }));

        const totalOptions = 1 + (data.alternatives?.length || 0);
        toast({
          title: "Spotify Metadata Found",
          description: `Found ${totalOptions} artist option${totalOptions > 1 ? 's' : ''} for "${data.bestMatch.trackName}"`,
        });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setSpotifyLoading(false);
    }
  }, [toast]);

  // Debounce the metadata fetching - only when creating new copyrights
  useEffect(() => {
    // Only run Spotify search when creating new copyright (not editing)
    if (editingCopyright) {
      console.log('Skipping Spotify search - editing existing copyright');
      return;
    }
    
    console.log('Setting up Spotify search timeout for new copyright:', formData.work_title);
    const timeoutId = setTimeout(() => {
      if (formData.work_title) {
        console.log('Triggering Spotify search for new copyright:', formData.work_title);
        fetchSpotifyMetadata(formData.work_title, formData.artist);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
   }, [formData.work_title, fetchSpotifyMetadata, editingCopyright]);

  // Debounce metadata fetching when artist changes manually
  useEffect(() => {
    // Only run when creating new copyright and both work title and artist are provided
    if (editingCopyright || !formData.work_title || !formData.artist) {
      return;
    }
    
    console.log('Setting up Spotify search for artist change:', formData.artist);
    const timeoutId = setTimeout(() => {
      console.log('Triggering Spotify search with artist:', formData.work_title, formData.artist);
      fetchSpotifyMetadata(formData.work_title, formData.artist);
    }, 1500); // Slightly longer delay for artist changes

    return () => clearTimeout(timeoutId);
   }, [formData.artist, fetchSpotifyMetadata, editingCopyright, formData.work_title]);

  // Load existing copyright data when editing
  useEffect(() => {
    if (!editingCopyright) return;
    
    console.log('Loading editing data for copyright:', editingCopyright.id, editingCopyright.work_title);
    console.log('Raw PRO status from database:', {
      ascap_status: (editingCopyright as any).ascap_status,
      bmi_status: (editingCopyright as any).bmi_status,
      socan_status: (editingCopyright as any).socan_status,
      sesac_status: (editingCopyright as any).sesac_status
    });
    
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
      mlc_work_id: (editingCopyright as any).mlc_work_id || '',
      ascap_status: (editingCopyright as any).ascap_status || 'not_registered',
      bmi_status: (editingCopyright as any).bmi_status || 'not_registered',
      socan_status: (editingCopyright as any).socan_status || 'not_registered',
      sesac_status: (editingCopyright as any).sesac_status || 'not_registered',
      mlc_status: (editingCopyright as any).mlc_status || 'not_registered',
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

    // Convert existing PRO status fields to CMO registrations for the new UI
    const existingCMORegistrations: CMORegistration[] = [];
    
    if (editingCopyright.ascap_work_id || (editingCopyright as any).ascap_status) {
      existingCMORegistrations.push({
        id: `ascap-${Date.now()}`,
        cmoId: 'ascap',
        cmoName: 'ASCAP',
        territory: 'USA',
        workNumber: editingCopyright.ascap_work_id || '',
        registrationStatus: (editingCopyright as any).ascap_status || 'not_registered'
      });
    }
    
    if (editingCopyright.bmi_work_id || (editingCopyright as any).bmi_status) {
      existingCMORegistrations.push({
        id: `bmi-${Date.now()}`,
        cmoId: 'bmi',
        cmoName: 'BMI',
        territory: 'USA',
        workNumber: editingCopyright.bmi_work_id || '',
        registrationStatus: (editingCopyright as any).bmi_status || 'not_registered'
      });
    }
    
    if (editingCopyright.socan_work_id || (editingCopyright as any).socan_status) {
      existingCMORegistrations.push({
        id: `socan-${Date.now()}`,
        cmoId: 'socan',
        cmoName: 'SOCAN',
        territory: 'Canada',
        workNumber: editingCopyright.socan_work_id || '',
        registrationStatus: (editingCopyright as any).socan_status || 'not_registered'
      });
    }
    
    if (editingCopyright.sesac_work_id || (editingCopyright as any).sesac_status) {
      existingCMORegistrations.push({
        id: `sesac-${Date.now()}`,
        cmoId: 'sesac',
        cmoName: 'SESAC',
        territory: 'USA',
        workNumber: editingCopyright.sesac_work_id || '',
        registrationStatus: (editingCopyright as any).sesac_status || 'not_registered'
      });
    }
    
    if ((editingCopyright as any).mlc_work_id || (editingCopyright as any).mlc_status) {
      existingCMORegistrations.push({
        id: `mlc-${Date.now()}`,
        cmoId: 'mlc',
        cmoName: 'The MLC',
        territory: 'USA',
        workNumber: (editingCopyright as any).mlc_work_id || '',
        registrationStatus: (editingCopyright as any).mlc_status || 'not_registered'
      });
    }
    
    console.log('Loading existing CMO registrations:', existingCMORegistrations);
    setCmoRegistrations(existingCMORegistrations);

    // Load existing writers
    const loadWriters = async () => {
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
    };

    loadWriters();
  }, [editingCopyright?.id]); // Only depend on the ID to prevent infinite loops

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
    setSpotifyAlternatives([]);
    setNewAka('');
    setCmoRegistrations([]);
    
    // Reset collapsible sections to initial state
    setMetadataOpen(true);
    setWritersOpen(true);
    setProRegistrationOpen(false);
    setLegalFilingOpen(false);
    setContractLinkOpen(false);
  };

  // Map CMO registrations to legacy PRO status fields
  const mapCMORegistrationsToLegacyFields = () => {
    const legacyFields = {
      ascap_work_id: '',
      ascap_status: 'not_registered',
      bmi_work_id: '',
      bmi_status: 'not_registered',
      socan_work_id: '',
      socan_status: 'not_registered',
      sesac_work_id: '',
      sesac_status: 'not_registered',
      mlc_work_id: '',
      mlc_status: 'not_registered'
    };

    // Map each CMO registration to the corresponding legacy field
    cmoRegistrations.forEach(registration => {
      switch (registration.cmoId) {
        case 'ascap':
          legacyFields.ascap_work_id = registration.workNumber;
          legacyFields.ascap_status = registration.registrationStatus;
          break;
        case 'bmi':
          legacyFields.bmi_work_id = registration.workNumber;
          legacyFields.bmi_status = registration.registrationStatus;
          break;
        case 'socan':
          legacyFields.socan_work_id = registration.workNumber;
          legacyFields.socan_status = registration.registrationStatus;
          break;
        case 'sesac':
          legacyFields.sesac_work_id = registration.workNumber;
          legacyFields.sesac_status = registration.registrationStatus;
          break;
        case 'mlc':
          legacyFields.mlc_work_id = registration.workNumber;
          legacyFields.mlc_status = registration.registrationStatus;
          break;
      }
    });

    return legacyFields;
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
    
    console.log('Form submitted with data:', formData);
    console.log('PRO Status Values:', {
      ascap_status: formData.ascap_status,
      bmi_status: formData.bmi_status,
      socan_status: formData.socan_status,
      sesac_status: formData.sesac_status
    });
    
    try {
      // Map CMO registrations to legacy fields and merge with form data
      const legacyPROFields = mapCMORegistrationsToLegacyFields();
      const mergedFormData = { ...formData, ...legacyPROFields };

      console.log('CMO Registrations:', cmoRegistrations);
      console.log('Mapped Legacy Fields:', legacyPROFields);
      console.log('Merged Form Data PRO Status:', {
        ascap_status: mergedFormData.ascap_status,
        bmi_status: mergedFormData.bmi_status,
        socan_status: mergedFormData.socan_status,
        sesac_status: mergedFormData.sesac_status,
        mlc_status: mergedFormData.mlc_status
      });

      // Prepare the copyright data with only valid database fields using merged data
      const cleanFormData: Omit<CopyrightInsert, 'user_id'> = {
        work_title: mergedFormData.work_title || '',
        work_type: mergedFormData.work_type,
        language_code: mergedFormData.language_code,
        registration_type: mergedFormData.registration_type,
        status: mergedFormData.status,
        supports_ddex: mergedFormData.supports_ddex,
        supports_cwr: mergedFormData.supports_cwr,
        collection_territories: mergedFormData.collection_territories,
        rights_types: mergedFormData.rights_types,
        contains_sample: mergedFormData.contains_sample,
        akas: mergedFormData.akas,
        registration_status: mergedFormData.registration_status,
        ascap_work_id: mergedFormData.ascap_work_id || null,
        bmi_work_id: mergedFormData.bmi_work_id || null,
        socan_work_id: mergedFormData.socan_work_id || null,
        sesac_work_id: mergedFormData.sesac_work_id || null,
        mlc_work_id: mergedFormData.mlc_work_id || null,
        ascap_status: mergedFormData.ascap_status === 'not_registered' ? null : mergedFormData.ascap_status,
        bmi_status: mergedFormData.bmi_status === 'not_registered' ? null : mergedFormData.bmi_status,
        socan_status: mergedFormData.socan_status === 'not_registered' ? null : mergedFormData.socan_status,
        sesac_status: mergedFormData.sesac_status === 'not_registered' ? null : mergedFormData.sesac_status,
        mlc_status: mergedFormData.mlc_status === 'not_registered' ? null : mergedFormData.mlc_status,
        copyright_reg_number: mergedFormData.copyright_reg_number || null,
        copyright_date: mergedFormData.copyright_date || null,
        notice_date: mergedFormData.notice_date || null,
        creation_date: mergedFormData.creation_date || null,
        work_classification: mergedFormData.work_classification || null,
        notes: mergedFormData.notes || null,
        internal_id: mergedFormData.internal_id,
        iswc: mergedFormData.iswc || null,
        catalogue_number: mergedFormData.catalogue_number || null,
        opus_number: mergedFormData.opus_number || null,
        duration_seconds: mergedFormData.duration_seconds,
        album_title: mergedFormData.album_title || null,
        masters_ownership: mergedFormData.masters_ownership || null,
        mp3_link: mergedFormData.mp3_link || null
      };
      
      console.log('About to save copyright with PRO status data:', {
        ascap_status: cleanFormData.ascap_status,
        bmi_status: cleanFormData.bmi_status,
        socan_status: cleanFormData.socan_status,
        sesac_status: cleanFormData.sesac_status,
        mlc_status: cleanFormData.mlc_status
      });

      let copyrightData;
      if (editingCopyright) {
        // Update existing copyright
        console.log('Updating existing copyright:', editingCopyright.id);
        copyrightData = await updateCopyright(editingCopyright.id, cleanFormData as Partial<CopyrightInsert>);
        
        // Delete existing writers and recreate them
        await supabase.from('copyright_writers').delete().eq('copyright_id', editingCopyright.id);
      } else {
        // Create new copyright
        console.log('Creating new copyright');
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
      
      console.log('Copyright saved successfully, waiting for real-time propagation...');
      
      // Allow more time for real-time updates to propagate and avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Calling onSuccess callback');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving copyright:', error);
      toast({
        title: "Error",
        description: "Failed to save copyright work",
        variant: "destructive",
      });
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
                       onChange={(e) => {
                         console.log('Work title changing to:', e.target.value);
                         setFormData(prev => ({ ...prev, work_title: e.target.value }));
                       }}
                       placeholder="Enter work title"
                       required
                     />
                     {/* Only show Spotify loading spinner for new registrations */}
                     {spotifyLoading && !editingCopyright && (
                       <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                     )}
                   </div>
                </div>
                
                <ArtistSelector
                  value={formData.artist || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, artist: value }))}
                  spotifyMetadata={spotifyMetadata && spotifyMetadata.artist ? {
                    isrc: spotifyMetadata.isrc,
                    artist: spotifyMetadata.artist,
                    duration: spotifyMetadata.duration || 0,
                    releaseDate: spotifyMetadata.releaseDate || '',
                    trackName: spotifyMetadata.trackName || '',
                    albumName: spotifyMetadata.albumName || spotifyMetadata.albumTitle || '',
                    label: spotifyMetadata.label || spotifyMetadata.masterOwner,
                    previewUrl: spotifyMetadata.previewUrl,
                    popularity: spotifyMetadata.popularity
                  } : null}
                  alternatives={spotifyAlternatives}
                  loading={spotifyLoading}
                  onArtistSelect={(selectedMetadata) => {
                    // Update form with selected artist's metadata
                    setFormData(prev => ({
                      ...prev,
                      artist: selectedMetadata.artist,
                      album_title: selectedMetadata.albumName || prev.album_title,
                      masters_ownership: selectedMetadata.label || prev.masters_ownership,
                      mp3_link: selectedMetadata.previewUrl || prev.mp3_link,
                      duration_seconds: selectedMetadata.duration || prev.duration_seconds,
                      creation_date: selectedMetadata.releaseDate || prev.creation_date
                    }));
                    
                    // Update spotify metadata
                    setSpotifyMetadata({
                      albumTitle: selectedMetadata.albumName,
                      masterOwner: selectedMetadata.label,
                      previewUrl: selectedMetadata.previewUrl,
                      popularity: selectedMetadata.popularity,
                      isrc: selectedMetadata.isrc,
                      artist: selectedMetadata.artist,
                      duration: selectedMetadata.duration,
                      releaseDate: selectedMetadata.releaseDate,
                      trackName: selectedMetadata.trackName,
                      albumName: selectedMetadata.albumName,
                      label: selectedMetadata.label
                    });
                  }}
                  onManualEntry={(artistName) => {
                    console.log('Manual artist entry:', artistName);
                    // This will trigger the useEffect for artist changes
                    // which will refetch Spotify metadata with the manual artist name
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={spotifyMetadata?.isrc || ''}
                    onChange={(e) => {
                      setSpotifyMetadata(prev => ({ ...prev, isrc: e.target.value }));
                    }}
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
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {getAllPROs().map(pro => (
                            <SelectItem key={`${pro.value}-${pro.territory}`} value={pro.value}>
                              {pro.label}
                            </SelectItem>
                          ))}
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
            <ProRegistrationSection 
              registrations={cmoRegistrations}
              onRegistrationsChange={setCmoRegistrations}
            />
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
               
               <div className="space-y-2">
                 <Label htmlFor="sound_recording_certificate">Sound Recording Certificate</Label>
                 <DocumentUpload
                   value={formData.sound_recording_certificate_url || ''}
                   onChange={(url) => setFormData(prev => ({ ...prev, sound_recording_certificate_url: url }))}
                   accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                   maxSize={10}
                   label="Upload Sound Recording Certificate"
                 />
               </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Contract Integration Panel */}
      {editingCopyright && (
        <ContractIntegrationPanel
          copyright={editingCopyright}
          onContractLinked={(contractId) => {
            console.log('Contract linked:', contractId);
            // Could trigger a refresh or show additional options
          }}
        />
      )}

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