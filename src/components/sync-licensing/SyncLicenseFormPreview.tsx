import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import { SyncLicense, useGenerateSyncLicensePDF } from "@/hooks/useSyncLicenses";
import { format } from "date-fns";

interface SyncLicenseFormPreviewProps {
  license: SyncLicense;
}

export const SyncLicenseFormPreview = ({ license }: SyncLicenseFormPreviewProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatePDF = useGenerateSyncLicensePDF();

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: license.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const calculateTotalControlledAmount = (license: any) => {
    if (!license.fee_allocations || !Array.isArray(license.fee_allocations)) {
      return 0;
    }
    return license.fee_allocations.reduce((total: number, allocation: any) => {
      return total + (allocation.controlledAmount || 0);
    }, 0);
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF.mutateAsync(license.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const getCompletionScore = () => {
    const requiredFields = [
      license.project_title,
      license.media_type,
      license.pub_fee || license.master_fee,
      license.territory_of_licensee,
      license.term_start,
      license.term_end
    ];
    
    const optionalFields = [
      license.production_company,
      license.master_owner,
      license.publishing_administrator,
      license.usage_description,
      license.delivery_format
    ];
    
    const requiredScore = requiredFields.filter(Boolean).length / requiredFields.length;
    const optionalScore = optionalFields.filter(Boolean).length / optionalFields.length;
    
    return Math.round((requiredScore * 0.7 + optionalScore * 0.3) * 100);
  };

  const completionScore = getCompletionScore();
  const isReadyForPDF = completionScore >= 70;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">License Agreement Preview</h2>
          <p className="text-muted-foreground">
            Review the license details before generating the agreement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Completion</div>
            <Badge variant={isReadyForPDF ? "default" : "secondary"}>
              {completionScore}%
            </Badge>
          </div>
          <Button
            onClick={handleGeneratePDF}
            disabled={!isReadyForPDF || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {!isReadyForPDF && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Incomplete Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Please complete more fields to generate a comprehensive license agreement. 
              At minimum, ensure you have project title, media type, fees, territory, and term dates.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">License ID:</span>
              <div className="text-muted-foreground">{license.synch_id}</div>
            </div>
            <div>
              <span className="font-medium">Project Title:</span>
              <div className="text-muted-foreground">{license.project_title}</div>
            </div>
            <div>
              <span className="font-medium">Media Type:</span>
              <div className="text-muted-foreground">{license.media_type || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Sync Agent:</span>
              <div className="text-muted-foreground">{license.synch_agent || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge variant="outline">{license.synch_status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Publishing Fee:</span>
              <div className="text-muted-foreground">{formatCurrency(license.pub_fee)}</div>
            </div>
            <div>
              <span className="font-medium">Master Fee:</span>
              <div className="text-muted-foreground">{formatCurrency(license.master_fee)}</div>
            </div>
            <div>
              <span className="font-medium">Total Fee:</span>
              <div className="font-semibold text-lg">
                {formatCurrency(calculateTotalControlledAmount(license))}
              </div>
            </div>
            <div>
              <span className="font-medium">Currency:</span>
              <div className="text-muted-foreground">{license.currency}</div>
            </div>
            {license.backend_royalty_rate && (
              <div>
                <span className="font-medium">Backend Royalty:</span>
                <div className="text-muted-foreground">{license.backend_royalty_rate}%</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Territory and Term */}
        <Card>
          <CardHeader>
            <CardTitle>Territory & Term</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Territory:</span>
              <div className="text-muted-foreground">{license.territory_of_licensee || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Term Start:</span>
              <div className="text-muted-foreground">{formatDate(license.term_start)}</div>
            </div>
            <div>
              <span className="font-medium">Term End:</span>
              <div className="text-muted-foreground">{formatDate(license.term_end)}</div>
            </div>
            <div>
              <span className="font-medium">Exclusive:</span>
              <div className="text-muted-foreground">{license.exclusive_license ? "Yes" : "No"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Production Details */}
        <Card>
          <CardHeader>
            <CardTitle>Production Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Production Company:</span>
              <div className="text-muted-foreground">{license.production_company || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Production Budget:</span>
              <div className="text-muted-foreground">
                {license.production_budget ? formatCurrency(license.production_budget) : "Not specified"}
              </div>
            </div>
            <div>
              <span className="font-medium">Expected Audience:</span>
              <div className="text-muted-foreground">
                {license.expected_audience_size ? license.expected_audience_size.toLocaleString() : "Not specified"}
              </div>
            </div>
            <div>
              <span className="font-medium">Content Rating:</span>
              <div className="text-muted-foreground">{license.content_rating || "Not specified"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Music Type:</span>
              <div className="text-muted-foreground">{license.music_type || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Music Use:</span>
              <div className="text-muted-foreground">{license.music_use || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Usage Description:</span>
              <div className="text-muted-foreground">{license.usage_description || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Duration:</span>
              <div className="text-muted-foreground">
                {license.usage_duration_seconds ? `${license.usage_duration_seconds} seconds` : "Not specified"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {license.promotional_usage && <Badge variant="secondary">Promotional</Badge>}
              {license.festival_usage && <Badge variant="secondary">Festival</Badge>}
              {license.trailer_usage && <Badge variant="secondary">Trailer</Badge>}
              {license.advertising_usage && <Badge variant="secondary">Advertising</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Rights Holders */}
        <Card>
          <CardHeader>
            <CardTitle>Rights Holders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Master Owner:</span>
              <div className="text-muted-foreground">{license.master_owner || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Master Owner Contact:</span>
              <div className="text-muted-foreground">{license.master_owner_contact || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Publishing Administrator:</span>
              <div className="text-muted-foreground">{license.publishing_administrator || "Not specified"}</div>
            </div>
            <div>
              <span className="font-medium">Publishing Admin Contact:</span>
              <div className="text-muted-foreground">{license.publishing_admin_contact || "Not specified"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {license.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-muted-foreground">
              {license.notes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};