import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Music, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CopyrightRecording } from '@/hooks/useCopyright';

interface RecordingsSectionProps {
  copyrightId?: string;
  recordings: CopyrightRecording[];
  onRecordingsChange: (recordings: CopyrightRecording[]) => void;
}

interface RecordingFormData {
  isrc: string;
  recording_title: string;
  artist_name: string;
  label_name: string;
  duration_seconds: number;
  recording_version: string;
}

export const RecordingsSection: React.FC<RecordingsSectionProps> = ({
  copyrightId,
  recordings,
  onRecordingsChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [releaseDate, setReleaseDate] = useState<Date>();
  const [formData, setFormData] = useState<RecordingFormData>({
    isrc: '',
    recording_title: '',
    artist_name: '',
    label_name: '',
    duration_seconds: 0,
    recording_version: ''
  });

  const addRecording = () => {
    if (!formData.recording_title || !formData.artist_name) return;
    
    const newRecording: CopyrightRecording = {
      id: `temp-${Date.now()}`,
      copyright_id: copyrightId || '',
      isrc: formData.isrc || null,
      recording_title: formData.recording_title || null,
      artist_name: formData.artist_name || null,
      label_name: formData.label_name || null,
      duration_seconds: formData.duration_seconds || null,
      release_date: releaseDate?.toISOString().split('T')[0] || null,
      recording_version: formData.recording_version || null,
      created_at: new Date().toISOString()
    };

    onRecordingsChange([...recordings, newRecording]);
    setFormData({
      isrc: '',
      recording_title: '',
      artist_name: '',
      label_name: '',
      duration_seconds: 0,
      recording_version: ''
    });
    setReleaseDate(undefined);
    setShowForm(false);
  };

  const removeRecording = (recordingId: string) => {
    onRecordingsChange(recordings.filter(r => r.id !== recordingId));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Recordings (ISRC Links)
            <Badge variant={recordings.length > 0 ? "default" : "secondary"}>
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Recording
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recording_title">Recording Title *</Label>
                <Input
                  id="recording_title"
                  value={formData.recording_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, recording_title: e.target.value }))}
                  placeholder="Recording title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="artist_name">Artist Name *</Label>
                <Input
                  id="artist_name"
                  value={formData.artist_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, artist_name: e.target.value }))}
                  placeholder="Artist or performer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isrc">ISRC</Label>
                <Input
                  id="isrc"
                  value={formData.isrc}
                  onChange={(e) => setFormData(prev => ({ ...prev, isrc: e.target.value }))}
                  placeholder="USRC17607839"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label_name">Label</Label>
                <Input
                  id="label_name"
                  value={formData.label_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, label_name: e.target.value }))}
                  placeholder="Record label"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration_seconds: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="240"
                />
              </div>

              <div className="space-y-2">
                <Label>Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !releaseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {releaseDate ? format(releaseDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={releaseDate}
                      onSelect={setReleaseDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.recording_version}
                  onChange={(e) => setFormData(prev => ({ ...prev, recording_version: e.target.value }))}
                  placeholder="Original, Remix, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={addRecording} 
                disabled={!formData.recording_title || !formData.artist_name}
              >
                Add Recording
              </Button>
            </div>
          </div>
        )}

        {recordings.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordings.map((recording) => (
                <TableRow key={recording.id}>
                  <TableCell className="font-medium">{recording.recording_title || '-'}</TableCell>
                  <TableCell>{recording.artist_name || '-'}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {recording.isrc || '-'}
                    </code>
                  </TableCell>
                  <TableCell>{recording.label_name || '-'}</TableCell>
                  <TableCell>{formatDuration(recording.duration_seconds)}</TableCell>
                  <TableCell>
                    {recording.release_date ? format(new Date(recording.release_date), "MMM dd, yyyy") : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecording(recording.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {recordings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recordings linked yet</p>
            <p className="text-sm">Link recordings with ISRC codes for complete metadata</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};