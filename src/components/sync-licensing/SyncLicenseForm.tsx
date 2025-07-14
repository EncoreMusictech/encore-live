import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SyncLicense, useCreateSyncLicense, useUpdateSyncLicense } from "@/hooks/useSyncLicenses";

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

export const SyncLicenseForm = ({ open, onOpenChange, license }: SyncLicenseFormProps) => {
  const createMutation = useCreateSyncLicense();
  const updateMutation = useUpdateSyncLicense();
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
    },
  });

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
      });
    }
  }, [license, form]);

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      pub_fee: data.pub_fee ? parseFloat(data.pub_fee) : undefined,
      master_fee: data.master_fee ? parseFloat(data.master_fee) : undefined,
      request_received: data.request_received ? format(data.request_received, "yyyy-MM-dd") : undefined,
      term_start: data.term_start ? format(data.term_start, "yyyy-MM-dd") : undefined,
      term_end: data.term_end ? format(data.term_end, "yyyy-MM-dd") : undefined,
    };

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="rights">Rights</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="project_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title *</FormLabel>
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
                      <FormItem>
                        <FormLabel>Sync Agent</FormLabel>
                        <FormControl>
                          <Input placeholder="Agent name" {...field} />
                        </FormControl>
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
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input placeholder="Agency, Direct, Portal, etc." {...field} />
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
                    name="territory_of_licensee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Territory of Licensee</FormLabel>
                        <FormControl>
                          <Input placeholder="Worldwide, US, etc." {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Featured, Background, Theme, etc." {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Trailer, Scene, Credits, etc." {...field} />
                        </FormControl>
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
                </div>
              </TabsContent>

              <TabsContent value="rights" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Rights and splits management - Link to Copyright Module integration coming soon.
                </div>
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