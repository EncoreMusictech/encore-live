
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, User, Building, Link2, Unlink2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRoyaltyAllocations, RoyaltyAllocationInsert } from "@/hooks/useRoyaltyAllocations";
import { useCopyright } from "@/hooks/useCopyright";
import { useContacts } from "@/hooks/useContacts";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";

const royaltySchema = z.object({
  song_title: z.string().min(1, "Song title is required"),
  artist: z.string().optional(),
  isrc: z.string().optional(),
  gross_royalty_amount: z.number().min(0, "Amount must be positive"),
  controlled_status: z.enum(["Controlled", "Non-Controlled"]),
  recoupable_expenses: z.boolean(),
  comments: z.string().optional(),
  // ENCORE Standard Fields
  quarter: z.string().optional(),
  source: z.string().optional(),
  revenue_source: z.string().optional(),
  work_identifier: z.string().optional(),
  share: z.string().optional(),
  media_type: z.string().optional(),
  media_sub_type: z.string().optional(),
  country: z.string().optional(),
  quantity: z.string().optional(),
  net_amount: z.number().optional(),
  iswc: z.string().optional(),
  statement_id: z.string().optional(),
  batch_id: z.string().optional(),
  copyright_id: z.string().optional(),
});

type RoyaltyFormData = z.infer<typeof royaltySchema>;

interface RoyaltyAllocationFormProps {
  allocation?: any;
  onCancel: () => void;
}

export function RoyaltyAllocationForm({ allocation, onCancel }: RoyaltyAllocationFormProps) {
  const [writers, setWriters] = useState<any[]>([]);
  const [loadingWriters, setLoadingWriters] = useState(false);
  const [showSongMatch, setShowSongMatch] = useState(false);
  const [availableCopyrights, setAvailableCopyrights] = useState<any[]>([]);
  
  const { createAllocation, updateAllocation } = useRoyaltyAllocations();
  const { copyrights } = useCopyright();
  const { contacts } = useContacts();
  const { batches } = useReconciliationBatches();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RoyaltyFormData>({
    resolver: zodResolver(royaltySchema),
    defaultValues: {
      controlled_status: "Controlled",
      recoupable_expenses: false,
      gross_royalty_amount: 0,
      ...allocation
    }
  });

  const selectedCopyrightId = watch("copyright_id");

  // Load writers when allocation or copyright changes
  useEffect(() => {
    const loadWriters = async () => {
      if (!allocation && !selectedCopyrightId) {
        setWriters([]);
        return;
      }

      setLoadingWriters(true);
      try {
        let writersToLoad: any[] = [];

        // For existing allocations, load from ownership_splits
        if (allocation?.ownership_splits) {
          console.log("Loaded writers from existing allocation ownership_splits:", allocation.ownership_splits);
          
          writersToLoad = Object.entries(allocation.ownership_splits).map(([key, split]: [string, any]) => {
            if (key.startsWith('copyright_writer_')) {
              return {
                id: key,
                name: split.writer_name || key,
                writer_share: split.writer_share || 0,
                performance_share: split.performance_share || 0,
                mechanical_share: split.mechanical_share || 0,
                synchronization_share: split.synchronization_share || 0,
                type: 'copyright_writer'
              };
            } else {
              const contact = contacts.find(c => c.id === key);
              return {
                id: key,
                name: contact?.name || key,
                writer_share: split.writer_share || 0,
                performance_share: split.performance_share || 0,
                mechanical_share: split.mechanical_share || 0,
                synchronization_share: split.synchronization_share || 0,
                type: 'contact'
              };
            }
          });
        }
        
        // For linked copyright, load from copyright writers
        else if (selectedCopyrightId || allocation?.copyright_id) {
          const copyrightId = selectedCopyrightId || allocation?.copyright_id;
          const linkedCopyright = copyrights.find(c => c.id === copyrightId);
          
          if (linkedCopyright?.writers) {
            console.log("Loaded writers from linked copyright:", linkedCopyright.writers);
            
            writersToLoad = linkedCopyright.writers.map((writer: any) => ({
              id: `copyright_writer_${writer.id}`,
              name: writer.name,
              writer_share: writer.writer_share || 0,
              performance_share: writer.performance_share || 0,
              mechanical_share: writer.mechanical_share || 0,
              synchronization_share: writer.synchronization_share || 0,
              type: 'copyright_writer',
              copyright_writer_id: writer.id
            }));
          }
        }

        setWriters(writersToLoad);
        console.log("Writer loading effect triggered:", {
          allocation: allocation?.id,
          hasOwnershipSplits: !!allocation?.ownership_splits,
          copyrightId: selectedCopyrightId || allocation?.copyright_id,
          availableCopyrightsCount: copyrights.length,
          availableCopyrights: copyrights,
          loadedWriters: writersToLoad
        });
        
      } catch (error) {
        console.error("Error loading writers:", error);
        toast({
          title: "Error",
          description: "Failed to load writers",
          variant: "destructive",
        });
      } finally {
        setLoadingWriters(false);
      }
    };

    loadWriters();
  }, [allocation, selectedCopyrightId, copyrights, contacts]);

  // Set available copyrights
  useEffect(() => {
    setAvailableCopyrights(copyrights || []);
  }, [copyrights]);

  const addWriter = () => {
    const newWriter = {
      id: `writer_${Date.now()}`,
      name: "",
      writer_share: 0,
      performance_share: 0,
      mechanical_share: 0,
      synchronization_share: 0,
      type: 'manual'
    };
    setWriters([...writers, newWriter]);
  };

  const removeWriter = (writerId: string) => {
    setWriters(writers.filter(w => w.id !== writerId));
  };

  const updateWriter = (writerId: string, field: string, value: any) => {
    setWriters(writers.map(w => 
      w.id === writerId ? { ...w, [field]: value } : w
    ));
  };

  const handleCopyrightLink = async (copyrightId: string, workTitle: string) => {
    setValue("copyright_id", copyrightId);
    setShowSongMatch(false);
    
    toast({
      title: "Success",
      description: `Linked to copyright "${workTitle}"`,
    });
  };

  const handleCopyrightUnlink = () => {
    setValue("copyright_id", "");
    setWriters([]);
    
    toast({
      title: "Success",
      description: "Unlinked from copyright",
    });
  };

  const onSubmit = async (data: RoyaltyFormData) => {
    try {
      // Calculate ownership splits from writers
      const ownership_splits: Record<string, any> = {};
      
      writers.forEach(writer => {
        ownership_splits[writer.id] = {
          writer_name: writer.name,
          writer_share: writer.writer_share || 0,
          performance_share: writer.performance_share || 0,
          mechanical_share: writer.mechanical_share || 0,
          synchronization_share: writer.synchronization_share || 0,
        };
      });

      const royaltyData: RoyaltyAllocationInsert = {
        ...data,
        ownership_splits,
      };

      if (allocation) {
        await updateAllocation(allocation.id, royaltyData);
        toast({
          title: "Success",
          description: "Royalty updated successfully",
        });
      } else {
        await createAllocation(royaltyData);
        toast({
          title: "Success",
          description: "Royalty created successfully",
        });
      }
      
      onCancel();
    } catch (error) {
      console.error("Error saving royalty:", error);
      toast({
        title: "Error",
        description: "Failed to save royalty",
        variant: "destructive",
      });
    }
  };

  const linkedCopyright = selectedCopyrightId ? 
    availableCopyrights.find(c => c.id === selectedCopyrightId) : null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="writers">Writers & Splits</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the royalty allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Copyright Linking Section */}
                <div className="space-y-3">
                  <Label>Copyright Link</Label>
                  {linkedCopyright ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">{linkedCopyright.work_title}</p>
                          <p className="text-sm text-muted-foreground">ID: {linkedCopyright.work_id}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyrightUnlink}
                      >
                        <Unlink2 className="h-4 w-4 mr-1" />
                        Unlink
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSongMatch(true)}
                      className="w-full"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Link to Copyright
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="song_title">Song Title *</Label>
                    <Input
                      id="song_title"
                      {...register("song_title")}
                      placeholder="Enter song title"
                    />
                    {errors.song_title && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.song_title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      {...register("artist")}
                      placeholder="Enter artist name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gross_royalty_amount">Gross Amount *</Label>
                    <Input
                      id="gross_royalty_amount"
                      type="number"
                      step="0.01"
                      {...register("gross_royalty_amount", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {errors.gross_royalty_amount && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.gross_royalty_amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="controlled_status">Status</Label>
                    <Select 
                      onValueChange={(value) => setValue("controlled_status", value as "Controlled" | "Non-Controlled")}
                      defaultValue={watch("controlled_status")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Controlled">Controlled</SelectItem>
                        <SelectItem value="Non-Controlled">Non-Controlled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recoupable_expenses"
                    {...register("recoupable_expenses")}
                  />
                  <Label htmlFor="recoupable_expenses">Recoupable Expenses</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="writers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Writers & Ownership Splits</CardTitle>
                    <CardDescription>
                      {loadingWriters ? "Loading writers..." : "Manage writer ownership and revenue splits"}
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addWriter} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Writer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingWriters ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading writers...</p>
                  </div>
                ) : writers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No writers added yet.</p>
                    <Button type="button" onClick={addWriter} variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Writer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {writers.map((writer, index) => (
                      <div key={writer.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Writer {index + 1}</span>
                            {writer.type === 'copyright_writer' && (
                              <Badge variant="outline">From Copyright</Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWriter(writer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Writer Name</Label>
                            <Input
                              value={writer.name}
                              onChange={(e) => updateWriter(writer.id, 'name', e.target.value)}
                              placeholder="Enter writer name"
                              disabled={writer.type === 'copyright_writer'}
                            />
                          </div>
                          <div>
                            <Label>Writer Share (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={writer.writer_share}
                              onChange={(e) => updateWriter(writer.id, 'writer_share', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Performance (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={writer.performance_share}
                              onChange={(e) => updateWriter(writer.id, 'performance_share', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Mechanical (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={writer.mechanical_share}
                              onChange={(e) => updateWriter(writer.id, 'mechanical_share', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Sync (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={writer.synchronization_share}
                              onChange={(e) => updateWriter(writer.id, 'synchronization_share', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Fields</CardTitle>
                <CardDescription>
                  Additional metadata and ENCORE standard fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quarter">Quarter</Label>
                    <Input
                      id="quarter"
                      {...register("quarter")}
                      placeholder="e.g., Q1 2024"
                    />
                  </div>

                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      {...register("source")}
                      placeholder="e.g., Spotify, ASCAP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="revenue_source">Revenue Source</Label>
                    <Input
                      id="revenue_source"
                      {...register("revenue_source")}
                      placeholder="e.g., Streaming, Performance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="media_type">Media Type</Label>
                    <Input
                      id="media_type"
                      {...register("media_type")}
                      placeholder="e.g., Digital, Physical"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Territory</Label>
                    <Input
                      id="country"
                      {...register("country")}
                      placeholder="e.g., US, UK, Global"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batch_id">Batch</Label>
                    <Select onValueChange={(value) => setValue("batch_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_id} - {batch.source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    {...register("comments")}
                    placeholder="Additional notes about this royalty..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : allocation ? "Update Royalty" : "Create Royalty"}
          </Button>
        </div>
      </form>

      {/* Song Matching Dialog */}
      {showSongMatch && (
        <AllocationSongMatchDialog
          open={showSongMatch}
          onOpenChange={setShowSongMatch}
          allocationId={allocation?.id}
          currentSongTitle={watch("song_title")}
          onMatch={handleCopyrightLink}
        />
      )}
    </div>
  );
}
