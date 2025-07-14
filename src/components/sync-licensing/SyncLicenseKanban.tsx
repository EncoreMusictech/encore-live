// Simple kanban without drag and drop for now
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncLicense, useUpdateSyncLicense } from "@/hooks/useSyncLicenses";
import { format } from "date-fns";

interface SyncLicenseKanbanProps {
  licenses: SyncLicense[];
  isLoading: boolean;
}

const statusColumns = [
  { id: "Inquiry", title: "Inquiry", color: "bg-blue-100 text-blue-800" },
  { id: "Negotiating", title: "Negotiating", color: "bg-yellow-100 text-yellow-800" },
  { id: "Approved", title: "Approved", color: "bg-green-100 text-green-800" },
  { id: "Licensed", title: "Licensed", color: "bg-purple-100 text-purple-800" },
  { id: "Declined", title: "Declined", color: "bg-red-100 text-red-800" },
];

export const SyncLicenseKanban = ({ licenses, isLoading }: SyncLicenseKanbanProps) => {
  const updateMutation = useUpdateSyncLicense();

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd");
  };

  // Simple kanban view without drag and drop for now

  if (isLoading) {
    return <div className="text-center p-8">Loading kanban view...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusColumns.map((column) => {
        const columnLicenses = licenses.filter(license => license.synch_status === column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {columnLicenses.length}
              </Badge>
            </div>
            
            <div className="min-h-[400px] p-2 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="space-y-3">
                {columnLicenses.map((license) => (
                  <Card key={license.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {license.project_title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs ml-2">
                          {license.synch_id}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-xs">
                        {license.media_type && (
                          <Badge variant="secondary" className="text-xs">
                            {license.media_type}
                          </Badge>
                        )}
                        
                        {license.synch_agent && (
                          <div className="text-muted-foreground">
                            Agent: {license.synch_agent}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Fee:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              (license.pub_fee || 0) + (license.master_fee || 0)
                            )}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Received:</span>
                          <span>{formatDate(license.request_received)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Payment:</span>
                          <Badge 
                            variant={license.payment_status === "Paid in Full" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {license.payment_status === "Paid in Full" ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};