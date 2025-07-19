import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { SyncLicense, useGenerateSyncLicensePDF } from "@/hooks/useSyncLicenses";

interface SyncLicenseDetailsProps {
  license: SyncLicense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SyncLicenseDetails = ({ license, open, onOpenChange }: SyncLicenseDetailsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatePDF = useGenerateSyncLicensePDF();
  
  if (!license) return null;

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF.mutateAsync(license.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: license.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Inquiry":
        return "bg-blue-100 text-blue-800";
      case "Negotiating":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "Licensed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {license.synch_id} - {license.project_title}
                <Badge className={getStatusColor(license.synch_status)}>
                  {license.synch_status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Sync licensing details and current status
              </DialogDescription>
            </div>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Agreement
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Contract Summary Overview */}
        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">Contract Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency((license.pub_fee || 0) + (license.master_fee || 0))}</div>
              <div className="text-sm text-muted-foreground">Total License Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{license.territory_of_licensee || "Worldwide"}</div>
              <div className="text-sm text-muted-foreground">Territory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {license.term_start && license.term_end 
                  ? `${Math.ceil((new Date(license.term_end).getTime() - new Date(license.term_start).getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                  : "Perpetual"
                }
              </div>
              <div className="text-sm text-muted-foreground">License Term</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">Project Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Title:</span>
                  <span className="font-medium">{license.project_title || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Media Type:</span>
                  <span>{license.media_type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Music Type:</span>
                  <span>{license.music_type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Music Use:</span>
                  <span>{license.music_use || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMPTE Timing:</span>
                  <span>{license.smpte || "-"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">License Terms</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Territory:</span>
                  <span>{license.territory_of_licensee || "Worldwide"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term Start:</span>
                  <span>{formatDate(license.term_start)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term End:</span>
                  <span>{formatDate(license.term_end)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MFN Clause:</span>
                  <span>{license.mfn ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FE License Required:</span>
                  <span>{license.fe_license_returned ? "Returned" : "Pending"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync Agent:</span>
                  <span>{license.synch_agent || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>{license.source || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request Received:</span>
                  <span>{formatDate(license.request_received)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">Financial Terms</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publishing Fee:</span>
                  <span className="font-medium">{formatCurrency(license.pub_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Master Fee:</span>
                  <span className="font-medium">{formatCurrency(license.master_fee)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground font-medium">Total License Fee:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency((license.pub_fee || 0) + (license.master_fee || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>{license.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Invoiced:</span>
                  <span>{formatCurrency(license.invoiced_amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Contract Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Overall Status:</span>
                  <Badge className={getStatusColor(license.synch_status)}>
                    {license.synch_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">License Status:</span>
                  <Badge variant="outline">{license.license_status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoice Status:</span>
                  <Badge variant="outline">{license.invoice_status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge 
                    variant={license.payment_status === "Paid in Full" ? "default" : "secondary"}
                  >
                    {license.payment_status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Key Dates</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approval Issued:</span>
                  <span>{formatDate(license.approval_issued)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Issued:</span>
                  <span>{formatDate(license.license_issued)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Received:</span>
                  <span>{formatDate(license.payment_received)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {license.notes && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-3">Notes</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{license.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground border-t pt-4">
          <div className="flex justify-between">
            <span>Created: {formatDate(license.created_at)}</span>
            <span>Updated: {formatDate(license.updated_at)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};