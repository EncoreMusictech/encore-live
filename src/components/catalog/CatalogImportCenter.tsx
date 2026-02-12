import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Database,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCatalogImport } from "@/hooks/useCatalogImport";
import type { StagingRow } from "@/lib/catalog-validation";

const SHEET_TYPE_LABELS: Record<string, string> = {
  musicbrainz_works: "MusicBrainz Works",
  musicbrainz_recordings: "MusicBrainz Recordings",
  ascap_bmi_songview: "ASCAP / BMI Songview",
  mlc_catalog: "MLC Catalog",
  sync: "TV / Movie / Game Sync",
  unknown: "Unknown Format",
};

export function CatalogImportCenter() {
  const {
    step,
    sheets,
    stagingRows,
    batch,
    progress,
    isProcessing,
    parseFile,
    normalizeAll,
    insertStaging,
    promoteBatch,
    reset,
    updateStagingRow,
    setStep,
  } = useCatalogImport();

  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        setFileName(accepted[0].name);
        parseFile(accepted[0]);
      }
    },
    [parseFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const stats = useMemo(() => {
    const valid = stagingRows.filter((r) => r.validation_status === "valid").length;
    const errors = stagingRows.filter((r) => r.validation_status === "error").length;
    const duplicates = stagingRows.filter((r) => r.validation_status === "duplicate").length;
    return { valid, errors, duplicates, total: stagingRows.length };
  }, [stagingRows]);

  const steps = [
    { key: "upload", label: "Upload", num: 1 },
    { key: "map", label: "Map & Normalize", num: 2 },
    { key: "review", label: "Review & Resolve", num: 3 },
    { key: "commit", label: "Commit", num: 4 },
  ] as const;

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                i <= currentStepIdx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentStepIdx ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                s.num
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                i <= currentStepIdx ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Research Workbook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">
                {isDragActive ? "Drop your workbook here" : "Drag & drop an XLSX workbook"}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: MusicBrainz Works, MusicBrainz Recordings, ASCAP/BMI Songview, MLC Catalog, Sync
              </p>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Parsing workbook…
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map & Normalize */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Detected Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sheets.map((sheet) => (
              <div key={sheet.sheetName} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{sheet.sheetName}</h4>
                    <Badge variant={sheet.sheetType === "unknown" ? "destructive" : "secondary"}>
                      {SHEET_TYPE_LABELS[sheet.sheetType] || sheet.sheetType}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{sheet.rowCount} rows</span>
                </div>

                {/* Header preview */}
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="border-b">
                        {sheet.headers.slice(0, 8).map((h) => (
                          <th key={h} className="px-2 py-1 text-left font-medium text-muted-foreground">
                            {h}
                          </th>
                        ))}
                        {sheet.headers.length > 8 && (
                          <th className="px-2 py-1 text-muted-foreground">+{sheet.headers.length - 8} more</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.rows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-b">
                          {sheet.headers.slice(0, 8).map((h) => (
                            <td key={h} className="px-2 py-1 truncate max-w-[150px]">
                              {String(row[h] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => { reset(); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={normalizeAll} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-1" />
                )}
                Normalize All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Resolve */}
      {step === "review" && (
        <ReviewStep
          stagingRows={stagingRows}
          stats={stats}
          isProcessing={isProcessing}
          onBack={() => setStep("map")}
          onCommit={() => insertStaging(fileName)}
          onUpdateRow={updateStagingRow}
        />
      )}

      {/* Step 4: Commit */}
      {step === "commit" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Commit to Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {batch && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{batch.total_rows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{batch.valid_rows}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{batch.duplicate_rows}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{batch.error_rows}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
            )}

            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress.phase}</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />
              </div>
            )}

            {batch?.status === "committed" ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                <h3 className="text-lg font-semibold">Catalog Updated</h3>
                <p className="text-sm text-muted-foreground">
                  {batch.valid_rows} works have been promoted to the centralized catalog.
                </p>
                <Button onClick={reset}>Import Another Workbook</Button>
              </div>
            ) : (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("review")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Review
                </Button>
                <Button onClick={promoteBatch} disabled={isProcessing || !batch}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-1" />
                  )}
                  Commit to Catalog
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Review Sub-component ────────────────────────────────────

interface ReviewStepProps {
  stagingRows: StagingRow[];
  stats: { valid: number; errors: number; duplicates: number; total: number };
  isProcessing: boolean;
  onBack: () => void;
  onCommit: () => void;
  onUpdateRow: (index: number, updates: Partial<StagingRow>) => void;
}

function ReviewStep({ stagingRows, stats, isProcessing, onBack, onCommit, onUpdateRow }: ReviewStepProps) {
  const [filter, setFilter] = useState<"all" | "valid" | "error" | "duplicate">("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? stagingRows
        : stagingRows.filter((r) => r.validation_status === filter),
    [stagingRows, filter]
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "duplicate":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Review & Resolve</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary bar */}
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary">{stats.total} total</Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{stats.valid} valid</Badge>
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{stats.errors} errors</Badge>
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{stats.duplicates} duplicates</Badge>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="valid">Valid ({stats.valid})</TabsTrigger>
            <TabsTrigger value="error">Errors ({stats.errors})</TabsTrigger>
            <TabsTrigger value="duplicate">Duplicates ({stats.duplicates})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Work Title</th>
                <th className="px-3 py-2 text-left">Artist</th>
                <th className="px-3 py-2 text-left">ISRC</th>
                <th className="px-3 py-2 text-left">ISWC</th>
                <th className="px-3 py-2 text-left">Issues</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((row, i) => {
                const realIdx = stagingRows.indexOf(row);
                return (
                  <tr key={i} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2">{statusIcon(row.validation_status)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs">
                        {SHEET_TYPE_LABELS[row.source_sheet] || row.source_sheet}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{row.work_title}</td>
                    <td className="px-3 py-2 max-w-[150px] truncate">{row.artist_name}</td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-7 text-xs w-[130px]"
                        value={row.isrc || ""}
                        onChange={(e) =>
                          onUpdateRow(realIdx, { isrc: e.target.value || null })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-7 text-xs w-[130px]"
                        value={row.iswc || ""}
                        onChange={(e) =>
                          onUpdateRow(realIdx, { iswc: e.target.value || null })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-red-600 max-w-[200px] truncate">
                      {row.validation_errors.join("; ")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    No rows match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground">Showing first 200 of {filtered.length} rows</p>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={onCommit} disabled={isProcessing || stats.valid === 0}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-1" />
            )}
            Stage {stats.valid} Valid Rows
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
