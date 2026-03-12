
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, AlertCircle, Building2, User, ChevronDown, ChevronRight } from "lucide-react";
import { usePayees } from "@/hooks/usePayees";
import { PayeeFormDialog } from "./PayeeFormDialog";
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
import { AutoBuildPayeesDialog } from "./AutoBuildPayeesDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface PublisherGroup {
  publisherId: string;
  publisherName: string;
  opId: string;
  agreementTitle: string;
  agreementId: string;
  writers: WriterGroup[];
}

interface WriterGroup {
  writerId: string;
  writerName: string;
  writerCode: string;
  payees: any[];
}

export function PayeesTable() {
  const { payees, loading, deletePayee, refetch } = usePayees();
  const [showForm, setShowForm] = useState(false);
  const [editingPayee, setEditingPayee] = useState<any>(null);
  const [showAutoBuild, setShowAutoBuild] = useState(false);
  const [expandedPublishers, setExpandedPublishers] = useState<Set<string>>(new Set());
  const [preselectedPublisher, setPreselectedPublisher] = useState<{ agreementId: string; publisherId: string } | null>(null);

  // Group payees into publisher → writer tree
  const publisherTree = useMemo(() => {
    const map = new Map<string, PublisherGroup>();

    for (const payee of payees) {
      const pub = payee?.writer?.original_publisher;
      const writer = payee?.writer;
      const agreement = pub?.agreement;

      const pubKey = pub?.id || 'unassigned';
      const writerKey = writer?.id || 'unassigned';

      if (!map.has(pubKey)) {
        map.set(pubKey, {
          publisherId: pub?.id || '',
          publisherName: pub?.publisher_name || 'Unassigned Publisher',
          opId: pub?.op_id || '—',
          agreementTitle: agreement?.title || 'Unknown Agreement',
          agreementId: agreement?.id || '',
          writers: [],
        });
      }

      const group = map.get(pubKey)!;
      let writerGroup = group.writers.find(w => w.writerId === writerKey);
      if (!writerGroup) {
        writerGroup = {
          writerId: writer?.id || '',
          writerName: writer?.writer_name || 'Unassigned Writer',
          writerCode: writer?.writer_id || '—',
          payees: [],
        };
        group.writers.push(writerGroup);
      }

      writerGroup.payees.push(payee);
    }

    return Array.from(map.values());
  }, [payees]);

  const togglePublisher = (pubId: string) => {
    setExpandedPublishers(prev => {
      const next = new Set(prev);
      if (next.has(pubId)) next.delete(pubId);
      else next.add(pubId);
      return next;
    });
  };

  const handleEdit = (payee: any) => {
    setEditingPayee(payee);
    setPreselectedPublisher(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPayee(null);
    setPreselectedPublisher(null);
  };

  const handleDelete = async (id: string) => {
    await deletePayee(id);
  };

  const handleAddPayeeToPublisher = (group: PublisherGroup) => {
    setEditingPayee(null);
    setPreselectedPublisher({
      agreementId: group.agreementId,
      publisherId: group.publisherId,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payees
          </CardTitle>
          <CardDescription>Loading payees...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (payees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payees
          </CardTitle>
          <CardDescription>Manage payee information and payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Payees Found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Payees are automatically created during the batch processing workflow when royalties are matched to writers and payouts are generated. 
              You can also build payees directly from an agreement with default splits.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payee
              </Button>
              <Button variant="outline" onClick={() => setShowAutoBuild(true)}>
                Build from Agreement
              </Button>
            </div>
          </div>

          <PayeeFormDialog
            open={showForm}
            onOpenChange={handleCloseForm}
            editingPayee={editingPayee}
          />
          <AutoBuildPayeesDialog
            open={showAutoBuild}
            onOpenChange={setShowAutoBuild}
            onCompleted={refetch}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payees ({payees.length})
            </CardTitle>
            <CardDescription>Payees organized by publisher and writer</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAutoBuild(true)}>
              Build from Agreement
            </Button>
            <Button onClick={() => { setPreselectedPublisher(null); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payee
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {publisherTree.map((group) => {
          const isExpanded = expandedPublishers.has(group.publisherId);
          const totalPayees = group.writers.reduce((sum, w) => sum + w.payees.length, 0);

          return (
            <div key={group.publisherId} className="border rounded-lg overflow-hidden">
              {/* Publisher Header */}
              <Collapsible open={isExpanded} onOpenChange={() => togglePublisher(group.publisherId)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <div className="font-medium">{group.publisherName}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.opId} · {group.agreementTitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{group.writers.length} writer{group.writers.length !== 1 ? 's' : ''}</Badge>
                      <Badge>{totalPayees} payee{totalPayees !== 1 ? 's' : ''}</Badge>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="px-4 py-3 space-y-3">
                    {group.writers.map((writerGroup) => (
                      <div key={writerGroup.writerId} className="border rounded-md">
                        {/* Writer Header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{writerGroup.writerName}</span>
                          <span className="text-xs font-mono text-muted-foreground">({writerGroup.writerCode})</span>
                          <Badge variant="outline" className="text-xs ml-auto">{writerGroup.payees.length} payee{writerGroup.payees.length !== 1 ? 's' : ''}</Badge>
                        </div>

                        {/* Payees under this writer */}
                        <div className="divide-y">
                          {writerGroup.payees.map((payee) => (
                            <PayeeRow
                              key={payee.id}
                              payee={payee}
                              onEdit={() => handleEdit(payee)}
                              onDelete={() => handleDelete(payee.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Add payee to this publisher */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border border-dashed text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPayeeToPublisher(group);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Payee to {group.publisherName}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}

        <PayeeFormDialog
          open={showForm}
          onOpenChange={handleCloseForm}
          editingPayee={editingPayee}
          preselectedPublisher={preselectedPublisher}
        />
        <AutoBuildPayeesDialog
          open={showAutoBuild}
          onOpenChange={setShowAutoBuild}
          onCompleted={refetch}
        />
      </CardContent>
    </Card>
  );
}

/** Individual payee row within the tree */
function PayeeRow({ payee, onEdit, onDelete }: { payee: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="min-w-0">
          <div className="font-medium truncate">{payee.payee_name}</div>
          <div className="text-xs text-muted-foreground font-mono">{payee.payee_id || '—'}</div>
        </div>

        {/* Contact */}
        {(payee.email || payee.phone) && (
          <div className="hidden md:block text-xs text-muted-foreground">
            {payee.email && <span>{payee.email}</span>}
            {payee.phone && <span className="ml-2">{payee.phone}</span>}
          </div>
        )}

        {/* Payment method */}
        {payee.payment_method && (
          <Badge variant="outline" className="hidden sm:inline-flex text-xs">
            {payee.payment_method.toUpperCase()}
          </Badge>
        )}

        {/* Status */}
        <Badge variant={payee.payee_status === 'active' ? 'default' : 'secondary'} className="text-xs">
          {payee.payee_status || 'active'}
        </Badge>
        {payee.payee_type && (
          <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
            {payee.payee_type}
          </Badge>
        )}

        {/* Splits tooltip */}
        {payee.payment_info?.default_splits && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help hidden lg:inline">
                P:{payee.payment_info.default_splits.performance ?? '—'}%
                M:{payee.payment_info.default_splits.mechanical ?? '—'}%
                S:{payee.payment_info.default_splits.synchronization ?? '—'}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-0.5">
                <div>Performance: {payee.payment_info.default_splits.performance ?? 0}%</div>
                <div>Mechanical: {payee.payment_info.default_splits.mechanical ?? 0}%</div>
                <div>Sync: {payee.payment_info.default_splits.synchronization ?? 0}%</div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {payee.payee_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
