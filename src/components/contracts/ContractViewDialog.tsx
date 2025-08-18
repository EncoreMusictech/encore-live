import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, DollarSign, Users, Music, Calendar, MapPin, FileSignature, Download, Edit } from "lucide-react";
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
  onEdit?: (contract: Contract) => void;
}

export function ContractViewDialog({ contract, open, onOpenChange, onEdit }: ContractViewDialogProps) {
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {contract.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(contract.contract_status)}>
                {contract.contract_status}
              </Badge>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(contract)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parties">Parties & Splits</TabsTrigger>
            <TabsTrigger value="works">Schedule of Works</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[70vh] mt-4">
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Contract Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5" />
                    Contract Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Contract Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Type:</span> {formatContractType(contract.contract_type)}</div>
                        <div><span className="font-medium">Version:</span> v{contract.version}</div>
                        <div><span className="font-medium">Created:</span> {format(new Date(contract.created_at), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Counterparty
                      </h4>
                      <div className="text-sm">
                        <div className="font-medium">{contract.counterparty_name}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Duration
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Start:</span> {contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : 'Not specified'}</div>
                        <div><span className="font-medium">End:</span> {contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{interestedParties.length}</p>
                        <p className="text-xs text-muted-foreground">Interested Parties</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{scheduleWorks.length}</p>
                        <p className="text-xs text-muted-foreground">Works in Schedule</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{contract.controlled_percentage || 0}%</p>
                        <p className="text-xs text-muted-foreground">Controlled Share</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{contract.territories?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Territories</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {contract.advance_amount !== undefined && contract.advance_amount > 0 && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                        <p className="text-2xl font-bold text-green-600">${contract.advance_amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Advance Amount ($)</p>
                        <p className="text-xs text-green-600 mt-1">Recoupable</p>
                      </div>
                    )}
                    {contract.commission_percentage !== undefined && contract.commission_percentage > 0 && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                        <p className="text-2xl font-bold text-blue-600">{contract.commission_percentage}%</p>
                        <p className="text-sm text-muted-foreground">Commission (%)</p>
                        <p className="text-xs text-blue-600 mt-1">Of Net Receipts</p>
                      </div>
                    )}
                    {contract.rate_reduction_percentage !== undefined && contract.rate_reduction_percentage > 0 && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                        <p className="text-2xl font-bold text-orange-600">{contract.rate_reduction_percentage}%</p>
                        <p className="text-sm text-muted-foreground">Rate Reduction (%)</p>
                        <p className="text-xs text-orange-600 mt-1">Applied to Royalties</p>
                      </div>
                    )}
                    {contract.financial_terms?.rate_reduction_amount !== undefined && contract.financial_terms.rate_reduction_amount > 0 && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                        <p className="text-2xl font-bold text-red-600">${contract.financial_terms.rate_reduction_amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Rate Reduction ($)</p>
                        <p className="text-xs text-red-600 mt-1">Fixed Amount</p>
                      </div>
                    )}
                    {contract.controlled_percentage !== undefined && contract.controlled_percentage > 0 && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <p className="text-2xl font-bold text-purple-600">{contract.controlled_percentage}%</p>
                        <p className="text-sm text-muted-foreground">Controlled Share</p>
                        <p className="text-xs text-purple-600 mt-1">Publishing Rights</p>
                      </div>
                    )}
                    
                    {/* Additional Financial Terms */}
                    {contract.financial_terms?.minimum_guarantee && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-teal-50 to-teal-100">
                        <p className="text-2xl font-bold text-teal-600">${contract.financial_terms.minimum_guarantee.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Minimum Guarantee</p>
                        <p className="text-xs text-teal-600 mt-1">Annual</p>
                      </div>
                    )}
                    
                    {contract.contract_data?.term_years && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
                        <p className="text-2xl font-bold text-indigo-600">{contract.contract_data.term_years}</p>
                        <p className="text-sm text-muted-foreground">Contract Term</p>
                        <p className="text-xs text-indigo-600 mt-1">Years</p>
                      </div>
                    )}
                    
                    {contract.financial_terms?.recoupment_rate && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-pink-100">
                        <p className="text-2xl font-bold text-pink-600">{contract.financial_terms.recoupment_rate}%</p>
                        <p className="text-sm text-muted-foreground">Recoupment Rate</p>
                        <p className="text-xs text-pink-600 mt-1">Of Earnings</p>
                      </div>
                    )}
                    
                    {contract.contract_data?.renewal_options && (
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
                        <p className="text-2xl font-bold text-amber-600">{contract.contract_data.renewal_options}</p>
                        <p className="text-sm text-muted-foreground">Renewal Options</p>
                        <p className="text-xs text-amber-600 mt-1">Available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Territories */}
              {contract.territories && contract.territories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Territories ({contract.territories.length})
                    </CardTitle>
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
            </TabsContent>

            <TabsContent value="parties" className="space-y-6 mt-0">
              {/* Interested Parties Tab */}
              {interestedParties.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Interested Parties ({interestedParties.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interestedParties.map((party) => (
                        <div key={party.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg">{party.name}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="capitalize">{party.party_type.replace('_', ' ')}</Badge>
                              <Badge variant={party.controlled_status === 'C' ? 'default' : 'secondary'}>
                                {party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {party.performance_percentage !== undefined && party.performance_percentage > 0 && (
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <p className="font-bold text-blue-600">{party.performance_percentage}%</p>
                                <p className="text-muted-foreground">Performance</p>
                              </div>
                            )}
                            {party.mechanical_percentage !== undefined && party.mechanical_percentage > 0 && (
                              <div className="text-center p-2 bg-green-50 rounded">
                                <p className="font-bold text-green-600">{party.mechanical_percentage}%</p>
                                <p className="text-muted-foreground">Mechanical</p>
                              </div>
                            )}
                            {party.synch_percentage !== undefined && party.synch_percentage > 0 && (
                              <div className="text-center p-2 bg-purple-50 rounded">
                                <p className="font-bold text-purple-600">{party.synch_percentage}%</p>
                                <p className="text-muted-foreground">Sync</p>
                              </div>
                            )}
                            {party.print_percentage !== undefined && party.print_percentage > 0 && (
                              <div className="text-center p-2 bg-orange-50 rounded">
                                <p className="font-bold text-orange-600">{party.print_percentage}%</p>
                                <p className="text-muted-foreground">Print</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Interested Parties</h3>
                    <p className="text-muted-foreground">No parties have been added to this contract yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="works" className="space-y-6 mt-0">
              {/* Schedule of Works Tab */}
              {scheduleWorks.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Schedule of Works ({scheduleWorks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scheduleWorks.map((work) => (
                        <div key={work.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{work.song_title}</h4>
                              {work.artist_name && (
                                <p className="text-muted-foreground">by {work.artist_name}</p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              {work.work_id && (
                                <Badge variant="outline" className="block">Work ID: {work.work_id}</Badge>
                              )}
                              {work.iswc && (
                                <Badge variant="outline" className="block">ISWC: {work.iswc}</Badge>
                              )}
                              {work.isrc && (
                                <Badge variant="outline" className="block">ISRC: {work.isrc}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Works Scheduled</h3>
                    <p className="text-muted-foreground">No works have been added to this contract's schedule yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}