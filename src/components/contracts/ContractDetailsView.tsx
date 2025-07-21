import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  CalendarDays, 
  DollarSign, 
  Globe, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Music
} from 'lucide-react';

interface ContractDetailsViewProps {
  parsedData: any; // Raw parsed data from the edge function
  confidence: number;
}

export const ContractDetailsView: React.FC<ContractDetailsViewProps> = ({ 
  parsedData, 
  confidence 
}) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount || amount === 0) return 'No advance';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value?: number) => {
    if (value === null || value === undefined) return 'Not specified';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getConfidenceIcon(confidence)}
              Contract Analysis Results
            </CardTitle>
            <Badge className={getConfidenceColor(confidence)}>
              {Math.round(confidence * 100)}% Confidence
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="works">Works</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Agreement Title</div>
                  <div className="text-lg font-semibold">
                    {parsedData.agreement_title || 'Contract Agreement'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Contract Type</div>
                  <div className="text-lg capitalize">
                    {parsedData.contract_type?.replace('_', ' ') || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Territory</div>
                  <div className="text-lg">
                    {parsedData.territory || 'Not specified'}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Key Dates
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Effective Date:</span>
                      <span>{formatDate(parsedData.effective_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span>{formatDate(parsedData.end_date)}</span>
                    </div>
                    {parsedData.renewal_options && (
                      <div className="flex justify-between">
                        <span>Renewal:</span>
                        <Badge variant="secondary">Auto-renewal</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    Exclusivity & Rights
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Exclusivity:</span>
                      <Badge variant={parsedData.exclusivity ? "default" : "secondary"}>
                        {parsedData.exclusivity ? 'Exclusive' : 'Non-exclusive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Rights Acquired:</span>
                      <span className="capitalize">{parsedData.rights_acquired || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contract Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedData.administrator_name && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Administrator</h4>
                    <Badge>Primary</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {parsedData.administrator_name}
                    </div>
                    {parsedData.administrator_address && (
                      <div>
                        <span className="font-medium">Address:</span> {parsedData.administrator_address}
                      </div>
                    )}
                    {parsedData.administrator_email && (
                      <div>
                        <span className="font-medium">Email:</span> {parsedData.administrator_email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {parsedData.counterparty_name && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Counterparty</h4>
                    <Badge variant="secondary">Client</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {parsedData.counterparty_name}
                    </div>
                    {parsedData.counterparty_address && (
                      <div>
                        <span className="font-medium">Address:</span> {parsedData.counterparty_address}
                      </div>
                    )}
                    {parsedData.counterparty_email && (
                      <div>
                        <span className="font-medium">Email:</span> {parsedData.counterparty_email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional parties from the parties array */}
              {parsedData.parties && Array.isArray(parsedData.parties) && parsedData.parties.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Additional Parties</h4>
                  <div className="space-y-3">
                    {parsedData.parties.map((party: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{party.party_name}</h5>
                          <Badge variant="outline" className="capitalize">
                            {party.party_type || 'Party'}
                          </Badge>
                        </div>
                        {party.pro_affiliation && (
                          <div>
                            <span className="font-medium">PRO:</span> {party.pro_affiliation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Advance & Fees</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Advance Amount:</span>
                      <span className="font-medium">{formatCurrency(parsedData.advance_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recoupable:</span>
                      <Badge variant={parsedData.recoupable ? "destructive" : "secondary"}>
                        {parsedData.recoupable ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Admin Fee:</span>
                      <span className="font-medium">{formatPercentage(parsedData.admin_fee_percentage)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Revenue Splits</h4>
                  <div className="space-y-2">
                    {parsedData.publisher_share_percentage && (
                      <div className="flex justify-between">
                        <span>Publisher Share:</span>
                        <span className="font-medium">{formatPercentage(parsedData.publisher_share_percentage)}</span>
                      </div>
                    )}
                    {parsedData.writer_share_percentage && (
                      <div className="flex justify-between">
                        <span>Writer Share:</span>
                        <span className="font-medium">{formatPercentage(parsedData.writer_share_percentage)}</span>
                      </div>
                    )}
                    {parsedData.sync_revenue_split_percentage && (
                      <div className="flex justify-between">
                        <span>Sync Revenue:</span>
                        <span className="font-medium">{formatPercentage(parsedData.sync_revenue_split_percentage)}</span>
                      </div>
                    )}
                    {parsedData.mechanical_split_percentage && (
                      <div className="flex justify-between">
                        <span>Mechanical Split:</span>
                        <span className="font-medium">{formatPercentage(parsedData.mechanical_split_percentage)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Payment Terms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-medium capitalize">{parsedData.royalty_frequency || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Terms:</span>
                    <span className="font-medium">{parsedData.payment_terms || 'Standard terms'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Days:</span>
                    <span className="font-medium">{parsedData.payment_terms_days || 'N/A'} days</span>
                  </div>
                  {parsedData.minimum_payment_threshold && (
                    <div className="flex justify-between">
                      <span>Min Threshold:</span>
                      <span className="font-medium">{formatCurrency(parsedData.minimum_payment_threshold)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Contract Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Term & Termination</h4>
                  <div className="space-y-2">
                    {parsedData.termination_notice_days && (
                      <div className="flex justify-between">
                        <span>Notice Period:</span>
                        <span className="font-medium">{parsedData.termination_notice_days} days</span>
                      </div>
                    )}
                    {parsedData.tail_period_months && (
                      <div className="flex justify-between">
                        <span>Tail Period:</span>
                        <span className="font-medium">{parsedData.tail_period_months} months</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Perpetual Rights:</span>
                      <Badge variant={parsedData.perpetual_rights ? "default" : "secondary"}>
                        {parsedData.perpetual_rights ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Delivery & Requirements</h4>
                  <div className="space-y-2">
                    {parsedData.delivery_commitment && (
                      <div className="flex justify-between">
                        <span>Delivery Commitment:</span>
                        <span className="font-medium">{parsedData.delivery_commitment}</span>
                      </div>
                    )}
                    {parsedData.controlled_share_percentage && (
                      <div className="flex justify-between">
                        <span>Controlled Share:</span>
                        <span className="font-medium">{formatPercentage(parsedData.controlled_share_percentage)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {parsedData.governing_law && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Legal</h4>
                    <div className="flex justify-between">
                      <span>Governing Law:</span>
                      <span className="font-medium">{parsedData.governing_law}</span>
                    </div>
                  </div>
                </>
              )}

              {(parsedData.approval_details || parsedData.dispute_resolution_method) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Additional Terms</h4>
                    {parsedData.approval_details && (
                      <div>
                        <span className="font-medium">Approval Requirements:</span>
                        <p className="text-muted-foreground mt-1">{parsedData.approval_details}</p>
                      </div>
                    )}
                    {parsedData.dispute_resolution_method && (
                      <div>
                        <span className="font-medium">Dispute Resolution:</span>
                        <p className="text-muted-foreground mt-1">{parsedData.dispute_resolution_method}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Works Tab */}
        <TabsContent value="works" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Works & Catalog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedData.works && Array.isArray(parsedData.works) && parsedData.works.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Catalog Works ({parsedData.works.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parsedData.works.map((work: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-medium">{work.title || `Work ${index + 1}`}</div>
                        {work.artist && (
                          <div className="text-sm text-muted-foreground">Artist: {work.artist}</div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          {work.isrc && <span>ISRC: {work.isrc}</span>}
                          {work.iswc && <span>ISWC: {work.iswc}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h4 className="font-medium mb-2">No Works Listed</h4>
                  <p>This contract may cover works listed in a separate schedule or attachment.</p>
                  {parsedData.acquired_work_list_url && (
                    <div className="mt-4">
                      <span className="font-medium">Work List Reference:</span>
                      <p className="text-sm">{parsedData.acquired_work_list_url}</p>
                    </div>
                  )}
                </div>
              )}

              {(parsedData.metadata_delivered || parsedData.sound_file_delivered || parsedData.work_registration_delivered) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Delivery Requirements</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {parsedData.metadata_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Metadata:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                      {parsedData.sound_file_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Audio Files:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                      {parsedData.work_registration_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Registrations:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                      {parsedData.lead_sheets_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Lead Sheets:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                      {parsedData.lyrics_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Lyrics:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                      {parsedData.masters_delivered && (
                        <div className="flex items-center justify-between">
                          <span>Masters:</span>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};