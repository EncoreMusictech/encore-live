import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PayeeFormDialog } from "./PayeeFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PayeeWithHierarchy {
  id: string;
  payee_name: string;
  payee_type: string;
  contact_info: any;
  payment_info: any;
  is_primary: boolean;
  created_at: string;
  writer_id: string;
  writer: {
    id: string;
    writer_id: string;
    writer_name: string;
    original_publisher_id: string;
    original_publisher: {
      id: string;
      op_id: string;
      publisher_name: string;
      agreement_id: string;
      agreement: {
        id: string;
        agreement_id: string;
        title: string;
        counterparty_name: string;
      };
    };
  };
}

export function PayeesTable() {
  const [payees, setPayees] = useState<PayeeWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayee, setEditingPayee] = useState<PayeeWithHierarchy | null>(null);
  const { user } = useAuth();

  const fetchPayees = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payees')
        .select(`
          id,
          payee_name,
          payee_type,
          contact_info,
          payment_info,
          is_primary,
          created_at,
          writer_id,
          writer:writers(
            id,
            writer_id,
            writer_name,
            original_publisher_id,
            original_publisher:original_publishers(
              id,
              op_id,
              publisher_name,
              agreement_id,
              agreement:contracts(
                id,
                agreement_id,
                title,
                counterparty_name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayees(data || []);
    } catch (error: any) {
      console.error('Error fetching payees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePayee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPayees(payees.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Payee deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting payee:', error);
      toast({
        title: "Error",
        description: "Failed to delete payee",
        variant: "destructive",
      });
    }
  };

  const handleEditPayee = (payee: PayeeWithHierarchy) => {
    setEditingPayee(payee);
    setDialogOpen(true);
  };

  const handleAddPayee = () => {
    setEditingPayee(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPayee(null);
    }
  };

  const filteredPayees = payees.filter(payee =>
    payee.payee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.payee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.writer?.writer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.writer?.original_publisher?.publisher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payee.writer?.original_publisher?.agreement?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPayeeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'writer': return 'bg-blue-100 text-blue-800';
      case 'attorney': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'heir': return 'bg-orange-100 text-orange-800';
      case 'agent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchPayees();
  }, [user]);

  // Refresh when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      fetchPayees();
    }
  }, [dialogOpen]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          Loading payees...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payees, writers, publishers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2" onClick={handleAddPayee}>
          <Plus className="h-4 w-4" />
          Add Payee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payees Hierarchy</CardTitle>
          <p className="text-sm text-muted-foreground">
            View payees organized by Agreement → Original Publisher → Writer relationship
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payee Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayees.map((payee) => (
                  <TableRow key={payee.id}>
                    <TableCell className="font-medium">{payee.payee_name}</TableCell>
                    <TableCell>
                      <Badge className={getPayeeTypeColor(payee.payee_type)}>
                        {payee.payee_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="text-xs px-1">
                            {payee.writer?.original_publisher?.agreement?.agreement_id || 'N/A'}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs px-1">
                            {payee.writer?.original_publisher?.op_id || 'N/A'}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="text-xs px-1">
                            {payee.writer?.writer_id || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>{payee.writer?.original_publisher?.agreement?.title || 'Unknown Agreement'}</div>
                          <div>{payee.writer?.original_publisher?.publisher_name || 'Unknown Publisher'} → {payee.writer?.writer_name || 'Unknown Writer'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payee.is_primary && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPayee(payee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePayee(payee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPayees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No payees found matching your search."
                : "No payees found. Add your first payee to get started."}
            </div>
          )}
        </CardContent>
      </Card>

      <PayeeFormDialog 
        open={dialogOpen} 
        onOpenChange={handleDialogClose}
        editingPayee={editingPayee}
      />
    </div>
  );
}