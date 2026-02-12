import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Archive,
  FileSpreadsheet,
  Library,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  committed: { icon: <CheckCircle2 className="h-3 w-3" />, variant: "default" },
  validated: { icon: <Clock className="h-3 w-3" />, variant: "secondary" },
  processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: "outline" },
  failed: { icon: <XCircle className="h-3 w-3" />, variant: "destructive" },
};

export function CatalogReviewCenter() {
  return (
    <Tabs defaultValue="batches" className="space-y-4">
      <TabsList>
        <TabsTrigger value="batches" className="gap-1.5">
          <Archive className="h-4 w-4" /> Import Batches
        </TabsTrigger>
        <TabsTrigger value="staging" className="gap-1.5">
          <FileSpreadsheet className="h-4 w-4" /> Staging Rows
        </TabsTrigger>
        <TabsTrigger value="catalog" className="gap-1.5">
          <Library className="h-4 w-4" /> Catalog Works
        </TabsTrigger>
      </TabsList>

      <TabsContent value="batches">
        <BatchesTab />
      </TabsContent>
      <TabsContent value="staging">
        <StagingTab />
      </TabsContent>
      <TabsContent value="catalog">
        <CatalogWorksTab />
      </TabsContent>
    </Tabs>
  );
}

// ── Batches Tab ─────────────────────────────────────────────

function BatchesTab() {
  const queryClient = useQueryClient();

  const { data: batches, isLoading } = useQuery({
    queryKey: ["catalog-import-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_import_batches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      // Delete staging rows first (FK constraint)
      const { error: stagingErr } = await supabase
        .from("catalog_import_staging")
        .delete()
        .eq("import_batch_id", batchId);
      if (stagingErr) throw stagingErr;

      // Delete catalog works linked to this batch
      const { error: worksErr } = await supabase
        .from("catalog_works")
        .delete()
        .eq("import_batch_id", batchId);
      if (worksErr) throw worksErr;

      // Delete the batch itself
      const { error } = await supabase
        .from("catalog_import_batches")
        .delete()
        .eq("id", batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-import-batches-for-staging"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-staging-rows"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-works"] });
      toast.success("Batch and associated data deleted");
    },
    onError: (err: Error) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  if (isLoading) return <LoadingCard label="Loading batches…" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Import Batches ({batches?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!batches?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No import batches yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Valid</TableHead>
                  <TableHead className="text-right">Duplicates</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.processing;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {b.file_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          {cfg.icon} {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{b.total_rows}</TableCell>
                      <TableCell className="text-right text-green-600">{b.valid_rows}</TableCell>
                      <TableCell className="text-right text-yellow-600">{b.duplicate_rows}</TableCell>
                      <TableCell className="text-right text-red-600">{b.error_rows}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(b.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>
                        <DeleteConfirmDialog
                          title="Delete Import Batch"
                          description={`This will permanently delete "${b.file_name}" along with all its staging rows and any catalog works promoted from it.`}
                          onConfirm={() => deleteBatch.mutate(b.id)}
                          isPending={deleteBatch.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Staging Tab ─────────────────────────────────────────────

function StagingTab() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const { data: batches } = useQuery({
    queryKey: ["catalog-import-batches-for-staging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_import_batches")
        .select("id, file_name, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stagingRows, isLoading } = useQuery({
    queryKey: ["catalog-staging-rows", selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const { data, error } = await supabase
        .from("catalog_import_staging")
        .select("*")
        .eq("import_batch_id", selectedBatchId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBatchId,
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "valid": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error": return <XCircle className="h-4 w-4 text-red-600" />;
      case "duplicate": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Staging Rows
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {batches?.map((b) => (
            <Button
              key={b.id}
              size="sm"
              variant={selectedBatchId === b.id ? "default" : "outline"}
              onClick={() => setSelectedBatchId(b.id)}
            >
              {b.file_name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {b.status}
              </Badge>
            </Button>
          ))}
          {!batches?.length && (
            <p className="text-sm text-muted-foreground">No batches available.</p>
          )}
        </div>

        {selectedBatchId && (
          isLoading ? (
            <LoadingCard label="Loading staging rows…" />
          ) : !stagingRows?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No staging rows for this batch.</p>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Work Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>ISRC</TableHead>
                    <TableHead>ISWC</TableHead>
                    <TableHead>Promoted</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagingRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{statusIcon(row.validation_status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.source_sheet}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.work_title}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{row.artist_name}</TableCell>
                      <TableCell className="text-xs font-mono">{row.isrc || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{row.iswc || "—"}</TableCell>
                      <TableCell>
                        {row.promoted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                        {Array.isArray(row.validation_errors) 
                          ? (row.validation_errors as string[]).join("; ") 
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ── Catalog Works Tab ───────────────────────────────────────

function CatalogWorksTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: works, isLoading } = useQuery({
    queryKey: ["catalog-works"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_works")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const deleteWork = useMutation({
    mutationFn: async (workId: string) => {
      // Delete contributors linked to this work first
      const { error: contribErr } = await supabase
        .from("catalog_work_contributors")
        .delete()
        .eq("catalog_work_id", workId);
      if (contribErr) throw contribErr;

      const { error } = await supabase
        .from("catalog_works")
        .delete()
        .eq("id", workId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-works"] });
      toast.success("Work removed from catalog");
    },
    onError: (err: Error) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  if (isLoading) return <LoadingCard label="Loading catalog works…" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="h-5 w-5" />
          Catalog Works ({works?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!works?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No works in the catalog yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>ISWC</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((w) => (
                  <>
                    <TableRow
                      key={w.id}
                      className="cursor-pointer"
                      onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                    >
                      <TableCell>
                        {expanded === w.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {w.work_title}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{w.artist_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{w.source}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{w.isrc || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{w.iswc || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(w.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DeleteConfirmDialog
                            title="Delete Catalog Work"
                            description={`Permanently remove "${w.work_title}" from the Golden Master catalog? This also removes linked contributor splits.`}
                            onConfirm={() => deleteWork.mutate(w.id)}
                            isPending={deleteWork.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded === w.id && (
                      <TableRow key={`${w.id}-detail`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Album</p>
                              <p>{w.album_title || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MusicBrainz ID</p>
                              <p className="font-mono text-xs">{w.musicbrainz_id || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">ASCAP Work ID</p>
                              <p className="font-mono text-xs">{w.ascap_work_id || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">BMI Work ID</p>
                              <p className="font-mono text-xs">{w.bmi_work_id || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MLC Work ID</p>
                              <p className="font-mono text-xs">{w.mlc_work_id || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Normalized Title</p>
                              <p className="font-mono text-xs">{w.normalized_title || "—"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">PRO Registrations</p>
                              <p className="text-xs">
                                {Array.isArray(w.pro_registrations) && w.pro_registrations.length > 0
                                  ? JSON.stringify(w.pro_registrations)
                                  : "None"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared ──────────────────────────────────────────────────

function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  isPending,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> {label}
      </CardContent>
    </Card>
  );
}
