import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, PercentIcon, DollarSignIcon, MapPinIcon } from "lucide-react";
import { AgreementTerms, ContractWriter } from "@/hooks/useAgreementCalculation";

interface AgreementTermsPreviewProps {
  agreement: AgreementTerms | null;
  writers: ContractWriter[];
  calculationResult?: {
    commission_deduction: number;
    territory_adjustments: Record<string, number>;
  } | null;
}

export function AgreementTermsPreview({ agreement, writers, calculationResult }: AgreementTermsPreviewProps) {
  if (!agreement) return null;

  const controlledWriters = writers.filter(w => w.controlled);
  const uncontrolledWriters = writers.filter(w => !w.controlled);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Agreement Terms Preview</span>
          <Badge variant="outline">{agreement.title}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Terms */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <PercentIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Commission</p>
              <p className="text-sm text-muted-foreground">{agreement.commission_percentage || 0}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Advance</p>
              <p className="text-sm text-muted-foreground">${(agreement.advance_amount || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-muted-foreground">{agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-muted-foreground">{agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'Open'}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Writers Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Writer Allocations</h4>
          
          {controlledWriters.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Controlled Writers ({controlledWriters.length})</p>
              <div className="grid gap-2">
                {controlledWriters.map(writer => (
                  <div key={writer.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-900">{writer.name}</span>
                    <div className="flex gap-2 text-xs text-green-800">
                      <span>Perf: {writer.performance_percentage}%</span>
                      <span>Mech: {writer.mechanical_percentage}%</span>
                      <span>Sync: {writer.synch_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uncontrolledWriters.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-600 mb-2">Uncontrolled Writers ({uncontrolledWriters.length})</p>
              <div className="grid gap-2">
                {uncontrolledWriters.map(writer => (
                  <div key={writer.id} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                    <span className="text-sm font-medium text-amber-900">{writer.name}</span>
                    <div className="flex gap-2 text-xs text-amber-800">
                      <span>Perf: {writer.performance_percentage}%</span>
                      <span>Mech: {writer.mechanical_percentage}%</span>
                      <span>Sync: {writer.synch_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculation Results */}
        {calculationResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Calculation Results</h4>
              
              {calculationResult.commission_deduction > 0 && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm font-medium text-blue-900">Commission Deduction</span>
                  <span className="text-sm font-mono text-blue-900">${calculationResult.commission_deduction.toFixed(2)}</span>
                </div>
              )}
              
              {Object.keys(calculationResult.territory_adjustments).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    Territory Breakdown
                  </p>
                  <div className="grid gap-1">
                    {Object.entries(calculationResult.territory_adjustments).map(([territory, amount]) => (
                      <div key={territory} className="flex items-center justify-between p-1 text-xs text-foreground">
                        <span className="font-medium">{territory}</span>
                        <span className="font-mono">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}