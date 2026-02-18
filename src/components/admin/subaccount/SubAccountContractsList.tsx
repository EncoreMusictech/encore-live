import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertTriangle, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { buildPdfFileName } from '@/lib/utils';

interface SubAccountContractsListProps {
  companyId: string;
  companyName: string;
}

interface ContractRow {
  id: string;
  title: string;
  counterparty_name: string;
  contract_type: string;
  contract_status: string;
  start_date: string | null;
  end_date: string | null;
  advance_amount: number | null;
  financial_terms: any;
  original_pdf_url: string | null;
  created_at: string;
}

type PostTermStatus = 'active' | 'post-term' | 'expired' | 'expiring-soon' | 'no-term';

function getPostTermStatus(contract: ContractRow): PostTermStatus {
  const now = new Date();
  const endDate = contract.end_date ? new Date(contract.end_date) : null;
  
  // Try to get post-term end date from financial_terms JSON
  const postTermEnd = contract.financial_terms?.post_term_collection_end_date
    ? new Date(contract.financial_terms.post_term_collection_end_date)
    : null;

  if (!endDate) return 'no-term';
  if (now < endDate) return 'active';
  
  if (!postTermEnd) {
    // Past end date with no post-term defined
    return now >= endDate ? 'expired' : 'active';
  }

  if (now >= postTermEnd) return 'expired';

  // Check expiring soon (within 90 days)
  const daysUntilExpiry = Math.ceil((postTermEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 90) return 'expiring-soon';

  return 'post-term';
}

function PostTermBadge({ status }: { status: PostTermStatus }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/30">Active</Badge>;
    case 'post-term':
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">Post-Term Collection</Badge>;
    case 'expiring-soon':
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 animate-pulse">Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Collection Expired</Badge>;
    case 'no-term':
      return <Badge variant="outline">No Term Set</Badge>;
  }
}

export function SubAccountContractsList({ companyId, companyName }: SubAccountContractsListProps) {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('id, title, counterparty_name, contract_type, contract_status, start_date, end_date, advance_amount, financial_terms, original_pdf_url, created_at')
        .eq('client_company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      toast({ title: 'Error', description: 'Failed to load contracts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [companyId]);

  const expiringSoon = contracts.filter(c => getPostTermStatus(c) === 'expiring-soon');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expiringSoon.length > 0 && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Post-Term Collection Expiring Soon</AlertTitle>
          <AlertDescription className="text-amber-600">
            {expiringSoon.length} contract{expiringSoon.length > 1 ? 's' : ''} will reach the end of their post-term collection period within 90 days:
            {' '}{expiringSoon.map(c => `"${c.title}"`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>{contracts.length} contract{contracts.length !== 1 ? 's' : ''} for {companyName}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchContracts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No contracts yet. Upload a PDF or use bulk import.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                     <th className="p-3 text-left font-medium">Title</th>
                    <th className="p-3 text-left font-medium">Counterparty</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">End Date</th>
                    <th className="p-3 text-left font-medium">Post-Term Status</th>
                    <th className="p-3 text-left font-medium">Post-Term End</th>
                    <th className="p-3 text-left font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => {
                    const ptStatus = getPostTermStatus(contract);
                    const ptEnd = contract.financial_terms?.post_term_collection_end_date;
                    return (
                      <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3 font-medium">{contract.title}</td>
                        <td className="p-3">{contract.counterparty_name}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs capitalize">{contract.contract_type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={contract.contract_status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
                            {contract.contract_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3"><PostTermBadge status={ptStatus} /></td>
                        <td className="p-3 text-muted-foreground">
                          {ptEnd ? new Date(ptEnd).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3">
                          {contract.original_pdf_url ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="View PDF"
                                onClick={() => window.open(contract.original_pdf_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Download PDF"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = contract.original_pdf_url!;
                                  const base = buildPdfFileName({ kind: 'document', title: contract.title, date: new Date() });
                                  link.download = `${base}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
