import { useForm } from "react-hook-form";
import { Music, Clock, Volume2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface SceneContextData {
  scene_description?: string;
  scene_duration_seconds?: number;
  scene_timestamp?: string;
  music_timing_notes?: string;
  instrumental_vocal?: 'instrumental' | 'vocal' | 'both';
  music_prominence?: 'background' | 'featured' | 'theme';
  audio_mix_level?: number;
}

interface SceneContextFormProps {
  sceneData?: SceneContextData;
  onSceneChange: (data: SceneContextData) => void;
}

export const SceneContextForm = ({ sceneData, onSceneChange }: SceneContextFormProps) => {
  const form = useForm({
    defaultValues: {
      scene_description: sceneData?.scene_description || "",
      scene_duration_seconds: sceneData?.scene_duration_seconds || 0,
      scene_timestamp: sceneData?.scene_timestamp || "",
      music_timing_notes: sceneData?.music_timing_notes || "",
      instrumental_vocal: sceneData?.instrumental_vocal || "both",
      music_prominence: sceneData?.music_prominence || "background",
      audio_mix_level: sceneData?.audio_mix_level || 5,
    },
    mode: "onChange"
  });

  const handleFormChange = (data: any) => {
    onSceneChange({
      ...data,
      scene_duration_seconds: parseInt(data.scene_duration_seconds) || 0,
      audio_mix_level: data.audio_mix_level,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Scene Context & Usage Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(handleFormChange)} className="space-y-6">
            
            {/* Scene Description */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2">Scene Information</h4>
              
              <FormField
                control={form.control}
                name="scene_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scene Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the scene where the music will be used (e.g., 'Opening montage showing character's daily routine')" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scene_duration_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scene Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="30" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const seconds = parseInt(e.target.value) || 0;
                            document.getElementById('duration-display')!.textContent = formatDuration(seconds);
                          }}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Duration: <span id="duration-display">{formatDuration(form.watch('scene_duration_seconds') || 0)}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scene_timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scene Timestamp</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00:05:30 - 00:06:00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Music Usage Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2 flex items-center gap-2">
                <Music className="h-4 w-4" />
                Music Usage Details
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instrumental_vocal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Music Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select music type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instrumental">Instrumental Only</SelectItem>
                          <SelectItem value="vocal">Vocal Version</SelectItem>
                          <SelectItem value="both">Both Instrumental & Vocal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="music_prominence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Music Prominence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select prominence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="background">Background Music</SelectItem>
                          <SelectItem value="featured">Featured Prominently</SelectItem>
                          <SelectItem value="theme">Theme/Main Focus</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="audio_mix_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Audio Mix Level: {field.value}/10
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10}
                        step={0.5}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Background</span>
                      <span>Medium</span>
                      <span>Prominent</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="music_timing_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Music Timing Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about music timing, cues, or specific usage instructions" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
};