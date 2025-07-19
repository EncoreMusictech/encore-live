import { useState } from "react";
import { Upload, File, Download, Trash2, Eye, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  filename: string;
  url: string;
  type: 'signed_agreement' | 'executed_agreement' | 'amendment' | 'supporting_document';
  uploaded_at: string;
  file_size?: number;
  mime_type?: string;
}

interface DocumentManagementProps {
  syncLicenseId: string;
  documents: Document[];
  onDocumentUpload: (file: File, type: Document['type']) => void;
  onDocumentDelete: (documentId: string) => void;
}

const documentTypes = [
  { value: 'signed_agreement', label: 'Signed Agreement', icon: FileText, color: 'default' },
  { value: 'executed_agreement', label: 'Executed Agreement', icon: CheckCircle, color: 'default' },
  { value: 'amendment', label: 'Amendment', icon: File, color: 'secondary' },
  { value: 'supporting_document', label: 'Supporting Document', icon: File, color: 'outline' },
];

export const DocumentManagement = ({ 
  syncLicenseId, 
  documents, 
  onDocumentUpload, 
  onDocumentDelete 
}: DocumentManagementProps) => {
  const [uploadType, setUploadType] = useState<Document['type']>('supporting_document');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, Word, or image files only",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onDocumentUpload(file, uploadType);
      event.target.value = ''; // Reset input
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeConfig = (type: Document['type']) => {
    return documentTypes.find(t => t.value === type) || documentTypes[3];
  };

  const groupedDocuments = documentTypes.map(type => ({
    ...type,
    documents: documents.filter(doc => doc.type === type.value)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="document-type">Document Type</Label>
              <select
                id="document-type"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as Document['type'])}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="file-upload">Upload Document</Label>
              <div className="relative mt-1">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Supported formats: PDF, Word documents, Images (JPG, PNG, GIF). Max size: 10MB
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {groupedDocuments.map(typeGroup => {
            if (typeGroup.documents.length === 0) return null;
            
            const TypeIcon = typeGroup.icon;
            
            return (
              <div key={typeGroup.value} className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  {typeGroup.label} ({typeGroup.documents.length})
                </h4>
                
                <div className="space-y-2">
                  {typeGroup.documents.map(document => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {document.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(document.file_size)} • {new Date(document.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={typeGroup.color as any}>
                          {typeGroup.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(document.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const linkElement = globalThis.document.createElement('a');
                            linkElement.href = document.url;
                            linkElement.download = document.filename;
                            linkElement.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.filename}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDocumentDelete(document.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {documents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document using the form above</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
};