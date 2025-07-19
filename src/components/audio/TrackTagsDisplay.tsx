import { useState, useEffect } from "react";
import { Music, Edit2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrackTag {
  id: string;
  filename: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration_seconds?: number;
  mood_emotion?: string[];
  energy_level?: string;
  genre_subgenre?: string[];
  scene_use_case?: string[];
  vocal_type?: string;
  instrumentation?: string[];
  structure_tags?: string[];
  lyrical_themes?: string[];
  analysis_status: string;
  analysis_confidence?: number;
  manual_overrides?: any;
}

interface TrackTagsDisplayProps {
  fileUrl: string;
  className?: string;
}

export const TrackTagsDisplay = ({ fileUrl, className = "" }: TrackTagsDisplayProps) => {
  const [trackTag, setTrackTag] = useState<TrackTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTag, setEditedTag] = useState<TrackTag | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (fileUrl) {
      fetchTrackTags();
    }
  }, [fileUrl]);

  const fetchTrackTags = async () => {
    try {
      const { data, error } = await supabase
        .from('track_tags')
        .select('*')
        .eq('file_url', fileUrl)
        .maybeSingle();

      if (error) throw error;
      
      setTrackTag(data);
      if (data) {
        setEditedTag({ ...data });
      }
    } catch (error) {
      console.error('Error fetching track tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedTag) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('track_tags')
        .update({
          title: editedTag.title,
          artist: editedTag.artist,
          album: editedTag.album,
          year: editedTag.year,
          genre: editedTag.genre,
          mood_emotion: editedTag.mood_emotion,
          energy_level: editedTag.energy_level,
          genre_subgenre: editedTag.genre_subgenre,
          scene_use_case: editedTag.scene_use_case,
          vocal_type: editedTag.vocal_type,
          instrumentation: editedTag.instrumentation,
          structure_tags: editedTag.structure_tags,
          lyrical_themes: editedTag.lyrical_themes,
          manual_overrides: editedTag.manual_overrides || {}
        })
        .eq('id', editedTag.id);

      if (error) throw error;

      setTrackTag(editedTag);
      setEditing(false);
      toast({
        title: "Success",
        description: "Track tags updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating track tags:', error);
      toast({
        title: "Error",
        description: "Failed to update track tags",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTag(trackTag ? { ...trackTag } : null);
    setEditing(false);
  };

  const updateArrayField = (field: keyof TrackTag, values: string[]) => {
    if (editedTag) {
      setEditedTag({
        ...editedTag,
        [field]: values
      });
    }
  };

  const addTagToField = (field: keyof TrackTag, value: string) => {
    if (!value.trim() || !editedTag) return;
    
    const currentValues = (editedTag[field] as string[]) || [];
    if (!currentValues.includes(value.trim())) {
      updateArrayField(field, [...currentValues, value.trim()]);
    }
  };

  const removeTagFromField = (field: keyof TrackTag, value: string) => {
    if (!editedTag) return;
    const currentValues = (editedTag[field] as string[]) || [];
    updateArrayField(field, currentValues.filter(v => v !== value));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading track analysis...</span>
        </CardContent>
      </Card>
    );
  }

  if (!trackTag) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Music className="h-6 w-6 text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">No track analysis available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Track Analysis</CardTitle>
        <div className="flex items-center gap-2">
          {trackTag.analysis_confidence && (
            <Badge variant="secondary">
              {Math.round(trackTag.analysis_confidence * 100)}% confidence
            </Badge>
          )}
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Metadata */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Basic Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              {editing ? (
                <Input
                  value={editedTag?.title || ''}
                  onChange={(e) => setEditedTag(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="h-8"
                />
              ) : (
                <p className="text-sm">{trackTag.title || 'Unknown'}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Artist</Label>
              {editing ? (
                <Input
                  value={editedTag?.artist || ''}
                  onChange={(e) => setEditedTag(prev => prev ? { ...prev, artist: e.target.value } : null)}
                  className="h-8"
                />
              ) : (
                <p className="text-sm">{trackTag.artist || 'Unknown'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mood & Energy */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Mood & Energy</h4>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mood/Emotion</Label>
            <div className="flex flex-wrap gap-1">
              {(editing ? editedTag?.mood_emotion : trackTag.mood_emotion)?.map((mood, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {mood}
                  {editing && (
                    <button
                      onClick={() => removeTagFromField('mood_emotion', mood)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            <Label className="text-xs text-muted-foreground">Energy Level</Label>
            {editing ? (
              <Select
                value={editedTag?.energy_level || ''}
                onValueChange={(value) => setEditedTag(prev => prev ? { ...prev, energy_level: value } : null)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High Energy">High Energy</SelectItem>
                  <SelectItem value="Medium Energy">Medium Energy</SelectItem>
                  <SelectItem value="Low Energy">Low Energy</SelectItem>
                  <SelectItem value="Chill">Chill</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{trackTag.energy_level || 'Unknown'}</Badge>
            )}
          </div>
        </div>

        {/* Genre & Scene */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Genre & Usage</h4>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Genre/Subgenre</Label>
            <div className="flex flex-wrap gap-1">
              {(editing ? editedTag?.genre_subgenre : trackTag.genre_subgenre)?.map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {genre}
                  {editing && (
                    <button
                      onClick={() => removeTagFromField('genre_subgenre', genre)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            <Label className="text-xs text-muted-foreground">Scene Use Case</Label>
            <div className="flex flex-wrap gap-1">
              {(editing ? editedTag?.scene_use_case : trackTag.scene_use_case)?.map((scene, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {scene}
                  {editing && (
                    <button
                      onClick={() => removeTagFromField('scene_use_case', scene)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Technical Details</h4>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Vocal Type</Label>
            {editing ? (
              <Select
                value={editedTag?.vocal_type || ''}
                onValueChange={(value) => setEditedTag(prev => prev ? { ...prev, vocal_type: value } : null)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male Vocal">Male Vocal</SelectItem>
                  <SelectItem value="Female Vocal">Female Vocal</SelectItem>
                  <SelectItem value="Choir">Choir</SelectItem>
                  <SelectItem value="Instrumental Only">Instrumental Only</SelectItem>
                  <SelectItem value="Mixed Vocals">Mixed Vocals</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{trackTag.vocal_type || 'Unknown'}</Badge>
            )}
            
            <Label className="text-xs text-muted-foreground">Instrumentation</Label>
            <div className="flex flex-wrap gap-1">
              {(editing ? editedTag?.instrumentation : trackTag.instrumentation)?.map((instrument, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {instrument}
                  {editing && (
                    <button
                      onClick={() => removeTagFromField('instrumentation', instrument)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Lyrical Themes */}
        {trackTag.lyrical_themes && trackTag.lyrical_themes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Lyrical Themes</h4>
            <div className="flex flex-wrap gap-1">
              {(editing ? editedTag?.lyrical_themes : trackTag.lyrical_themes)?.map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                  {editing && (
                    <button
                      onClick={() => removeTagFromField('lyrical_themes', theme)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};