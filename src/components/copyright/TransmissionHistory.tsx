import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, Download, Eye, Send, Upload, FileText, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TransmissionRecord {
  id: string;
  senderCode: string;
  fileName: string;
  type: "CWR" | "DDEX";
  dateSent: Date;
  status: "Sent" | "Failed" | "Acknowledged";
  recipient: string;
  recordCount: number;
  filePath: string;
  retryCount: number;
  logs: {
    timestamp: Date;
    message: string;
    level: "info" | "warning" | "error";
  }[];
}

// Mock data for demonstration
const mockTransmissions: TransmissionRecord[] = [
  {
    id: "1324081",
    senderCode: "ENCORMUS",
    fileName: "ENCORMUS_CWR_20250731.txt",
    type: "CWR",
    dateSent: new Date("2025-07-31"),
    status: "Sent",
    recipient: "ASCAP",
    recordCount: 1247,
    filePath: "/exports/cwr/ENCORMUS_CWR_20250731.txt",
    retryCount: 0,
    logs: [
      { timestamp: new Date("2025-07-31T10:30:00"), message: "File generated successfully", level: "info" },
      { timestamp: new Date("2025-07-31T10:31:00"), message: "Transmission initiated to ASCAP", level: "info" },
      { timestamp: new Date("2025-07-31T10:32:00"), message: "File sent successfully", level: "info" }
    ]
  },
  {
    id: "1324080",
    senderCode: "ENCORMUS",
    fileName: "ENCORMUS_DDEX_20250730.xml",
    type: "DDEX",
    dateSent: new Date("2025-07-30"),
    status: "Acknowledged",
    recipient: "BMI",
    recordCount: 892,
    filePath: "/exports/ddex/ENCORMUS_DDEX_20250730.xml",
    retryCount: 0,
    logs: [
      { timestamp: new Date("2025-07-30T14:15:00"), message: "File generated successfully", level: "info" },
      { timestamp: new Date("2025-07-30T14:16:00"), message: "Transmission initiated to BMI", level: "info" },
      { timestamp: new Date("2025-07-30T14:17:00"), message: "File sent successfully", level: "info" },
      { timestamp: new Date("2025-07-30T15:45:00"), message: "Acknowledgment received from BMI", level: "info" }
    ]
  },
  {
    id: "1324079",
    senderCode: "TESTCODE",
    fileName: "TESTCODE_CWR_20250729.txt",
    type: "CWR",
    dateSent: new Date("2025-07-29"),
    status: "Failed",
    recipient: "SOCAN",
    recordCount: 0,
    filePath: "/exports/cwr/TESTCODE_CWR_20250729.txt",
    retryCount: 2,
    logs: [
      { timestamp: new Date("2025-07-29T09:00:00"), message: "File generation started", level: "info" },
      { timestamp: new Date("2025-07-29T09:01:00"), message: "Validation error: Invalid sender code format", level: "error" },
      { timestamp: new Date("2025-07-29T09:30:00"), message: "Retry attempt 1 initiated", level: "info" },
      { timestamp: new Date("2025-07-29T09:31:00"), message: "Validation error: Invalid sender code format", level: "error" },
      { timestamp: new Date("2025-07-29T10:00:00"), message: "Retry attempt 2 initiated", level: "info" },
      { timestamp: new Date("2025-07-29T10:01:00"), message: "Validation error: Invalid sender code format", level: "error" }
    ]
  }
];

export const TransmissionHistory = () => {
  const { toast } = useToast();
  const [transmissions] = useState<TransmissionRecord[]>(mockTransmissions);
  const [filteredTransmissions, setFilteredTransmissions] = useState<TransmissionRecord[]>(mockTransmissions);
  const [selectedSenderCode, setSelectedSenderCode] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Get unique sender codes for filter dropdown
  const senderCodes = Array.from(new Set(transmissions.map(t => t.senderCode)));

  const applyFilters = () => {
    let filtered = transmissions;

    if (selectedSenderCode !== "all") {
      filtered = filtered.filter(t => t.senderCode === selectedSenderCode);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    if (dateFrom) {
      filtered = filtered.filter(t => t.dateSent >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(t => t.dateSent <= dateTo);
    }

    setFilteredTransmissions(filtered);
  };

  const clearFilters = () => {
    setSelectedSenderCode("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilteredTransmissions(transmissions);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sent":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Acknowledged":
        return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
      default:
        return "text-muted-foreground";
    }
  };

  const handleView = (transmission: TransmissionRecord) => {
    toast({
      title: "File Details",
      description: `Viewing ${transmission.fileName} - ${transmission.recordCount} records`
    });
  };

  const handleDownload = (transmission: TransmissionRecord) => {
    toast({
      title: "Download Started",
      description: `Downloading ${transmission.fileName}`
    });
  };

  const handleResend = (transmission: TransmissionRecord) => {
    toast({
      title: "Resending File",
      description: `Resending ${transmission.fileName} to ${transmission.recipient}`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File Selected",
        description: `Selected ${file.name} for manual upload`
      });
    }
  };

  const handleSubmitToTestServer = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Submitting to Test Server",
      description: `Uploading ${uploadedFile.name} to test environment`
    });
    
    // Reset the upload state
    setUploadedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Transmission Filters
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

            {/* Transmission Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CWR">CWR</SelectItem>
                  <SelectItem value="DDEX">DDEX</SelectItem>
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
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Acknowledged">Acknowledged</SelectItem>
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

      {/* Transmission History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transmission History</CardTitle>
          <CardDescription>
            View and manage your CWR and DDEX file transmission history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transmission ID</TableHead>
                <TableHead>Sender Code</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransmissions.map((transmission) => (
                <>
                  <TableRow key={transmission.id}>
                    <TableCell className="font-medium">{transmission.id}</TableCell>
                    <TableCell>{transmission.senderCode}</TableCell>
                    <TableCell>{transmission.fileName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transmission.type}</Badge>
                    </TableCell>
                    <TableCell>{format(transmission.dateSent, "MMM dd, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(transmission.status)}</TableCell>
                    <TableCell>{transmission.recipient}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(transmission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(transmission)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResend(transmission)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable Log Panel */}
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <Collapsible 
                        open={expandedLogs === transmission.id} 
                        onOpenChange={(open) => setExpandedLogs(open ? transmission.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 rounded-none border-t"
                          >
                            <ChevronDown className={cn(
                              "w-4 h-4 mr-2 transition-transform",
                              expandedLogs === transmission.id && "rotate-180"
                            )} />
                            {expandedLogs === transmission.id ? 'Hide' : 'Show'} Transmission Logs
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 bg-muted/30 border-t">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                              <div>
                                <span className="font-medium">Records:</span> {transmission.recordCount}
                              </div>
                              <div>
                                <span className="font-medium">File Path:</span> {transmission.filePath}
                              </div>
                              <div>
                                <span className="font-medium">Retry Count:</span> {transmission.retryCount}
                              </div>
                              <div>
                                <span className="font-medium">Log Entries:</span> {transmission.logs.length}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Transmission Log:</h4>
                              <div className="bg-background rounded border p-3 max-h-40 overflow-y-auto">
                                {transmission.logs.map((log, index) => (
                                  <div key={index} className="flex gap-4 text-sm py-1">
                                    <span className="text-muted-foreground min-w-0 flex-shrink-0">
                                      {format(log.timestamp, "HH:mm:ss")}
                                    </span>
                                    <span className={cn("font-mono", getLogLevelColor(log.level))}>
                                      {log.message}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
          
          {filteredTransmissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transmission records found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Manual Upload (Testing)
          </CardTitle>
          <CardDescription>
            Upload CWR or DDEX files manually for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Manual CWR File Upload</label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                accept=".txt,.xml"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload CWR or DDEX file
                </p>
                <p className="text-xs text-muted-foreground">
                  .txt or .xml files only
                </p>
              </label>
            </div>
            {uploadedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSubmitToTestServer}
            disabled={!uploadedFile}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit to Test Server
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};