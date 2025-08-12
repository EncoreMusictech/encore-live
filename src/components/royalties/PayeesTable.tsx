
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, AlertCircle } from "lucide-react";
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

export function PayeesTable() {
  const { payees, loading, deletePayee, refetch } = usePayees();
  const [showForm, setShowForm] = useState(false);
  const [editingPayee, setEditingPayee] = useState<any>(null);
  const [showAutoBuild, setShowAutoBuild] = useState(false);

  const handleEdit = (payee: any) => {
    setEditingPayee(payee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPayee(null);
  };

  const handleDelete = async (id: string) => {
    await deletePayee(id);
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
            <CardDescription>Manage payee information and payment details</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAutoBuild(true)}>
              Build from Agreement
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payee
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payees.map((payee) => (
                <TableRow key={payee.id}>
                  <TableCell className="font-mono text-sm">
                    {payee.payee_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payee.payee_name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {payee.email && (
                        <div className="text-sm">{payee.email}</div>
                      )}
                      {payee.phone && (
                        <div className="text-sm text-muted-foreground">{payee.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payee.payment_method ? (
                      <Badge variant="outline">
                        {payee.payment_method.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={payee.payee_status === 'active' ? 'default' : 'secondary'}>
                      {payee.payee_status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payee.tax_id ? (
                      <span className="font-mono text-sm">
                        {payee.tax_id.replace(/(.{3})(.{2})/, '$1-XX-$2XX')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(payee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
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
                              onClick={() => handleDelete(payee.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
