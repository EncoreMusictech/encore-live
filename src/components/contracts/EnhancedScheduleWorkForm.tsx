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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from '../copyright/AudioPlayer';
import { ArtistSelector } from '../copyright/ArtistSelector';

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

interface Publisher {
  id: string;
  name: string;
  ipi: string;
  share: number;
  proAffiliation: string;
  role: string;
}

interface Recording {
  id: string;
  title: string;
  artist: string;
  isrc: string;
  duration: number;
  releaseDate: string;
  label: string;
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

interface EnhancedScheduleWorkFormProps {
  contractId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnhancedScheduleWorkForm({ contractId, onSuccess, onCancel }: EnhancedScheduleWorkFormProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  
  // Collapsible section states
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [writersOpen, setWritersOpen] = useState(true);
  const [publishersOpen, setPublishersOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [proRegistrationOpen, setProRegistrationOpen] = useState(false);
  const [legalFilingOpen, setLegalFilingOpen] = useState(false);
  const [contractLinkOpen, setContractLinkOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Basic work info
    song_title: '',
    artist_name: '',
    album_title: '',
    work_id: '',
    isrc: '',
    iswc: '',
    
    // Copyright fields
    work_type: 'original',
    language_code: 'EN',
    registration_type: 'new',
    status: 'draft',
    supports_ddex: true,
    supports_cwr: true,
    collection_territories: [] as string[],
    rights_types: [] as string[],
    contains_sample: false,
    akas: [] as string[],
    registration_status: 'not_registered',
    
    // Additional metadata
    creation_date: '',
    duration_seconds: 0,
    masters_ownership: '',
    mp3_link: '',
    notes: '',
    work_classification: '',
    catalogue_number: '',
    opus_number: '',
    
    // PRO registration
    ascap_work_id: '',
    bmi_work_id: '',
    socan_work_id: '',
    sesac_work_id: '',
    ascap_status: 'not_registered',
    bmi_status: 'not_registered',
    socan_status: 'not_registered',
    sesac_status: 'not_registered',
    
    // Legal filing
    copyright_reg_number: '',
    copyright_date: '',
    notice_date: '',
    
    // Contract inheritance
    inherits_royalty_splits: true,
    inherits_recoupment_status: true,
    inherits_controlled_status: true,
    work_specific_advance: 0,
    work_specific_rate_reduction: 0,
  });

  const [writers, setWriters] = useState<Writer[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [spotifyMetadata, setSpotifyMetadata] = useState<SpotifyMetadata | null>(null);
  const [spotifyAlternatives, setSpotifyAlternatives] = useState<SpotifyTrackMetadata[]>([]);
  const [newAka, setNewAka] = useState('');

  // Calculate total shares
  const totalWriterShare = writers.reduce((sum, w) => sum + w.share, 0);
  const totalPublisherShare = publishers.reduce((sum, p) => sum + p.share, 0);
  const totalControlledShare = writers
    .filter(w => w.controlled === 'C')
    .reduce((sum, w) => sum + w.share, 0);

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
          artist_name: metadata.artist || prev.artist_name,
          isrc: metadata.isrc || prev.isrc
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

  // Debounce the metadata fetching when song title changes
  useEffect(() => {
    console.log('Setting up Spotify search timeout for:', formData.song_title);
    const timeoutId = setTimeout(() => {
      if (formData.song_title) {
        console.log('Triggering Spotify search for:', formData.song_title);
        fetchSpotifyMetadata(formData.song_title, formData.artist_name);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
   }, [formData.song_title, fetchSpotifyMetadata]);

   // Debounce metadata fetching when artist changes manually
   useEffect(() => {
     // Only run when both song title and artist are provided
     if (!formData.song_title || !formData.artist_name) {
       return;
     }
     
     console.log('Setting up Spotify search for artist change:', formData.artist_name);
     const timeoutId = setTimeout(() => {
       console.log('Triggering Spotify search with artist:', formData.song_title, formData.artist_name);
       fetchSpotifyMetadata(formData.song_title, formData.artist_name);
     }, 1500); // Slightly longer delay for artist changes

     return () => clearTimeout(timeoutId);
    }, [formData.artist_name, fetchSpotifyMetadata, formData.song_title]);

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

  const addPublisher = () => {
    const newPublisher: Publisher = {
      id: `publisher-${Date.now()}`,
      name: '',
      ipi: '',
      share: 0,
      proAffiliation: '',
      role: 'original_publisher'
    };
    setPublishers([...publishers, newPublisher]);
  };

  const removePublisher = (id: string) => {
    setPublishers(publishers.filter(p => p.id !== id));
  };

  const updatePublisher = (id: string, field: keyof Publisher, value: any) => {
    setPublishers(publishers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addRecording = () => {
    const newRecording: Recording = {
      id: `recording-${Date.now()}`,
      title: formData.song_title,
      artist: formData.artist_name,
      isrc: formData.isrc,
      duration: formData.duration_seconds,
      releaseDate: formData.creation_date,
      label: formData.masters_ownership
    };
    setRecordings([...recordings, newRecording]);
  };

  const removeRecording = (id: string) => {
    setRecordings(recordings.filter(r => r.id !== id));
  };

  const updateRecording = (id: string, field: keyof Recording, value: any) => {
    setRecordings(recordings.map(r => r.id === id ? { ...r, [field]: value } : r));
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

  const searchASCAP = () => {
    window.open('https://www.ascap.com/repertory#/', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.song_title) return;

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First create the copyright work
      const { data: copyrightData, error: copyrightError } = await supabase
        .from('copyrights')
        .insert({
          user_id: user.id,
          work_title: formData.song_title,
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
          ascap_work_id: formData.ascap_work_id || null,
          bmi_work_id: formData.bmi_work_id || null,
          socan_work_id: formData.socan_work_id || null,
          sesac_work_id: formData.sesac_work_id || null,
          ascap_status: formData.ascap_status === 'not_registered' ? null : formData.ascap_status,
          bmi_status: formData.bmi_status === 'not_registered' ? null : formData.bmi_status,
          socan_status: formData.socan_status === 'not_registered' ? null : formData.socan_status,
          sesac_status: formData.sesac_status === 'not_registered' ? null : formData.sesac_status,
          copyright_reg_number: formData.copyright_reg_number || null,
          copyright_date: formData.copyright_date || null,
          notice_date: formData.notice_date || null,
          creation_date: formData.creation_date || null,
          work_classification: formData.work_classification || null,
          notes: formData.notes || null,
          iswc: formData.iswc || null,
          catalogue_number: formData.catalogue_number || null,
          opus_number: formData.opus_number || null,
          duration_seconds: formData.duration_seconds,
          album_title: formData.album_title || null,
          masters_ownership: formData.masters_ownership || null,
          mp3_link: formData.mp3_link || null
        })
        .select()
        .single();

      if (copyrightError) throw copyrightError;

      // Create writer records
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

      // Create publisher records
      for (const publisher of publishers) {
        await supabase.from('copyright_publishers').insert({
          copyright_id: copyrightData.id,
          publisher_name: publisher.name,
          ipi_number: publisher.ipi || null,
          ownership_percentage: publisher.share,
          pro_affiliation: publisher.proAffiliation || null,
          publisher_role: publisher.role
        });
      }

      // Create recording records
      for (const recording of recordings) {
        await supabase.from('copyright_recordings').insert({
          copyright_id: copyrightData.id,
          recording_title: recording.title,
          artist_name: recording.artist,
          isrc: recording.isrc || null,
          duration_seconds: recording.duration,
          release_date: recording.releaseDate || null,
          label_name: recording.label || null
        });
      }

      // Now add to contract schedule
      const { error: scheduleError } = await supabase
        .from('contract_schedule_works')
        .insert({
          contract_id: contractId,
          copyright_id: copyrightData.id,
          song_title: formData.song_title,
          artist_name: formData.artist_name || null,
          album_title: formData.album_title || null,
          work_id: formData.work_id || null,
          isrc: formData.isrc || null,
          iswc: formData.iswc || null,
          inherits_royalty_splits: formData.inherits_royalty_splits,
          inherits_recoupment_status: formData.inherits_recoupment_status,
          inherits_controlled_status: formData.inherits_controlled_status,
          work_specific_advance: formData.work_specific_advance,
          work_specific_rate_reduction: formData.work_specific_rate_reduction
        });

      if (scheduleError) throw scheduleError;

      toast({
        title: "Success",
        description: "Work added to schedule with full copyright registration",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving work:', error);
      toast({
        title: "Error",
        description: "Failed to save work to schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.song_title && formData.song_title.length > 0 && totalWriterShare === 100 && totalControlledShare <= 100;

  const territoryOptions = [
    "United States", "Canada", "United Kingdom", "European Union", 
    "Japan", "Australia", "Mexico", "Brazil", "Worldwide"
  ];

  const rightsOptions = [
    "Performance", "Mechanical", "Synchronization", "Print", "Grand Rights", "Karaoke"
  ];

  const affiliations = [
    "ASCAP", "BMI", "SESAC", "SOCAN", "PRS", "GEMA", "SACEM", "Other"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Metadata Section */}
      <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Work Metadata & Spotify Integration
                {spotifyLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Basic Work Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song_title">Song Title *</Label>
                  <Input
                    id="song_title"
                    value={formData.song_title}
                    onChange={(e) => setFormData({...formData, song_title: e.target.value})}
                    placeholder="Enter song title for Spotify lookup"
                  />
                </div>
                
                <div>
                  <ArtistSelector
                    value={formData.artist_name}
                    onChange={(value) => setFormData({...formData, artist_name: value})}
                    onArtistSelect={(metadata) => {
                      console.log('Artist selected from Spotify:', metadata.artist);
                      setFormData(prev => ({...prev, artist_name: metadata.artist}));
                    }}
                    onManualEntry={(artistName) => {
                      console.log('Manual artist entry:', artistName);
                      setFormData(prev => ({...prev, artist_name: artistName}));
                    }}
                    spotifyMetadata={spotifyMetadata ? {
                      isrc: spotifyMetadata.isrc,
                      artist: spotifyMetadata.artist || '',
                      duration: spotifyMetadata.duration || 0,
                      releaseDate: spotifyMetadata.releaseDate || '',
                      trackName: spotifyMetadata.trackName || '',
                      albumName: spotifyMetadata.albumName || '',
                      label: spotifyMetadata.label,
                      previewUrl: spotifyMetadata.previewUrl,
                      popularity: spotifyMetadata.popularity
                    } : null}
                    alternatives={spotifyAlternatives}
                    loading={spotifyLoading}
                    placeholder="Recording artist"
                  />
                </div>
              </div>


              {/* Additional Metadata */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="album_title">Album Title</Label>
                  <Input
                    id="album_title"
                    value={formData.album_title}
                    onChange={(e) => setFormData({...formData, album_title: e.target.value})}
                    placeholder="Album or release title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work_id">Work ID</Label>
                  <Input
                    id="work_id"
                    value={formData.work_id}
                    onChange={(e) => setFormData({...formData, work_id: e.target.value})}
                    placeholder="Internal work identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({...formData, duration_seconds: parseInt(e.target.value) || 0})}
                    placeholder="Track duration"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isrc">ISRC</Label>
                  <Input
                    id="isrc"
                    value={formData.isrc}
                    onChange={(e) => setFormData({...formData, isrc: e.target.value})}
                    placeholder="International Standard Recording Code"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="iswc">ISWC</Label>
                  <Input
                    id="iswc"
                    value={formData.iswc}
                    onChange={(e) => setFormData({...formData, iswc: e.target.value})}
                    placeholder="International Standard Work Code"
                  />
                </div>
              </div>

              {/* Alternative Titles */}
              <div className="space-y-2">
                <Label>Alternative Titles (AKAs)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAka}
                    onChange={(e) => setNewAka(e.target.value)}
                    placeholder="Add alternative title"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAka())}
                  />
                  <Button type="button" variant="outline" onClick={(e) => {
                    e.preventDefault();
                    addAka();
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.akas && formData.akas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.akas.map((aka, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {aka}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={(e) => {
                            e.preventDefault();
                            removeAka(aka);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Writers Section */}
      <Collapsible open={writersOpen} onOpenChange={setWritersOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Writers & Publishers ({totalWriterShare}% total)
                </div>
                <div className="flex items-center gap-2">
                  {totalControlledShare > 0 && (
                    <Badge variant={totalControlledShare <= 100 ? "default" : "destructive"}>
                      {totalControlledShare}% Controlled
                    </Badge>
                  )}
                  {totalWriterShare === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Writers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Writers</h4>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => {
                    e.preventDefault();
                    addWriter();
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Writer
                  </Button>
                </div>
                
                {writers.map((writer) => (
                  <Card key={writer.id} className="p-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Writer Name *</Label>
                        <Input
                          value={writer.name}
                          onChange={(e) => updateWriter(writer.id, 'name', e.target.value)}
                          placeholder="Writer full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>IPI Number</Label>
                        <Input
                          value={writer.ipi}
                          onChange={(e) => updateWriter(writer.id, 'ipi', e.target.value)}
                          placeholder="IPI number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Ownership Share (%) *</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={writer.share}
                          onChange={(e) => updateWriter(writer.id, 'share', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>PRO Affiliation</Label>
                        <Select onValueChange={(value) => updateWriter(writer.id, 'proAffiliation', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select PRO" />
                          </SelectTrigger>
                          <SelectContent>
                            {affiliations.map(aff => (
                              <SelectItem key={aff} value={aff}>{aff}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Controlled Status</Label>
                        <Select 
                          value={writer.controlled}
                          onValueChange={(value: 'C' | 'NC') => updateWriter(writer.id, 'controlled', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">Controlled (C)</SelectItem>
                            <SelectItem value="NC">Non-Controlled (NC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            removeWriter(writer.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {writers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No writers added yet. Click "Add Writer" to get started.
                  </div>
                )}
              </div>

              {/* Publishers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Publishers</h4>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => {
                    e.preventDefault();
                    addPublisher();
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Publisher
                  </Button>
                </div>
                
                {publishers.map((publisher) => (
                  <Card key={publisher.id} className="p-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Publisher Name *</Label>
                        <Input
                          value={publisher.name}
                          onChange={(e) => updatePublisher(publisher.id, 'name', e.target.value)}
                          placeholder="Publisher name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>IPI Number</Label>
                        <Input
                          value={publisher.ipi}
                          onChange={(e) => updatePublisher(publisher.id, 'ipi', e.target.value)}
                          placeholder="IPI number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Share (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={publisher.share}
                          onChange={(e) => updatePublisher(publisher.id, 'share', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            removePublisher(publisher.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Contract Inheritance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Contract Inheritance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="inherits_royalty_splits">Inherit Royalty Splits from Contract</Label>
                <Switch
                  id="inherits_royalty_splits"
                  checked={formData.inherits_royalty_splits}
                  onCheckedChange={(checked) => setFormData({...formData, inherits_royalty_splits: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="inherits_recoupment_status">Inherit Recoupment Status</Label>
                <Switch
                  id="inherits_recoupment_status"
                  checked={formData.inherits_recoupment_status}
                  onCheckedChange={(checked) => setFormData({...formData, inherits_recoupment_status: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="inherits_controlled_status">Inherit Controlled Status</Label>
                <Switch
                  id="inherits_controlled_status"
                  checked={formData.inherits_controlled_status}
                  onCheckedChange={(checked) => setFormData({...formData, inherits_controlled_status: checked})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Work-Specific Overrides</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_specific_advance">Work-Specific Advance ($)</Label>
                  <Input
                    id="work_specific_advance"
                    type="number"
                    min="0"
                    value={formData.work_specific_advance}
                    onChange={(e) => setFormData({...formData, work_specific_advance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work_specific_rate_reduction">Work-Specific Rate Reduction (%)</Label>
                  <Input
                    id="work_specific_rate_reduction"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.work_specific_rate_reduction}
                    onChange={(e) => setFormData({...formData, work_specific_rate_reduction: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={(e) => {
          e.preventDefault();
          onCancel();
        }}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!isFormValid || loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {loading ? "Creating..." : "Add Work to Schedule"}
        </Button>
      </div>
    </form>
  );
}