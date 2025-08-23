import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle, 
  FileDown, 
  Shield, 
  Upload, 
  Zap, 
  X,
  Info,
  Settings
} from 'lucide-react';
import { useExportValidation } from '@/hooks/useExportValidation';
import { useCopyrightExports } from '@/hooks/useCopyrightExports';
import { useFTPCredentials } from '@/hooks/useFTPCredentials';
import { useExportDelivery } from '@/hooks/useExportDelivery';
import { useToast } from '@/hooks/use-toast';

interface EnhancedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCopyrights: string[];
  copyrightTitles: string[];
}

const EnhancedExportDialog: React.FC<EnhancedExportDialogProps> = ({
  open,
  onOpenChange,
  selectedCopyrights,
  copyrightTitles
}) => {
  const [exportFormat, setExportFormat] = useState<'cwr' | 'ddex'>('cwr');
  const [batchName, setBatchName] = useState('');
  const [exportNotes, setExportNotes] = useState('');
  const [exportTags, setExportTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFtpCredential, setSelectedFtpCredential] = useState<string>('');
  const [autoDeliver, setAutoDeliver] = useState(false);
  const [includeWriters, setIncludeWriters] = useState(true);
  const [includePublishers, setIncludePublishers] = useState(true);
  const [includeRecordings, setIncludeRecordings] = useState(exportFormat === 'ddex');

  const { validating, validationResult, validateExport, clearValidation } = useExportValidation();
  const { exportCopyrights, exporting } = useCopyrightExports();
  const { credentials } = useFTPCredentials();
  const { deliverExport } = useExportDelivery();
  const { toast } = useToast();

  // Update includeRecordings when format changes
  useEffect(() => {
    if (exportFormat === 'ddex') {
      setIncludeRecordings(true);
    }
  }, [exportFormat]);

  const handleValidate = async () => {
    await validateExport(selectedCopyrights, exportFormat);
  };

  const handleExport = async () => {
    if (!validationResult?.canExport) {
      toast({
        title: "Validation Required",
        description: "Please validate and resolve blocking issues before export",
        variant: "destructive"
      });
      return;
    }

    const exportOptions = {
      format: exportFormat,
      copyrightIds: selectedCopyrights,
      includeRecordings,
      includePublishers,
      includeWriters,
      batchName: batchName || `${exportFormat.toUpperCase()}_Export_${new Date().toISOString().split('T')[0]}`,
      exportNotes,
      exportTags
    };

    try {
      await exportCopyrights(exportOptions);
      
      if (autoDeliver && selectedFtpCredential) {
        // Note: Delivery will be handled by the backend after export completion
        toast({
          title: "Export Started",
          description: "Export queued for generation and delivery",
        });
      } else {
        toast({
          title: "Export Started",
          description: `${exportFormat.toUpperCase()} file generation started`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !exportTags.includes(newTag.trim())) {
      setExportTags([...exportTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setExportTags(exportTags.filter(t => t !== tag));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Export - {selectedCopyrights.length} Copyright{selectedCopyrights.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Compliance Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={exportFormat} onValueChange={(value: 'cwr' | 'ddex') => setExportFormat(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cwr">CWR Format</SelectItem>
                      <SelectItem value="ddex">DDEX Format</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleValidate} 
                    disabled={validating || selectedCopyrights.length === 0}
                    className="flex items-center gap-2"
                  >
                    {validating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Validate Export
                      </>
                    )}
                  </Button>
                </div>

                {validationResult && (
                  <div className="space-y-4">
                    <Card className={`${getScoreBgColor(validationResult.overallScore)}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Overall Compliance Score</h3>
                            <p className="text-sm text-muted-foreground">
                              {validationResult.totalCopyrights} works validated
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
                              {validationResult.overallScore.toFixed(1)}%
                            </div>
                            <Badge variant={validationResult.canExport ? "secondary" : "destructive"}>
                              {validationResult.canExport ? "Export Ready" : "Issues Found"}
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={validationResult.overallScore} 
                          className="mt-2" 
                        />
                      </CardContent>
                    </Card>

                    {validationResult.blockingIssues.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{validationResult.blockingIssuesCount} blocking issues</strong> must be resolved before export:
                          <ul className="mt-2 space-y-1">
                            {validationResult.blockingIssues.slice(0, 5).map((issue, index) => (
                              <li key={index} className="text-sm">
                                • {issue.songTitle}: {issue.message}
                              </li>
                            ))}
                            {validationResult.blockingIssues.length > 5 && (
                              <li className="text-sm text-muted-foreground">
                                + {validationResult.blockingIssues.length - 5} more issues
                              </li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationResult.warningIssues.length > 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{validationResult.warningIssuesCount} warnings</strong> - export possible but recommended to fix:
                          <ul className="mt-2 space-y-1">
                            {validationResult.warningIssues.slice(0, 3).map((issue, index) => (
                              <li key={index} className="text-sm">
                                • {issue.songTitle}: {issue.message}
                              </li>
                            ))}
                            {validationResult.warningIssues.length > 3 && (
                              <li className="text-sm text-muted-foreground">
                                + {validationResult.warningIssues.length - 3} more warnings
                              </li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationResult.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {validationResult.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-1 text-emerald-600 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchName">Batch Name</Label>
                    <Input
                      id="batchName"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder={`${exportFormat.toUpperCase()}_Export_${new Date().toISOString().split('T')[0]}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Export Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeWriters" 
                          checked={includeWriters}
                          onCheckedChange={(checked) => setIncludeWriters(!!checked)}
                        />
                        <Label htmlFor="includeWriters" className="text-sm">Include Writers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includePublishers" 
                          checked={includePublishers}
                          onCheckedChange={(checked) => setIncludePublishers(checked === true)}
                        />
                        <Label htmlFor="includePublishers" className="text-sm">Include Publishers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeRecordings" 
                          checked={includeRecordings}
                          onCheckedChange={(checked) => setIncludeRecordings(checked === true)}
                          disabled={exportFormat === 'ddex'}
                        />
                        <Label htmlFor="includeRecordings" className="text-sm">
                          Include Recordings {exportFormat === 'ddex' && '(Required for DDEX)'}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exportNotes">Export Notes</Label>
                  <Textarea
                    id="exportNotes"
                    value={exportNotes}
                    onChange={(e) => setExportNotes(e.target.value)}
                    placeholder="Add notes about this export batch..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {exportTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="autoDeliver" 
                    checked={autoDeliver}
                    onCheckedChange={(checked) => setAutoDeliver(checked === true)}
                  />
                  <Label htmlFor="autoDeliver">Automatically deliver export via FTP/SFTP</Label>
                </div>

                {autoDeliver && (
                  <div className="space-y-2">
                    <Label>FTP/SFTP Destination</Label>
                    <Select value={selectedFtpCredential} onValueChange={setSelectedFtpCredential}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select FTP credentials..." />
                      </SelectTrigger>
                      <SelectContent>
                        {credentials.map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>
                            {cred.pro_name} ({cred.host}:{cred.port})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {credentials.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No FTP credentials configured. Set up credentials in the FTP Management tab.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Selected Works ({selectedCopyrights.length})</h4>
                    <div className="mt-2 max-h-32 overflow-y-auto text-sm text-muted-foreground">
                      {copyrightTitles.map((title, index) => (
                        <div key={index}>• {title}</div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Format:</strong> {exportFormat.toUpperCase()}</div>
                    <div><strong>Batch Name:</strong> {batchName || 'Auto-generated'}</div>
                    <div><strong>Auto-Delivery:</strong> {autoDeliver ? 'Yes' : 'No'}</div>
                    {validationResult && (
                      <div><strong>Compliance Score:</strong> {validationResult.overallScore.toFixed(1)}%</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {validationResult && (
              <Button variant="outline" onClick={clearValidation}>
                Clear Validation
              </Button>
            )}
            <Button 
              onClick={handleExport}
              disabled={exporting || !validationResult?.canExport}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExportDialog;