import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status?: "pending" | "active" | "completed";
}

interface WorkflowDiagramProps {
  title: string;
  steps: WorkflowStep[];
  variant?: "horizontal" | "vertical";
  compact?: boolean;
}

export const WorkflowDiagram = ({
  title,
  steps,
  variant = "horizontal",
  compact = false
}: WorkflowDiagramProps) => {
  const isHorizontal = variant === "horizontal";

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      
      <div
        className={cn(
          "flex gap-2 p-4 bg-muted/30 rounded-lg overflow-x-auto",
          isHorizontal ? "flex-row items-center" : "flex-col items-stretch"
        )}
      >
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-row" : "flex-col"
            )}
          >
            {/* Step Node */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 bg-card transition-colors",
                compact ? "px-3 py-2" : "px-4 py-3",
                step.status === "active" && "border-primary bg-primary/10",
                step.status === "completed" && "border-green-500 bg-green-500/10",
                step.status === "pending" && "border-muted-foreground/30",
                !step.status && "border-border"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                  step.status === "active" && "bg-primary text-primary-foreground",
                  step.status === "completed" && "bg-green-500 text-white",
                  step.status === "pending" && "bg-muted-foreground/30 text-muted-foreground",
                  !step.status && "bg-primary/20 text-primary"
                )}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  step.status === "pending" && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {step.description && !compact && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-32 truncate">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Arrow to next step */}
            {index < steps.length - 1 && (
              <div className={cn(
                "flex items-center justify-center text-muted-foreground/50",
                isHorizontal ? "px-2" : "py-2"
              )}>
                {isHorizontal ? (
                  <ArrowRight className="h-5 w-5" />
                ) : (
                  <ArrowDown className="h-5 w-5" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Pre-defined workflow diagrams for common processes
export const StatementImportWorkflow = () => (
  <WorkflowDiagram
    title="Statement Import Process"
    steps={[
      { id: "upload", label: "Upload File", description: "CSV/Excel" },
      { id: "detect", label: "Source Detection", description: "Auto-identify" },
      { id: "map", label: "Field Mapping", description: "Match columns" },
      { id: "validate", label: "Validation", description: "Check errors" },
      { id: "save", label: "Save to Staging", description: "Ready to process" }
    ]}
    variant="horizontal"
    compact
  />
);

export const BatchProcessingWorkflow = () => (
  <WorkflowDiagram
    title="Batch Processing Flow"
    steps={[
      { id: "create", label: "Create Batch" },
      { id: "import", label: "Import Statements" },
      { id: "match", label: "Match Songs" },
      { id: "allocate", label: "Allocate Splits" },
      { id: "process", label: "Process Batch" },
      { id: "payout", label: "Generate Payouts" }
    ]}
    variant="horizontal"
    compact
  />
);

export const PayoutStatusWorkflow = () => (
  <WorkflowDiagram
    title="Payout Status Lifecycle"
    steps={[
      { id: "pending", label: "Pending", status: "completed" },
      { id: "approved", label: "Approved", status: "active" },
      { id: "processing", label: "Processing", status: "pending" },
      { id: "paid", label: "Paid", status: "pending" }
    ]}
    variant="horizontal"
    compact
  />
);

export const RecoupmentWorkflow = () => (
  <WorkflowDiagram
    title="Expense Recoupment Cycle"
    steps={[
      { id: "create", label: "Create Expense" },
      { id: "link", label: "Link to Payee" },
      { id: "apply", label: "Apply to Earnings" },
      { id: "track", label: "Track Balance" },
      { id: "recouped", label: "Fully Recouped" }
    ]}
    variant="horizontal"
    compact
  />
);
