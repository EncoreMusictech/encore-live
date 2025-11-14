
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDataFiltering } from './useDataFiltering';

export function usePayees() {
  const [payees, setPayees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { applyUserIdFilter } = useDataFiltering();

  const fetchPayees = async () => {
    try {
      setLoading(true);
      
      // Fetch payees unconditionally (support agreement-driven setup as well)
      let query = supabase
        .from('payees')
        .select(`
          *,
          writer:writers(
            id,
            writer_name,
            writer_id,
            original_publisher:original_publishers(
              id,
              publisher_name,
              op_id,
              agreement:contracts(
                id,
                title,
                agreement_id
              )
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      query = applyUserIdFilter(query);
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payees:', error);
        toast({
          title: "Error",
          description: "Failed to load payees",
          variant: "destructive",
        });
        return;
      }

      setPayees(data || []);
    } catch (error) {
      console.error('Error in fetchPayees:', error);
      setPayees([]);
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

      if (error) {
        console.error('Error deleting payee:', error);
        toast({
          title: "Error",
          description: "Failed to delete payee",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Payee deleted successfully",
      });

      // Refresh the list
      fetchPayees();
    } catch (error) {
      console.error('Error in deletePayee:', error);
    }
  };

  useEffect(() => {
    fetchPayees();
  }, []);

  return {
    payees,
    loading,
    deletePayee,
    refetch: fetchPayees,
  };
}
