
import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useRoyaltyAllocations, RoyaltyAllocationInsert } from "@/hooks/useRoyaltyAllocations";
import { useCopyright } from "@/hooks/useCopyright";
import { useContacts } from "@/hooks/useContacts";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";
import { BasicInfoTab } from "./forms/BasicInfoTab";
import { WritersTab } from "./forms/WritersTab";
import { AdvancedTab } from "./forms/AdvancedTab";

const royaltySchema = z.object({
  song_title: z.string().min(1, "Song title is required"),
  artist: z.string().optional(),
  isrc: z.string().optional(),
  gross_royalty_amount: z.number().min(0, "Amount must be positive"),
  controlled_status: z.enum(["Controlled", "Non-Controlled"]),
  recoupable_expenses: z.boolean(),
  comments: z.string().optional(),
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
  const [writersLoaded, setWritersLoaded] = useState(false);
  
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

  // Memoize the linked copyright to prevent unnecessary re-renders
  const linkedCopyright = useMemo(() => {
    return selectedCopyrightId ? copyrights.find(c => c.id === selectedCopyrightId) : null;
  }, [selectedCopyrightId, copyrights]);

  // Stable function references to prevent useEffect re-triggering
  const loadWritersFromOwnershipSplits = useCallback((ownershipSplits: any) => {
    console.log("Loading writers from existing allocation ownership_splits:", ownershipSplits);
    
    return Object.entries(ownershipSplits).map(([key, split]: [string, any]) => {
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
  }, [contacts]);

  const loadWritersFromCopyright = useCallback((copyright: any) => {
    console.log("Loading writers from linked copyright:", copyright.copyright_writers);
    
    return copyright.copyright_writers.map((writer: any) => ({
      id: `copyright_writer_${writer.id}`,
      name: writer.writer_name,
      writer_share: writer.ownership_percentage || 0,
      performance_share: writer.performance_share || 0,
      mechanical_share: writer.mechanical_share || 0,
      synchronization_share: writer.synchronization_share || 0,
      type: 'copyright_writer',
      copyright_writer_id: writer.id
    }));
  }, []);

  // Load writers only once when the component mounts or when critical dependencies change
  useEffect(() => {
    // Skip if already loaded to prevent infinite loops
    if (writersLoaded) return;
    
    const loadWriters = async () => {
      setLoadingWriters(true);
      try {
        let writersToLoad: any[] = [];

        // Priority 1: For existing allocations with ownership_splits
        if (allocation?.ownership_splits && Object.keys(allocation.ownership_splits).length > 0) {
          writersToLoad = loadWritersFromOwnershipSplits(allocation.ownership_splits);
        }
        // Priority 2: For new allocations or when no ownership_splits exist, use linked copyright
        else if (linkedCopyright?.copyright_writers && linkedCopyright.copyright_writers.length > 0) {
          writersToLoad = loadWritersFromCopyright(linkedCopyright);
        }

        setWriters(writersToLoad);
        setWritersLoaded(true);
        console.log("Final loaded writers:", writersToLoad);
        
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

    // Only load if we have the necessary data and haven't loaded yet
    if (copyrights.length > 0 && !writersLoaded) {
      loadWriters();
    } else if (copyrights.length === 0) {
      setLoadingWriters(false);
    }
  }, [allocation?.id, linkedCopyright?.id, copyrights.length, writersLoaded, loadWritersFromOwnershipSplits, loadWritersFromCopyright]);

  // Reset writers loaded state when allocation changes
  useEffect(() => {
    setWritersLoaded(false);
    setWriters([]);
  }, [allocation?.id]);

  const addWriter = useCallback(() => {
    const newWriter = {
      id: `writer_${Date.now()}`,
      name: "",
      writer_share: 0,
      performance_share: 0,
      mechanical_share: 0,
      synchronization_share: 0,
      type: 'manual'
    };
    setWriters(prev => [...prev, newWriter]);
  }, []);

  const removeWriter = useCallback((writerId: string) => {
    setWriters(prev => prev.filter(w => w.id !== writerId));
  }, []);

  const updateWriter = useCallback((writerId: string, field: string, value: any) => {
    setWriters(prev => prev.map(w => 
      w.id === writerId ? { ...w, [field]: value } : w
    ));
  }, []);

  const handleCopyrightLink = async (copyrightId: string, workTitle: string) => {
    setValue("copyright_id", copyrightId);
    setShowSongMatch(false);
    setWritersLoaded(false); // Reset to reload writers from new copyright
    
    toast({
      title: "Success",
      description: `Linked to copyright "${workTitle}"`,
    });
  };

  const handleCopyrightUnlink = () => {
    setValue("copyright_id", "");
    setWriters([]);
    setWritersLoaded(false);
    
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
        song_title: data.song_title,
        artist: data.artist || null,
        isrc: data.isrc || null,
        gross_royalty_amount: data.gross_royalty_amount,
        controlled_status: data.controlled_status,
        recoupable_expenses: data.recoupable_expenses,
        comments: data.comments || null,
        quarter: data.quarter || null,
        source: data.source || null,
        revenue_source: data.revenue_source || null,
        work_identifier: data.work_identifier || null,
        share: data.share || null,
        media_type: data.media_type || null,
        media_sub_type: data.media_sub_type || null,
        country: data.country || null,
        quantity: data.quantity || null,
        net_amount: data.net_amount || null,
        iswc: data.iswc || null,
        statement_id: data.statement_id || null,
        batch_id: data.batch_id || null,
        copyright_id: data.copyright_id || null,
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
            <BasicInfoTab
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              linkedCopyright={linkedCopyright}
              onShowSongMatch={() => setShowSongMatch(true)}
              onCopyrightUnlink={handleCopyrightUnlink}
            />
          </TabsContent>

          <TabsContent value="writers" className="space-y-4">
            <WritersTab
              writers={writers}
              loadingWriters={loadingWriters}
              onAddWriter={addWriter}
              onRemoveWriter={removeWriter}
              onUpdateWriter={updateWriter}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <AdvancedTab
              register={register}
              setValue={setValue}
              batches={batches}
            />
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
