import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SyncLicense } from "@/hooks/useSyncLicenses";

interface SyncLicenseDetailsProps {
  license: SyncLicense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SyncLicenseDetails = ({ license, open, onOpenChange }: SyncLicenseDetailsProps) => {
  if (!license) return null;

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
          <DialogTitle className="flex items-center gap-2">
            {license.synch_id} - {license.project_title}
            <Badge className={getStatusColor(license.synch_status)}>
              {license.synch_status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Sync licensing details and current status
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">Request Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync Agent:</span>
                  <span>{license.synch_agent || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Media Type:</span>
                  <span>{license.media_type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request Received:</span>
                  <span>{formatDate(license.request_received)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>{license.source || "-"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Deal Terms</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Territory:</span>
                  <span>{license.territory_of_licensee || "-"}</span>
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
                  <span className="text-muted-foreground">Music Type:</span>
                  <span>{license.music_type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Music Use:</span>
                  <span>{license.music_use || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMPTE:</span>
                  <span>{license.smpte || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">Financial Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publishing Fee:</span>
                  <span>{formatCurrency(license.pub_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Master Fee:</span>
                  <span>{formatCurrency(license.master_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fee:</span>
                  <span className="font-semibold">
                    {formatCurrency((license.pub_fee || 0) + (license.master_fee || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoiced Amount:</span>
                  <span>{formatCurrency(license.invoiced_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>{license.currency}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Status & Approval</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Status:</span>
                  <Badge variant="outline">{license.license_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Status:</span>
                  <Badge variant="outline">{license.invoice_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge 
                    variant={license.payment_status === "Paid in Full" ? "default" : "secondary"}
                  >
                    {license.payment_status}
                  </Badge>
                </div>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FE License Returned:</span>
                  <span>{license.fe_license_returned ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MFN:</span>
                  <span>{license.mfn ? "Yes" : "No"}</span>
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