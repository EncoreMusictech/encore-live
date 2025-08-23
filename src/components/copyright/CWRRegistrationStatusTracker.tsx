import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  ChevronDown, 
  Edit, 
  Send, 
  Eye,
  RotateCcw,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useCWRRegistrationStatus, RegistrationStatusRecord } from "@/hooks/useCWRRegistrationStatus";

export const CWRRegistrationStatusTracker = () => {
  const { registrations, loading, regenerateCWRFile, resendToPRO } = useCWRRegistrationStatus();
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationStatusRecord[]>(registrations);
  const [selectedSenderCode, setSelectedSenderCode] = useState<string>("all");
  const [selectedPRO, setSelectedPRO] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  // Update filtered registrations when data changes
  useState(() => {
    setFilteredRegistrations(registrations);
  });

  // Get unique values for filter dropdowns
  const senderCodes = Array.from(new Set(registrations.map(r => r.sender_code)));
  const proNames = Array.from(new Set(registrations.map(r => r.pro_name)));

  const applyFilters = () => {
    let filtered = registrations;

    if (selectedSenderCode !== "all") {
      filtered = filtered.filter(r => r.sender_code === selectedSenderCode);
    }

    if (selectedPRO !== "all") {
      filtered = filtered.filter(r => r.pro_name === selectedPRO);
    }

    if (selectedStatus !== "all") {  
      filtered = filtered.filter(r => r.registration_status === selectedStatus);
    }

    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.submission_date) >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.submission_date) <= dateTo);
    }

    setFilteredRegistrations(filtered);
  };

  const clearFilters = () => {
    setSelectedSenderCode("all");
    setSelectedPRO("all");
    setSelectedStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilteredRegistrations(registrations);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_registered':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <HelpCircle className="w-3 h-3 mr-1" />
            Not Registered
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'in_dispute':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            In Dispute
          </Badge>
        );
      case 'needs_amending':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Needs Amending
          </Badge>
        );
      case 'registered':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Registered
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButtons = (registration: RegistrationStatusRecord) => {
    const buttons = [];

    // View button - always available
    buttons.push(
      <Button
        key="view"
        size="sm"
        variant="outline"
        onClick={() => setExpandedDetails(expandedDetails === registration.id ? null : registration.id)}
      >
        <Eye className="w-4 h-4" />
      </Button>
    );

    // Edit and Resend buttons for works that need amending or are in dispute
    if (registration.registration_status === 'needs_amending' || registration.registration_status === 'in_dispute') {
      buttons.push(
        <Button
          key="edit"
          size="sm"
          variant="outline"
          onClick={() => regenerateCWRFile(registration.id)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      );
      
      buttons.push(
        <Button
          key="resend"
          size="sm"
          variant="outline"
          onClick={() => resendToPRO(registration.id)}
        >
          <Send className="w-4 h-4" />
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading registration status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Registration Status Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Sender Code Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sender Code</label>
              <Select value={selectedSenderCode} onValueChange={setSelectedSenderCode}>
                <SelectTrigger>
                  <SelectValue placeholder="All Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  {senderCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PRO Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">PRO</label>
              <Select value={selectedPRO} onValueChange={setSelectedPRO}>
                <SelectTrigger>
                  <SelectValue placeholder="All PROs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PROs</SelectItem>
                  {proNames.map(pro => (
                    <SelectItem key={pro} value={pro}>{pro}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_registered">Not Registered</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_dispute">In Dispute</SelectItem>
                  <SelectItem value="needs_amending">Needs Amending</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={applyFilters} size="sm">
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>CWR Registration Status Tracker</CardTitle>
          <CardDescription>
            Track work registration status based on ACK responses from PROs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Title</TableHead>
                <TableHead>ISWC</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>PRO</TableHead>
                <TableHead>Registration Status</TableHead>
                <TableHead>Last Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <>
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.work_title}</TableCell>
                    <TableCell>{registration.iswc || 'N/A'}</TableCell>
                    <TableCell>{registration.submitted_by}</TableCell>
                    <TableCell>{format(new Date(registration.submission_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{registration.pro_name}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(registration.registration_status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {registration.last_response || 'No response yet'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {getActionButtons(registration)}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable Details Panel */}
                  {expandedDetails === registration.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <Collapsible open={true} onOpenChange={() => {}}>
                          <CollapsibleContent>
                            <div className="p-6 bg-muted/30 border-t space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Submission Details */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm">Submission Details</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">Sender Code:</span> {registration.sender_code}
                                    </div>
                                    <div>
                                      <span className="font-medium">PRO:</span> {registration.pro_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Work Title:</span> {registration.work_title}
                                    </div>
                                    <div>
                                      <span className="font-medium">ISWC:</span> {registration.iswc || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Submitted By:</span> {registration.submitted_by}
                                    </div>
                                    <div>
                                      <span className="font-medium">Submission Date:</span> {format(new Date(registration.submission_date), "MMM dd, yyyy")}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column - ACK Response Details */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm">ACK Response Details</h4>
                                  {registration.ack_data ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="font-medium">Response Code:</span> {registration.ack_data.response_code || 'N/A'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Received:</span> {format(new Date(registration.ack_data.received_at), "MMM dd, yyyy")}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <span className="font-medium text-sm">Response Message:</span>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {registration.ack_data.response_message || 'No message provided'}
                                        </p>
                                      </div>

                                      {/* Linked Records */}
                                      {registration.ack_data.linked_records && (
                                        <div>
                                          <span className="font-medium text-sm">Linked Records:</span>
                                          <div className="mt-1 space-y-1">
                                            {registration.ack_data.linked_records.swr?.length > 0 && (
                                              <div className="text-sm">
                                                <span className="font-medium">SWR:</span> {registration.ack_data.linked_records.swr.join(', ')}
                                              </div>
                                            )}
                                            {registration.ack_data.linked_records.pwr?.length > 0 && (
                                              <div className="text-sm">
                                                <span className="font-medium">PWR:</span> {registration.ack_data.linked_records.pwr.join(', ')}
                                              </div>
                                            )}
                                            {registration.ack_data.linked_records.nwr?.length > 0 && (
                                              <div className="text-sm">
                                                <span className="font-medium">NWR:</span> {registration.ack_data.linked_records.nwr.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Parsed ACK Response */}
                                      {registration.ack_data.parsed_data && (
                                        <div>
                                          <span className="font-medium text-sm">Parsed ACK Response:</span>
                                          <div className="mt-2 p-3 bg-background rounded border font-mono text-xs">
                                            <pre>{JSON.stringify(registration.ack_data.parsed_data, null, 2)}</pre>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      No ACK response received yet
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons Row */}
                              <div className="flex gap-2 pt-4 border-t">
                                <Button size="sm" variant="outline" onClick={() => regenerateCWRFile(registration.id)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Edit Metadata
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => regenerateCWRFile(registration.id)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Regenerate CWR
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => resendToPRO(registration.id)}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Resend to PRO
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No registration records found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};