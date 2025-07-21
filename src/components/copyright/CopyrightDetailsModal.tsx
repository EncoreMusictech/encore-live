import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { useCopyright, Copyright } from "@/hooks/useCopyright";
import { EnhancedCopyrightForm } from "./EnhancedCopyrightForm";
import { useToast } from "@/hooks/use-toast";

interface CopyrightDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  copyrightId: string | null;
}

export function CopyrightDetailsModal({ isOpen, onOpenChange, copyrightId }: CopyrightDetailsModalProps) {
  const [copyright, setCopyright] = useState<Copyright | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { copyrights, refetch } = useCopyright();
  const { toast } = useToast();

  // Fetch copyright details when modal opens
  useEffect(() => {
    if (isOpen && copyrightId) {
      setLoading(true);
      
      // First try to find in existing copyrights list
      const existingCopyright = copyrights.find(c => c.id === copyrightId);
      if (existingCopyright) {
        setCopyright(existingCopyright);
        setLoading(false);
      } else {
        // If not in list, refetch all copyrights to get the latest data
        refetch().then(() => {
          const foundCopyright = copyrights.find(c => c.id === copyrightId);
          setCopyright(foundCopyright || null);
          setLoading(false);
        });
      }
    }
  }, [isOpen, copyrightId, copyrights, refetch]);

  const handleClose = () => {
    setIsEditing(false);
    setCopyright(null);
    onOpenChange(false);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Copyright updated successfully",
    });
    // Refetch to get updated data
    refetch();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {copyright ? `Copyright Details: ${copyright.work_title}` : 'Copyright Details'}
            {copyright && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit copyright information' : 'View copyright details and metadata'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading copyright details...
          </div>
        ) : copyright ? (
          <div className="space-y-6">
            {isEditing ? (
              <EnhancedCopyrightForm
                editingCopyright={copyright}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            ) : (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Title</label>
                    <p className="text-lg font-semibold">{copyright.work_title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work ID</label>
                    <p>{copyright.work_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ISWC</label>
                    <p>{copyright.iswc || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="capitalize">{copyright.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Type</label>
                    <p className="capitalize">{copyright.work_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Language</label>
                    <p>{copyright.language_code}</p>
                  </div>
                </div>

                {/* Additional Info */}
                {copyright.album_title && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Album</label>
                    <p>{copyright.album_title}</p>
                  </div>
                )}
                
                {copyright.masters_ownership && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Masters Ownership</label>
                    <p>{copyright.masters_ownership}</p>
                  </div>
                )}

                {copyright.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="whitespace-pre-wrap">{copyright.notes}</p>
                  </div>
                )}

                {/* PRO Registration Status */}
                <div className="grid grid-cols-2 gap-4">
                  {copyright.ascap_work_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ASCAP Work ID</label>
                      <p>{copyright.ascap_work_id}</p>
                    </div>
                  )}
                  {copyright.bmi_work_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BMI Work ID</label>
                      <p>{copyright.bmi_work_id}</p>
                    </div>
                  )}
                  {copyright.socan_work_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SOCAN Work ID</label>
                      <p>{copyright.socan_work_id}</p>
                    </div>
                  )}
                  {copyright.sesac_work_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SESAC Work ID</label>
                      <p>{copyright.sesac_work_id}</p>
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <label className="font-medium">Created</label>
                    <p>{new Date(copyright.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="font-medium">Last Updated</label>
                    <p>{new Date(copyright.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Copyright not found
          </div>
        )}

        {!isEditing && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}