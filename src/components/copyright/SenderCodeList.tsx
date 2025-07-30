import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Edit, Trash2, FileText, Mail, Settings } from 'lucide-react';
import { type SenderCode, useSenderCodes, type SenderCodeStatus } from '@/hooks/useSenderCodes';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SenderCodeListProps {
  senderCodes: SenderCode[];
  onEdit: (code: SenderCode) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
}

export const SenderCodeList: React.FC<SenderCodeListProps> = ({
  senderCodes,
  onEdit,
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
}) => {
  const { deleteSenderCode, updateStatus } = useSenderCodes();
  const [selectedCode, setSelectedCode] = useState<SenderCode | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<SenderCodeStatus>('not_submitted');
  const [statusNotes, setStatusNotes] = useState('');

  const handleDelete = async (code: SenderCode) => {
    try {
      await deleteSenderCode(code.id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedCode) return;

    try {
      await updateStatus(selectedCode.id, newStatus, statusNotes);
      setShowStatusUpdate(false);
      setSelectedCode(null);
      setStatusNotes('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const generateRequestEmail = (code: SenderCode) => {
    const proList = code.target_pros.join(', ');
    const subject = `CWR Sender Code Registration Request - ${code.sender_code}`;
    const body = `Dear PRO Team,

I am writing to request registration of a CWR sender code for my publishing company.

Company Details:
- Company Name: ${code.company_name}
- Contact Email: ${code.contact_email}
- IPI/CAE Number: ${code.ipi_cae_number || 'Not provided'}

Requested Sender Code: ${code.sender_code}
Target PRO(s): ${proList}

This sender code will be used for submitting Common Works Registration (CWR) files through the ENCORE music management platform. We require this code to properly route our copyright registrations and maintain compliance with industry standards.

Please confirm receipt of this request and provide information on the next steps in the registration process.

Thank you for your assistance.

Best regards,
${code.company_name}
${code.contact_email}

${code.notes ? `Additional Notes: ${code.notes}` : ''}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const openStatusDialog = (code: SenderCode) => {
    setSelectedCode(code);
    setNewStatus(code.status);
    setStatusNotes(code.notes || '');
    setShowStatusUpdate(true);
  };

  return (
    <div className="space-y-4">
      {senderCodes.map((code) => (
        <Card key={code.id} className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h4 className="font-mono text-lg font-semibold">
                  {code.sender_code}
                </h4>
                <Badge className={getStatusColor(code.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(code.status)}
                    {getStatusLabel(code.status)}
                  </div>
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Company:</span> {code.company_name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {code.contact_email}
                </div>
                {code.ipi_cae_number && (
                  <div>
                    <span className="font-medium">IPI/CAE:</span> {code.ipi_cae_number}
                  </div>
                )}
                <div>
                  <span className="font-medium">Target PROs:</span> {code.target_pros.join(', ')}
                </div>
              </div>

              {code.notes && (
                <div className="text-sm">
                  <span className="font-medium text-foreground">Notes:</span>{' '}
                  <span className="text-muted-foreground">{code.notes}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(code.created_at), { addSuffix: true })}
                {code.status_updated_at && (
                  <> • Status updated {formatDistanceToNow(new Date(code.status_updated_at), { addSuffix: true })}</>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRequestEmail(code)}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email Request
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(code)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openStatusDialog(code)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Update Status
                  </DropdownMenuItem>
                  {code.supporting_document_url && (
                    <DropdownMenuItem onClick={() => window.open(code.supporting_document_url, '_blank')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Documents
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sender Code</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the sender code "{code.sender_code}"? 
                          This action cannot be undone and may affect any CWR files that reference this code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(code)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}

      {/* Status Update Dialog */}
      <AlertDialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the status of sender code "{selectedCode?.sender_code}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SenderCodeStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any relevant notes about this status update"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};