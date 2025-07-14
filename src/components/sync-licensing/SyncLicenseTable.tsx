import { useState } from "react";
import { format } from "date-fns";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncLicense, useDeleteSyncLicense } from "@/hooks/useSyncLicenses";
import { SyncLicenseForm } from "./SyncLicenseForm";
import { SyncLicenseDetails } from "./SyncLicenseDetails";

interface SyncLicenseTableProps {
  licenses: SyncLicense[];
  isLoading: boolean;
}

export const SyncLicenseTable = ({ licenses, isLoading }: SyncLicenseTableProps) => {
  const [editingLicense, setEditingLicense] = useState<SyncLicense | null>(null);
  const [viewingLicense, setViewingLicense] = useState<SyncLicense | null>(null);
  const deleteMutation = useDeleteSyncLicense();

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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sync license?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading sync licenses...</div>;
  }

  if (licenses.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No sync licenses found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first sync request to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sync ID</TableHead>
              <TableHead>Project Title</TableHead>
              <TableHead>Media Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Fee</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-medium">{license.synch_id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{license.project_title}</div>
                    {license.synch_agent && (
                      <div className="text-sm text-muted-foreground">
                        Agent: {license.synch_agent}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {license.media_type && (
                    <Badge variant="outline">{license.media_type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(license.synch_status)}>
                    {license.synch_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatCurrency(
                    (license.pub_fee || 0) + (license.master_fee || 0)
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={license.payment_status === "Paid in Full" ? "default" : "secondary"}
                  >
                    {license.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(license.request_received)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingLicense(license)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLicense(license)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(license.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit License Form */}
      <SyncLicenseForm
        open={!!editingLicense}
        onOpenChange={(open) => !open && setEditingLicense(null)}
        license={editingLicense}
      />

      {/* View License Details */}
      <SyncLicenseDetails
        license={viewingLicense}
        open={!!viewingLicense}
        onOpenChange={(open) => !open && setViewingLicense(null)}
      />
    </>
  );
};