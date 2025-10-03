import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Settings } from "lucide-react";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SourceMappingManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceMappingManager({ open, onOpenChange }: SourceMappingManagerProps) {
  const { mappingConfigs } = useRoyaltiesImport();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const customSources = mappingConfigs?.filter(
    config => !['BMI', 'ASCAP', 'YouTube', 'SoundExchange'].includes(config.source_name)
  ) || [];

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('source_mapping_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Source Deleted",
        description: "Custom source mapping has been removed.",
      });

      // Refresh will happen automatically via real-time subscription
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete source mapping',
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Custom Sources
            </DialogTitle>
            <DialogDescription>
              View and remove custom statement sources
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {customSources.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No custom sources saved yet. Create one by selecting "Custom/Other" when importing a statement.
              </p>
            ) : (
              customSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{source.source_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.header_patterns?.length || 0} header patterns
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Custom</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this custom source mapping. You can always recreate it by importing a statement with "Custom/Other" selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
