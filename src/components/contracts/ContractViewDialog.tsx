import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Contract {
  id: string;
  title: string;
  contract_type: string;
  contract_status: string;
  counterparty_name: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  version: number;
  advance_amount?: number;
  commission_percentage?: number;
  rate_reduction_percentage?: number;
  controlled_percentage?: number;
  notes?: string;
  financial_terms?: any;
  contract_data?: any;
  territories?: string[];
  royalty_splits?: any;
}

interface ContractInterestedParty {
  id: string;
  name: string;
  party_type: string;
  controlled_status: string;
  performance_percentage?: number;
  mechanical_percentage?: number;
  synch_percentage?: number;
  print_percentage?: number;
}

interface ContractScheduleWork {
  id: string;
  song_title: string;
  artist_name?: string;
  work_id?: string;
  iswc?: string;
  isrc?: string;
}

interface ContractViewDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractViewDialog({ contract, open, onOpenChange }: ContractViewDialogProps) {
  const [interestedParties, setInterestedParties] = useState<ContractInterestedParty[]>([]);
  const [scheduleWorks, setScheduleWorks] = useState<ContractScheduleWork[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contract && open) {
      fetchContractDetails();
    }
  }, [contract, open]);

  const fetchContractDetails = async () => {
    if (!contract) return;
    
    setIsLoading(true);
    try {
      // Fetch interested parties
      const { data: parties } = await supabase
        .from('contract_interested_parties')
        .select('*')
        .eq('contract_id', contract.id);

      // Fetch schedule works
      const { data: works } = await supabase
        .from('contract_schedule_works')
        .select('*')
        .eq('contract_id', contract.id);

      setInterestedParties(parties || []);
      setScheduleWorks(works || []);
    } catch (error) {
      console.error('Error fetching contract details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatContractType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contract Agreement - {contract.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Contract Details
                <Badge className={getStatusColor(contract.contract_status)}>
                  {contract.contract_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Contract Type</h4>
                  <p>{formatContractType(contract.contract_type)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Counterparty</h4>
                  <p>{contract.counterparty_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Start Date</h4>
                  <p>{contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">End Date</h4>
                  <p>{contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Version</h4>
                  <p>v{contract.version}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
                  <p>{format(new Date(contract.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {contract.advance_amount !== undefined && contract.advance_amount > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Advance Amount</h4>
                    <p>${contract.advance_amount.toLocaleString()}</p>
                  </div>
                )}
                {contract.commission_percentage !== undefined && contract.commission_percentage > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Commission</h4>
                    <p>{contract.commission_percentage}%</p>
                  </div>
                )}
                {contract.rate_reduction_percentage !== undefined && contract.rate_reduction_percentage > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Rate Reduction</h4>
                    <p>{contract.rate_reduction_percentage}%</p>
                  </div>
                )}
                {contract.controlled_percentage !== undefined && contract.controlled_percentage > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Controlled Share</h4>
                    <p>{contract.controlled_percentage}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Territories */}
          {contract.territories && contract.territories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Territories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contract.territories.map((territory, index) => (
                    <Badge key={index} variant="outline">{territory}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interested Parties */}
          {interestedParties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interested Parties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interestedParties.map((party) => (
                    <div key={party.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{party.name}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">{party.party_type}</Badge>
                          <Badge variant={party.controlled_status === 'C' ? 'default' : 'secondary'}>
                            {party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        {party.performance_percentage !== undefined && party.performance_percentage > 0 && (
                          <div>
                            <span className="text-muted-foreground">Performance:</span> {party.performance_percentage}%
                          </div>
                        )}
                        {party.mechanical_percentage !== undefined && party.mechanical_percentage > 0 && (
                          <div>
                            <span className="text-muted-foreground">Mechanical:</span> {party.mechanical_percentage}%
                          </div>
                        )}
                        {party.synch_percentage !== undefined && party.synch_percentage > 0 && (
                          <div>
                            <span className="text-muted-foreground">Sync:</span> {party.synch_percentage}%
                          </div>
                        )}
                        {party.print_percentage !== undefined && party.print_percentage > 0 && (
                          <div>
                            <span className="text-muted-foreground">Print:</span> {party.print_percentage}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule of Works */}
          {scheduleWorks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule of Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduleWorks.map((work) => (
                    <div key={work.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{work.song_title}</h4>
                          {work.artist_name && (
                            <p className="text-sm text-muted-foreground">by {work.artist_name}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {work.work_id && <div>Work ID: {work.work_id}</div>}
                          {work.iswc && <div>ISWC: {work.iswc}</div>}
                          {work.isrc && <div>ISRC: {work.isrc}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {contract.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}