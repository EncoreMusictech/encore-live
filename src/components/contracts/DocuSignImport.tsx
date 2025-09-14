import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDemoAccess } from "@/hooks/useDemoAccess";

interface DocuSignImportProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface DocuSignEnvelope {
  envelopeId: string;
  emailSubject: string;
  status: string;
  createdDateTime: string;
  sentDateTime: string;
  completedDateTime?: string;
}

interface DocuSignDocument {
  documentId: string;
  name: string;
  type: string;
  pages: number;
}

export function DocuSignImport({ onBack, onSuccess }: DocuSignImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [envelopes, setEnvelopes] = useState<DocuSignEnvelope[]>([]);
  const [selectedEnvelope, setSelectedEnvelope] = useState<DocuSignEnvelope | null>(null);
  const [documents, setDocuments] = useState<DocuSignDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocuSignDocument | null>(null);
  const [contractType, setContractType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [counterpartyName, setCounterpartyName] = useState<string>("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<{
    authentication: boolean | null;
    envelopeCount: number | null;
    error: string | null;
  }>({ authentication: null, envelopeCount: null, error: null });
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccess, incrementUsage, showUpgradeModalForModule, isDemo } = useDemoAccess();

  const authenticate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('docusign-import', {
        body: { action: 'authenticate' }
      });

      if (error) throw error;

      if (data.success) {
        setAccessToken(data.accessToken);
        await loadEnvelopes(data.accessToken);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: "Failed to connect to DocuSign. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnvelopes = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('docusign-import', {
        body: { 
          action: 'listEnvelopes',
          accessToken: token
        }
      });

      if (error) throw error;

      if (data.success) {
        setEnvelopes(data.envelopes);
      }
    } catch (error) {
      console.error('Error loading envelopes:', error);
      toast({
        title: "Error",
        description: "Failed to load envelopes from DocuSign.",
        variant: "destructive",
      });
    }
  };

  const loadDocuments = async (envelope: DocuSignEnvelope) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('docusign-import', {
        body: {
          action: 'getEnvelopeDocuments',
          accessToken: accessToken,
          envelopeId: envelope.envelopeId
        }
      });

      if (error) throw error;

      if (data.success) {
        setSelectedEnvelope(envelope);
        setDocuments(data.documents);
        setTitle(envelope.emailSubject || "");
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents for this envelope.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importContract = async () => {
    if (!selectedEnvelope || !selectedDocument || !contractType || !title || !counterpartyName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before importing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Demo gating: only 1 submission in demo
    if (!canAccess('contractManagement')) {
      showUpgradeModalForModule('contractManagement');
      toast({ title: 'Demo limit reached', description: 'Sign up to import more contracts.' });
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('docusign-import', {
        body: {
          action: 'importContract',
          accessToken: accessToken,
          envelopeId: selectedEnvelope.envelopeId,
          documentId: selectedDocument.documentId,
            contractData: {
              title,
              counterparty_name: counterpartyName,
              contract_type: contractType,
              user_id: user?.id
            }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Contract imported successfully from DocuSign!",
        });
        if (isDemo) {
          incrementUsage('contractManagement');
          showUpgradeModalForModule('contractManagement');
        }
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing contract:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResults({ authentication: null, envelopeCount: null, error: null });
    
    try {
      // Test authentication
      const { data: authData, error: authError } = await supabase.functions.invoke('docusign-import', {
        body: { action: 'authenticate' }
      });

      if (authError) throw authError;

      if (authData.success) {
        setTestResults(prev => ({ ...prev, authentication: true }));
        
        // Test envelope listing
        const { data: envData, error: envError } = await supabase.functions.invoke('docusign-import', {
          body: { 
            action: 'listEnvelopes',
            accessToken: authData.accessToken
          }
        });

        if (envError) throw envError;

        if (envData.success) {
          setTestResults(prev => ({ 
            ...prev, 
            envelopeCount: envData.envelopes?.length || 0 
          }));
          
          toast({
            title: "Connection Test Successful! ✅",
            description: `DocuSign connected successfully. Found ${envData.envelopes?.length || 0} envelopes.`,
          });
        }
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setTestResults(prev => ({ 
        ...prev, 
        authentication: false, 
        error: error.message || 'Connection test failed' 
      }));
      
      toast({
        title: "Connection Test Failed ❌",
        description: error.message || "Failed to connect to DocuSign. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">Import from DocuSign</h3>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect to DocuSign</CardTitle>
            <CardDescription>
              Authenticate with your DocuSign account to access your envelopes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={testConnection} 
                disabled={isTestingConnection}
                variant="outline"
                className="w-full gap-2"
              >
                {isTestingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isTestingConnection ? "Testing Connection..." : "Test DocuSign Connection"}
              </Button>
              
              {/* Test Results */}
              {(testResults.authentication !== null || testResults.error) && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Connection Test Results:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>Authentication:</span>
                        {testResults.authentication === true && <Badge variant="default">✅ Success</Badge>}
                        {testResults.authentication === false && <Badge variant="destructive">❌ Failed</Badge>}
                        {testResults.authentication === null && <Badge variant="secondary">⏳ Pending</Badge>}
                      </div>
                      {testResults.envelopeCount !== null && (
                        <div className="flex items-center gap-2">
                          <span>Envelopes found:</span>
                          <Badge variant="outline">{testResults.envelopeCount}</Badge>
                        </div>
                      )}
                      {testResults.error && (
                        <div className="text-destructive">
                          <strong>Error:</strong> {testResults.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button 
                onClick={authenticate} 
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isLoading ? "Connecting..." : "Connect to DocuSign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedEnvelope) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">Select DocuSign Envelope</h3>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Envelopes</CardTitle>
            <CardDescription>
              Choose an envelope to import documents from
            </CardDescription>
          </CardHeader>
          <CardContent>
            {envelopes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No completed envelopes found in your DocuSign account.
              </p>
            ) : (
              <div className="space-y-3">
                {envelopes.map((envelope) => (
                  <Card 
                    key={envelope.envelopeId}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => loadDocuments(envelope)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{envelope.emailSubject}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(envelope.createdDateTime).toLocaleDateString()}
                          </p>
                          {envelope.completedDateTime && (
                            <p className="text-sm text-muted-foreground">
                              Completed: {new Date(envelope.completedDateTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={envelope.status === 'completed' ? 'default' : 'secondary'}>
                          {envelope.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedEnvelope(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Import Contract Details</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selected Envelope</CardTitle>
          <CardDescription>{selectedEnvelope.emailSubject}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Document</Label>
              <Select 
                value={selectedDocument?.documentId || ""} 
                onValueChange={(value) => {
                  const doc = documents.find(d => d.documentId === value);
                  setSelectedDocument(doc || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a document to import" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.documentId} value={doc.documentId}>
                      {doc.name} ({doc.pages} pages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter contract title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counterparty">Counterparty Name</Label>
                <Input
                  id="counterparty"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="Enter counterparty name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishing">Publishing Agreement</SelectItem>
                  <SelectItem value="artist">Artist Agreement</SelectItem>
                  <SelectItem value="producer">Producer Agreement</SelectItem>
                  <SelectItem value="sync">Sync License</SelectItem>
                  <SelectItem value="distribution">Distribution Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedEnvelope(null)}>
                Back to Envelopes
              </Button>
              <Button 
                onClick={importContract}
                disabled={isLoading || !selectedDocument || !contractType || !title || !counterpartyName}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isLoading ? "Importing..." : "Import Contract"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}