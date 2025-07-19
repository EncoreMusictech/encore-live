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

const mediaTypes = [
  "Film",
  "Television",
  "Documentary",
  "Commercial",
  "Video Game",
  "Web Series",
  "Podcast",
  "Audio Book",
  "Streaming"
];

const statusOptions = ["Inquiry", "Negotiating", "Approved", "Declined", "Licensed"];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
const paymentStatuses = ["Pending", "Partial", "Paid in Full"];
const invoiceStatuses = ["Not Issued", "Issued", "Paid"];

const territories = [
  "Worldwide", "US Only", "North America", "Europe", "UK & Ireland", 
  "Asia Pacific", "Latin America", "Custom Territory"
];

interface SongFeeAllocation {
  copyrightId: string;
  workTitle: string;
  customAmount?: number;
  allocatedAmount: number;
  controlledShare: number;
  controlledAmount: number;
  controlledWriters: Array<{
    name: string;
    share: number;
    amount: number;
  }>;
}

export const SyncLicenseForm = ({ open, onOpenChange, license }: SyncLicenseFormProps) => {
  const { user } = useAuth();
  const createMutation = useCreateSyncLicense();
  const updateMutation = useUpdateSyncLicense();
  const { data: agents } = useSyncAgents();
  const { data: sources } = useSyncSources();
  const { copyrights, getWritersForCopyright } = useCopyright();

  const [agentOpen, setAgentOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedCopyrights, setSelectedCopyrights] = useState<Copyright[]>([]);
  const [controlledWriters, setControlledWriters] = useState<CopyrightWriter[]>([]);
  const [songFeeAllocations, setSongFeeAllocations] = useState<{[key: string]: string}>({});
  const mediaTypes = [
    "Film", "Television", "Documentary", "Commercial", "Video Game", 
    "Web Series", "Podcast", "Audio Book", "Streaming"
  ];
  
  const musicTypes = ["Original Score", "Existing Song", "Cover Version", "Instrumental"];
  const musicUses = ["Background", "Featured", "Theme Song", "End Credits"];

  const existingAgents = agents || [];
  const existingSources = sources || [];


  const loadControlledWriters = useCallback(async () => {
    if (selectedCopyrights.length === 0) {
      setControlledWriters([]);
      return;
    }

    const allControlledWriters: CopyrightWriter[] = [];
    
    for (const copyright of selectedCopyrights) {
      try {
        const writers = await getWritersForCopyright(copyright.id);
        const controlled = writers.filter(writer => writer.controlled_status === 'C');
        allControlledWriters.push(...controlled);
      } catch (error) {
        console.error(`Error loading writers for copyright ${copyright.id}:`, error);
      }
    }
    
    setControlledWriters(allControlledWriters);
  }, [selectedCopyrights]);

  useEffect(() => {
    loadControlledWriters();
  }, [loadControlledWriters]);

  const isEditing = !!license;

  const form = useForm({
    defaultValues: {
      project_title: "",
      synch_agent: "",
      media_type: "",
      platforms: "",
      territory: "",
      term_duration: "",
      episode_season: "",
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
      audio_file_url: "",
      contract_execution_status: "draft" as 'draft' | 'sent' | 'signed' | 'executed' | 'expired',
      contract_sent_date: undefined as Date | undefined,
      contract_signed_date: undefined as Date | undefined,
      contract_executed_date: undefined as Date | undefined,
      contract_expiry_date: undefined as Date | undefined,
      signatory_name: "",
      signatory_title: "",
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

  const calculateFeeAllocations = useCallback(async (): Promise<SongFeeAllocation[]> => {
    if (selectedCopyrights.length === 0) return [];

    const pubFee = parseFloat(form.watch('pub_fee') || '0');
    const allocations: SongFeeAllocation[] = [];

    for (const copyright of selectedCopyrights) {
      const writersInCopyright = controlledWriters.filter(w => w.copyright_id === copyright.id);
      const controlledShare = writersInCopyright
        .filter(w => w.controlled_status === 'C')
        .reduce((sum, w) => sum + w.ownership_percentage, 0);

      const customAmount = parseFloat(songFeeAllocations[copyright.id] || '0');
      const allocatedAmount = customAmount > 0 ? customAmount : (pubFee * controlledShare) / 100;
      const controlledAmount = allocatedAmount;

      const controlledWritersWithAmounts = writersInCopyright
        .filter(w => w.controlled_status === 'C')
        .map(writer => ({
          name: writer.writer_name,
          share: writer.ownership_percentage,
          amount: (allocatedAmount * writer.ownership_percentage) / controlledShare || 0
        }));

      allocations.push({
        copyrightId: copyright.id,
        workTitle: copyright.work_title,
        customAmount: customAmount > 0 ? customAmount : undefined,
        allocatedAmount,
        controlledShare,
        controlledAmount,
        controlledWriters: controlledWritersWithAmounts
      });
    }

    return allocations;
  }, [selectedCopyrights, controlledWriters, form.watch('pub_fee'), songFeeAllocations]);

  const handleCustomAmountChange = (copyrightId: string, amount: string) => {
    setSongFeeAllocations(prev => ({
      ...prev,
      [copyrightId]: amount
    }));
  };

  useEffect(() => {
    if (license && open) {
      form.reset({
        project_title: license.project_title || "",
        synch_agent: license.synch_agent || "",
        media_type: license.media_type || "",
        platforms: license.platforms || "",
        territory: license.territory || "",
        term_duration: license.term_duration || "",
        episode_season: license.episode_season || "",
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
        
        // Contact information fields
        licensor_name: license.licensor_name || "",
        licensor_email: license.licensor_email || "",
        licensor_phone: license.licensor_phone || "",
        licensor_address: license.licensor_address || "",
        licensor_company: license.licensor_company || "",
        licensee_name: license.licensee_name || "",
        licensee_email: license.licensee_email || "",
        licensee_phone: license.licensee_phone || "",
        licensee_address: license.licensee_address || "",
        licensee_company: license.licensee_company || "",
        
        // Payment terms fields
        payment_due_date: license.payment_due_date ? new Date(license.payment_due_date) : undefined,
        payment_method: license.payment_method || "",
        banking_instructions: license.banking_instructions || {},
        payment_reference: license.payment_reference || "",
        advance_amount: license.advance_amount || 0,
        backend_percentage: license.backend_percentage || 0,
        
        // Scene context fields
        scene_description: license.scene_description || "",
        scene_duration_seconds: license.scene_duration_seconds || 0,
        scene_timestamp: license.scene_timestamp || "",
        music_timing_notes: license.music_timing_notes || "",
        instrumental_vocal: license.instrumental_vocal || "instrumental",
        music_prominence: license.music_prominence || "background",
        audio_file_url: license.audio_file_url || "",
      });
    }
  }, [license, open, form]);

  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      const feeAllocations = await calculateFeeAllocations();
      
      const submissionData = {
        ...data,
        user_id: user.id,
        controlled_writers: controlledWriters,
        fee_allocations: feeAllocations,
        // Remove undefined values
        ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined))
      };

      if (isEditing && license) {
        await updateMutation.mutateAsync({
          id: license.id,
          data: submissionData
        });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting sync license:', error);
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
                    audio_file_url: form.watch('audio_file_url'),
                  }}
                  onSceneChange={(data) => {
                    form.setValue('scene_description', data.scene_description);
                    form.setValue('scene_duration_seconds', data.scene_duration_seconds);
                    form.setValue('scene_timestamp', data.scene_timestamp);
                    form.setValue('music_timing_notes', data.music_timing_notes);
                    form.setValue('instrumental_vocal', data.instrumental_vocal);
                    form.setValue('music_prominence', data.music_prominence);
                    form.setValue('audio_file_url', data.audio_file_url);
                  }}
                />

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="platforms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platforms</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all-media">All Media</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="television">Television</SelectItem>
                            <SelectItem value="theatrical">Theatrical</SelectItem>
                            <SelectItem value="streaming">Streaming</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                            <SelectItem value="broadcast">Broadcast</SelectItem>
                            <SelectItem value="cable">Cable</SelectItem>
                            <SelectItem value="social-media">Social Media</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="episode_season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episode/Season</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Season 1 Episode 5, Episode 12, Season 2" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="territory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Territory</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select territory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="worldwide">Worldwide</SelectItem>
                            <SelectItem value="us-only">US Only</SelectItem>
                            <SelectItem value="north-america">North America</SelectItem>
                            <SelectItem value="europe">Europe</SelectItem>
                            <SelectItem value="uk-ireland">UK & Ireland</SelectItem>
                            <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                            <SelectItem value="latin-america">Latin America</SelectItem>
                            <SelectItem value="custom">Custom Territory</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="term_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Duration</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="perpetuity">Perpetuity</SelectItem>
                            <SelectItem value="1-year">1 Year</SelectItem>
                            <SelectItem value="2-years">2 Years</SelectItem>
                            <SelectItem value="3-years">3 Years</SelectItem>
                            <SelectItem value="5-years">5 Years</SelectItem>
                            <SelectItem value="7-years">7 Years</SelectItem>
                            <SelectItem value="10-years">10 Years</SelectItem>
                            <SelectItem value="15-years">15 Years</SelectItem>
                            <SelectItem value="custom">Custom Term</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                {/* Fee Allocations Display */}
                {selectedCopyrights.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="text-sm font-medium mb-2">Selected Works for Sync License</h4>
                      <div className="space-y-2">
                        {selectedCopyrights.map((copyright) => (
                          <div key={copyright.id} className="flex justify-between items-center text-sm">
                            <span>{copyright.work_title}</span>
                            <span className="text-muted-foreground">{copyright.work_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fee Allocation Breakdown */}
                    {form.watch('pub_fee') && parseFloat(form.watch('pub_fee') || '0') > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-4">Fee Allocation Breakdown</h4>
                        <div className="space-y-4">
                          {selectedCopyrights.map((copyright) => {
                            const writersInCopyright = controlledWriters.filter(w => w.copyright_id === copyright.id);
                            const controlledShare = writersInCopyright
                              .filter(w => w.controlled_status === 'C')
                              .reduce((sum, w) => sum + w.ownership_percentage, 0);
                            
                            const pubFee = parseFloat(form.watch('pub_fee') || '0');
                            const customAmount = parseFloat(songFeeAllocations[copyright.id] || '0');
                            const allocatedAmount = customAmount > 0 ? customAmount : (pubFee * controlledShare) / 100;

                            if (controlledShare === 0) return null;

                            return (
                              <div key={copyright.id} className="border rounded p-3 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{copyright.work_title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Controlled Share: {controlledShare}%
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Custom Amount</div>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={songFeeAllocations[copyright.id] || ''}
                                      onChange={(e) => handleCustomAmountChange(copyright.id, e.target.value)}
                                      className="w-20 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                
                                <div className="text-sm">
                                  <div className="flex justify-between">
                                    <span>Allocated Amount:</span>
                                    <span className="font-medium">${allocatedAmount.toFixed(2)}</span>
                                  </div>
                                </div>

                                {writersInCopyright.filter(w => w.controlled_status === 'C').length > 0 && (
                                  <div className="border-t pt-2">
                                    <div className="text-xs text-muted-foreground mb-2">Controlled Writers:</div>
                                    <div className="space-y-1">
                                      {writersInCopyright
                                        .filter(w => w.controlled_status === 'C')
                                        .map((writer, idx) => {
                                          const writerAmount = (allocatedAmount * writer.ownership_percentage) / controlledShare || 0;
                                          return (
                                            <div key={idx} className="flex justify-between text-xs">
                                              <span>{writer.writer_name} ({writer.ownership_percentage}%)</span>
                                              <span>${writerAmount.toFixed(2)}</span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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
                  }}
                  onContractChange={(data) => {
                    form.setValue('contract_execution_status', data.contract_execution_status);
                    form.setValue('contract_sent_date', data.contract_sent_date);
                    form.setValue('contract_signed_date', data.contract_signed_date);
                    form.setValue('contract_executed_date', data.contract_executed_date);
                    form.setValue('contract_expiry_date', data.contract_expiry_date);
                    form.setValue('signatory_name', data.signatory_name);
                    form.setValue('signatory_title', data.signatory_title);
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
