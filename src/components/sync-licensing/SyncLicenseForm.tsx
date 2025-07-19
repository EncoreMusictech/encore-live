import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SyncLicense, useCreateSyncLicense, useUpdateSyncLicense } from "@/hooks/useSyncLicenses";
import { useSyncAgents, useSyncSources } from "@/hooks/useSyncAgents";
import { useAuth } from "@/hooks/useAuth";
import { SyncRightsManager } from "./SyncRightsManager";
import { ContactManagement } from "./ContactManagement";
import { PaymentTermsForm } from "./PaymentTermsForm";
import { SceneContextForm } from "./SceneContextForm";
import { RightsClearanceForm } from "./RightsClearanceForm";
import { ContractExecutionForm } from "./ContractExecutionForm";
import { Copyright, useCopyright, CopyrightWriter } from "@/hooks/useCopyright";

interface SyncLicenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license?: SyncLicense | null;
}

const mediaTypes = ["Film", "TV", "Ad", "Social", "Game", "Other"];
const statusOptions = ["Inquiry", "Negotiating", "Approved", "Declined", "Licensed"];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
const paymentStatuses = ["Pending", "Partial", "Paid in Full"];
const invoiceStatuses = ["Not Issued", "Issued", "Paid"];

// Music industry specific options
const musicTypes = [
  "Featured", "Background", "Theme", "Bumper", "Jingle", "Score", 
  "Source Music", "Underscore", "Main Title", "End Credits"
];

const musicUses = [
  "Trailer", "Scene", "Credits", "Opening", "Montage", "Commercial", 
  "Promo", "Background", "Main Theme", "End Credits", "Transition"
];

const territories = [
  "Worldwide", "North America", "United States", "Canada", "Europe", 
  "United Kingdom", "Germany", "France", "Australia", "Japan", 
  "Latin America", "Asia Pacific", "Specific Territory"
];

interface SongFeeAllocation {
  copyrightId: string;
  workTitle: string;
  customAmount?: number;
  allocatedAmount: number;
  controlledShare: number;
  controlledAmount: number;
  controlledWriters: Array<{
    id: string;
    name: string;
    ownershipPercentage: number;
    allocatedAmount: number;
  }>;
}

export const SyncLicenseForm = ({ open, onOpenChange, license }: SyncLicenseFormProps) => {
  const [agentOpen, setAgentOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedCopyrights, setSelectedCopyrights] = useState<Copyright[]>([]);
  const [controlledWriters, setControlledWriters] = useState<CopyrightWriter[]>([]);
  const [songFeeAllocations, setSongFeeAllocations] = useState<{ [key: string]: number }>({});
  
  // New state for enhanced forms
  const [contactData, setContactData] = useState<any>({});
  const [paymentData, setPaymentData] = useState<any>({});
  const [sceneData, setSceneData] = useState<any>({});
  const [rightsData, setRightsData] = useState<any>({});
  const [contractData, setContractData] = useState<any>({});
  const { user } = useAuth();
  const { getWritersForCopyright } = useCopyright();
  const createMutation = useCreateSyncLicense();
  const updateMutation = useUpdateSyncLicense();
  const { data: existingAgents = [] } = useSyncAgents();
  const { data: existingSources = [] } = useSyncSources();
  
  // Memoize controlled writers to prevent infinite loops
  const memoizedSelectedCopyrights = useMemo(() => selectedCopyrights, [selectedCopyrights]);

  // Load controlled writers when selected copyrights change
  const loadControlledWriters = useCallback(async () => {
    if (memoizedSelectedCopyrights.length === 0) {
      setControlledWriters([]);
      return;
    }

    const allControlledWriters: CopyrightWriter[] = [];
    
    for (const copyright of memoizedSelectedCopyrights) {
      try {
        const writers = await getWritersForCopyright(copyright.id);
        const controlled = writers.filter(writer => writer.controlled_status === 'C');
        allControlledWriters.push(...controlled);
      } catch (error) {
        console.error(`Error loading writers for copyright ${copyright.id}:`, error);
      }
    }
    
    setControlledWriters(allControlledWriters);
  }, [memoizedSelectedCopyrights]);

  useEffect(() => {
    loadControlledWriters();
  }, [loadControlledWriters]);

  const isEditing = !!license;

  const form = useForm({
    defaultValues: {
      project_title: "",
      synch_agent: "",
      media_type: "",
      request_received: undefined as Date | undefined,
      source: "",
      territory_of_licensee: "",
      term_start: undefined as Date | undefined,
      term_end: undefined as Date | undefined,
      music_type: "",
      music_use: "",
      smpte: "",
      pub_fee: "",
      master_fee: "",
      currency: "USD",
      synch_status: "Inquiry",
      notes: "",
      payment_status: "Pending",
      invoice_status: "Not Issued",
      mfn: false,
      
      // Phase 1: New fields
      licensor_name: "",
      licensor_email: "",
      licensor_phone: "",
      licensor_address: "",
      licensor_company: "",
      licensee_name: "",
      licensee_email: "",
      licensee_phone: "",
      licensee_address: "",
      licensee_company: "",
      payment_due_date: undefined as Date | undefined,
      payment_method: "",
      banking_instructions: {},
      payment_reference: "",
      advance_amount: 0,
      backend_percentage: 0,
      scene_description: "",
      scene_duration_seconds: 0,
      scene_timestamp: "",
      music_timing_notes: "",
      instrumental_vocal: "both" as 'instrumental' | 'vocal' | 'both',
      music_prominence: "background" as 'background' | 'featured' | 'theme',
      audio_mix_level: 5,
      contract_execution_status: "draft" as 'draft' | 'sent' | 'signed' | 'executed' | 'expired',
      contract_sent_date: undefined as Date | undefined,
      contract_signed_date: undefined as Date | undefined,
      contract_executed_date: undefined as Date | undefined,
      contract_expiry_date: undefined as Date | undefined,
      signatory_name: "",
      signatory_title: "",
      witness_name: "",
      notarization_required: false,
      notarization_date: undefined as Date | undefined,
      credit_language: "",
      credit_placement: "end_credits" as 'end_credits' | 'opening_credits' | 'none' | 'on_screen' | 'package_only',
      credit_size: "standard" as 'standard' | 'large' | 'small' | 'equal',
      credit_requirements: {},
      rights_cleared: "",
      clearance_notes: "",
      master_rights_cleared: false,
      publishing_rights_cleared: false,
      synchronization_rights_cleared: false,
      performance_rights_cleared: false,
      mechanical_rights_cleared: false,
    },
    mode: "onChange",
  });

  // Calculate fee allocations with proration logic
  const calculateFeeAllocations = useCallback(async (): Promise<SongFeeAllocation[]> => {
    if (selectedCopyrights.length === 0) return [];

    const pubFee = parseFloat(form.watch('pub_fee') || '0');
    if (pubFee === 0) return [];

    const allocations: SongFeeAllocation[] = [];

    for (const copyright of selectedCopyrights) {
      try {
        const writers = await getWritersForCopyright(copyright.id);
        const controlledWritersForSong = writers.filter(writer => writer.controlled_status === 'C');
        
        // 1. Calculate allocated amount per song (equal division unless custom amount)
        const customAmount = songFeeAllocations[copyright.id];
        const allocatedAmount = customAmount !== undefined 
          ? customAmount 
          : pubFee / selectedCopyrights.length;

        // 2. Calculate controlled share (sum of controlled writers' percentages)
        const controlledShare = controlledWritersForSong.reduce(
          (sum, writer) => sum + (writer.ownership_percentage || 0), 
          0
        ) / 100; // Convert to decimal

        // 3. Calculate controlled amount (allocated amount * controlled share)
        const controlledAmount = allocatedAmount * controlledShare;

        // 4. Calculate individual writer allocations
        const totalControlledPercentage = controlledWritersForSong.reduce(
          (sum, writer) => sum + (writer.ownership_percentage || 0), 
          0
        );

        const controlledWriterAllocations = controlledWritersForSong.map(writer => ({
          id: writer.id,
          name: writer.writer_name,
          ownershipPercentage: writer.ownership_percentage || 0,
          allocatedAmount: totalControlledPercentage > 0 
            ? (controlledAmount * (writer.ownership_percentage || 0)) / totalControlledPercentage
            : 0
        }));

        allocations.push({
          copyrightId: copyright.id,
          workTitle: copyright.work_title,
          customAmount,
          allocatedAmount,
          controlledShare,
          controlledAmount,
          controlledWriters: controlledWriterAllocations
        });

      } catch (error) {
        console.error(`Error calculating allocation for copyright ${copyright.id}:`, error);
      }
    }

    return allocations;
  }, [selectedCopyrights, form, songFeeAllocations]);

  // Memoize fee allocations to prevent excessive recalculation
  const [feeAllocations, setFeeAllocations] = useState<SongFeeAllocation[]>([]);

  useEffect(() => {
    calculateFeeAllocations().then(setFeeAllocations);
  }, [calculateFeeAllocations]);

  const handleCustomAmountChange = (copyrightId: string, amount: string) => {
    const numericAmount = amount === '' ? undefined : parseFloat(amount);
    setSongFeeAllocations(prev => ({
      ...prev,
      [copyrightId]: numericAmount
    }));
  };

  // Calculate totals for validation
  const totalCustomAllocated = Object.values(songFeeAllocations)
    .filter(amount => amount !== undefined)
    .reduce((sum, amount) => sum + (amount || 0), 0);

  const totalPubFee = parseFloat(form.watch('pub_fee') || '0');
  const remainingAmount = totalPubFee - totalCustomAllocated;
  const songsWithoutCustomAmount = selectedCopyrights.length - Object.keys(songFeeAllocations).filter(key => songFeeAllocations[key] !== undefined).length;

  useEffect(() => {
    if (license) {
      form.reset({
        project_title: license.project_title || "",
        synch_agent: license.synch_agent || "",
        media_type: license.media_type || "",
        request_received: license.request_received ? new Date(license.request_received) : undefined,
        source: license.source || "",
        territory_of_licensee: license.territory_of_licensee || "",
        term_start: license.term_start ? new Date(license.term_start) : undefined,
        term_end: license.term_end ? new Date(license.term_end) : undefined,
        music_type: license.music_type || "",
        music_use: license.music_use || "",
        smpte: license.smpte || "",
        pub_fee: license.pub_fee?.toString() || "",
        master_fee: license.master_fee?.toString() || "",
        currency: license.currency || "USD",
        synch_status: license.synch_status || "Inquiry",
        notes: license.notes || "",
        payment_status: license.payment_status || "Pending",
        invoice_status: license.invoice_status || "Not Issued",
        mfn: license.mfn || false,
      });
    } else {
      form.reset({
        project_title: "",
        synch_agent: "",
        media_type: "",
        request_received: undefined,
        source: "",
        territory_of_licensee: "",
        term_start: undefined,
        term_end: undefined,
        music_type: "",
        music_use: "",
        smpte: "",
        pub_fee: "",
        master_fee: "",
        currency: "USD",
        synch_status: "Inquiry",
        notes: "",
        payment_status: "Pending",
        invoice_status: "Not Issued",
        mfn: false,
      });
    }
  }, [license, form]);

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      user_id: user?.id,
      // Only include media_type if it has a valid value
      media_type: data.media_type && mediaTypes.includes(data.media_type) ? data.media_type : null,
      pub_fee: data.pub_fee ? parseFloat(data.pub_fee) : undefined,
      master_fee: data.master_fee ? parseFloat(data.master_fee) : undefined,
      request_received: data.request_received ? format(data.request_received, "yyyy-MM-dd") : undefined,
      term_start: data.term_start ? format(data.term_start, "yyyy-MM-dd") : undefined,
      term_end: data.term_end ? format(data.term_end, "yyyy-MM-dd") : undefined,
    };

    // Remove undefined/null values to prevent database issues
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined || submitData[key] === null || submitData[key] === '') {
        delete submitData[key];
      }
    });

    if (isEditing && license) {
      updateMutation.mutate(
        { id: license.id, data: submitData },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Sync License" : "New Sync Request"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the sync licensing details."
              : "Create a new sync licensing request with all relevant details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="scene">Scene</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="rights">Rights</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="project_title"
                    rules={{ 
                      required: "Project title is required",
                      minLength: { value: 2, message: "Project title must be at least 2 characters" }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground after:content-['*'] after:ml-0.5 after:text-destructive">
                          Project Title
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="synch_agent"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Sync Agent</FormLabel>
                        <Popover open={agentOpen} onOpenChange={setAgentOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select or enter agent name"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search or type new agent..." 
                                value={field.value || ""} 
                                onValueChange={field.onChange}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2">
                                    <div className="text-sm">No agent found.</div>
                                    <div className="text-xs text-muted-foreground">
                                      Press Enter to add "{field.value}"
                                    </div>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {existingAgents.map((agent) => (
                                    <CommandItem
                                      key={agent}
                                      value={agent}
                                      onSelect={() => {
                                        field.onChange(agent);
                                        setAgentOpen(false);
                                      }}
                                    >
                                      {agent}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="media_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select media type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mediaTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="request_received"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Request Received</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Source</FormLabel>
                        <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select or enter source"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search or type new source..." 
                                value={field.value || ""} 
                                onValueChange={field.onChange}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2">
                                    <div className="text-sm">No source found.</div>
                                    <div className="text-xs text-muted-foreground">
                                      Press Enter to add "{field.value}"
                                    </div>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {existingSources.map((source) => (
                                    <CommandItem
                                      key={source}
                                      value={source}
                                      onSelect={() => {
                                        field.onChange(source);
                                        setSourceOpen(false);
                                      }}
                                    >
                                      {source}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4">
                <ContactManagement
                  licensorData={{
                    name: form.watch('licensor_name'),
                    email: form.watch('licensor_email'),
                    phone: form.watch('licensor_phone'),
                    address: form.watch('licensor_address'),
                    company: form.watch('licensor_company'),
                  }}
                  licenseeData={{
                    name: form.watch('licensee_name'),
                    email: form.watch('licensee_email'),
                    phone: form.watch('licensee_phone'),
                    address: form.watch('licensee_address'),
                    company: form.watch('licensee_company'),
                  }}
                  onLicensorChange={(data) => {
                    form.setValue('licensor_name', data.name);
                    form.setValue('licensor_email', data.email);
                    form.setValue('licensor_phone', data.phone);
                    form.setValue('licensor_address', data.address);
                    form.setValue('licensor_company', data.company);
                  }}
                  onLicenseeChange={(data) => {
                    form.setValue('licensee_name', data.name);
                    form.setValue('licensee_email', data.email);
                    form.setValue('licensee_phone', data.phone);
                    form.setValue('licensee_address', data.address);
                    form.setValue('licensee_company', data.company);
                  }}
                />
              </TabsContent>

              <TabsContent value="scene" className="space-y-4">
                <SceneContextForm
                  sceneData={{
                    scene_description: form.watch('scene_description'),
                    scene_duration_seconds: form.watch('scene_duration_seconds'),
                    scene_timestamp: form.watch('scene_timestamp'),
                    music_timing_notes: form.watch('music_timing_notes'),
                    instrumental_vocal: form.watch('instrumental_vocal'),
                    music_prominence: form.watch('music_prominence'),
                    audio_mix_level: form.watch('audio_mix_level'),
                  }}
                  onSceneChange={(data) => {
                    form.setValue('scene_description', data.scene_description);
                    form.setValue('scene_duration_seconds', data.scene_duration_seconds);
                    form.setValue('scene_timestamp', data.scene_timestamp);
                    form.setValue('music_timing_notes', data.music_timing_notes);
                    form.setValue('instrumental_vocal', data.instrumental_vocal);
                    form.setValue('music_prominence', data.music_prominence);
                    form.setValue('audio_mix_level', data.audio_mix_level);
                  }}
                />
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="territory_of_licensee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Territory of Licensee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select territory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {territories.map((territory) => (
                              <SelectItem key={territory} value={territory}>
                                {territory}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="music_type"
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
                            {musicTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="term_start"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Term Start</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="term_end"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Term End</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="music_use"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Music Use</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select music use" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {musicUses.map((use) => (
                              <SelectItem key={use} value={use}>
                                {use}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smpte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMPTE (Time Code)</FormLabel>
                        <FormControl>
                          <Input placeholder="00:00:30:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mfn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Most Favored Nation (MFN)
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Apply most favored nation clause to this license
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="rights" className="space-y-4">
                <RightsClearanceForm
                  rightsData={{
                    rights_cleared: form.watch('rights_cleared'),
                    clearance_notes: form.watch('clearance_notes'),
                    master_rights_cleared: form.watch('master_rights_cleared'),
                    publishing_rights_cleared: form.watch('publishing_rights_cleared'),
                    synchronization_rights_cleared: form.watch('synchronization_rights_cleared'),
                    performance_rights_cleared: form.watch('performance_rights_cleared'),
                    mechanical_rights_cleared: form.watch('mechanical_rights_cleared'),
                  }}
                  onRightsChange={(data) => {
                    form.setValue('rights_cleared', data.rights_cleared);
                    form.setValue('clearance_notes', data.clearance_notes);
                    form.setValue('master_rights_cleared', data.master_rights_cleared);
                    form.setValue('publishing_rights_cleared', data.publishing_rights_cleared);
                    form.setValue('synchronization_rights_cleared', data.synchronization_rights_cleared);
                    form.setValue('performance_rights_cleared', data.performance_rights_cleared);
                    form.setValue('mechanical_rights_cleared', data.mechanical_rights_cleared);
                  }}
                />
              </TabsContent>

              <TabsContent value="rights" className="space-y-4">
                <SyncRightsManager 
                  selectedCopyrightIds={selectedCopyrights.map(c => c.id)}
                  onCopyrightSelect={setSelectedCopyrights}
                  onCopyrightCreate={(copyright) => setSelectedCopyrights([...selectedCopyrights, copyright])}
                />
              </TabsContent>

              <TabsContent value="fees" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pub_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publishing Fee</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="master_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Master Fee</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Enhanced Fee Allocation with Proration Logic */}
                {feeAllocations.length > 0 && totalPubFee > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Publishing Fee Allocation & Proration</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Total Publishing Fee: {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: form.watch('currency') || 'USD'
                        }).format(totalPubFee)}
                        {songsWithoutCustomAmount > 0 && (
                          <span className="ml-2">
                            | Remaining for {songsWithoutCustomAmount} songs: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: form.watch('currency') || 'USD'
                            }).format(remainingAmount)}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {feeAllocations.map((allocation) => (
                        <div key={allocation.copyrightId} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{allocation.workTitle}</h4>
                              <div className="text-sm text-muted-foreground">
                                Controlled Share: {(allocation.controlledShare * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Custom Amount:</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Auto"
                                value={songFeeAllocations[allocation.copyrightId] ?? ''}
                                onChange={(e) => handleCustomAmountChange(allocation.copyrightId, e.target.value)}
                                className="w-24"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Allocated Amount:</span>
                              <div className="font-medium">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: form.watch('currency') || 'USD'
                                }).format(allocation.allocatedAmount)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Controlled Amount:</span>
                              <div className="font-medium">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: form.watch('currency') || 'USD'
                                }).format(allocation.controlledAmount)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Writers:</span>
                              <div className="font-medium">{allocation.controlledWriters.length}</div>
                            </div>
                          </div>

                          {allocation.controlledWriters.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Writer Name</TableHead>
                                  <TableHead>Ownership %</TableHead>
                                  <TableHead>Allocated Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allocation.controlledWriters.map((writer) => (
                                  <TableRow key={writer.id}>
                                    <TableCell className="font-medium">{writer.name}</TableCell>
                                    <TableCell>{writer.ownershipPercentage}%</TableCell>
                                    <TableCell>
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: form.watch('currency') || 'USD'
                                      }).format(writer.allocatedAmount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      ))}

                      <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                          <div>
                            Total Allocated: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: form.watch('currency') || 'USD'
                            }).format(feeAllocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0))}
                          </div>
                          <div>
                            Total to Controlled Writers: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: form.watch('currency') || 'USD'
                            }).format(feeAllocations.reduce((sum, allocation) => sum + allocation.controlledAmount, 0))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="synch_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sync Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoice_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {invoiceStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or comments..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <ContractExecutionForm
                  contractData={{
                    contract_execution_status: form.watch('contract_execution_status'),
                    contract_sent_date: form.watch('contract_sent_date'),
                    contract_signed_date: form.watch('contract_signed_date'),
                    contract_executed_date: form.watch('contract_executed_date'),
                    contract_expiry_date: form.watch('contract_expiry_date'),
                    signatory_name: form.watch('signatory_name'),
                    signatory_title: form.watch('signatory_title'),
                    witness_name: form.watch('witness_name'),
                    notarization_required: form.watch('notarization_required'),
                    notarization_date: form.watch('notarization_date'),
                  }}
                  onContractChange={(data) => {
                    form.setValue('contract_execution_status', data.contract_execution_status);
                    form.setValue('contract_sent_date', data.contract_sent_date);
                    form.setValue('contract_signed_date', data.contract_signed_date);
                    form.setValue('contract_executed_date', data.contract_executed_date);
                    form.setValue('contract_expiry_date', data.contract_expiry_date);
                    form.setValue('signatory_name', data.signatory_name);
                    form.setValue('signatory_title', data.signatory_title);
                    form.setValue('witness_name', data.witness_name);
                    form.setValue('notarization_required', data.notarization_required);
                    form.setValue('notarization_date', data.notarization_date);
                  }}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update" : "Create"} Sync License
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
