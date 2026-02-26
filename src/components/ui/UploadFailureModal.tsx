import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, FileWarning, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeUploadFailure, clearUploadFailure } from "@/hooks/useUploadFailureModal";

type FailureDetails = {
  title: string;
  source: string;
  errorMessage: string;
  details?: Record<string, any>;
  timestamp: string;
};

export function UploadFailureModal() {
  const [failure, setFailure] = useState<FailureDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return subscribeUploadFailure(setFailure);
  }, []);

  const handleCopy = () => {
    if (!failure) return;
    const text = JSON.stringify(failure, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!failure} onOpenChange={(open) => { if (!open) clearUploadFailure(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Upload Failed
          </DialogTitle>
          <DialogDescription>
            {failure?.title || "An error occurred during the upload process."}
          </DialogDescription>
        </DialogHeader>

        {failure && (
          <div className="space-y-4">
            {/* Source & Time */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <FileWarning className="h-3 w-3" />
                {failure.source}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {new Date(failure.timestamp).toLocaleTimeString()}
              </Badge>
            </div>

            {/* Error Message */}
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium text-destructive">Error Message</p>
              <p className="text-sm mt-1">{failure.errorMessage}</p>
            </div>

            {/* Technical Details */}
            {failure.details && Object.keys(failure.details).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Technical Details</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-48 rounded-md border bg-muted/50 p-3">
                  <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(failure.details, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
