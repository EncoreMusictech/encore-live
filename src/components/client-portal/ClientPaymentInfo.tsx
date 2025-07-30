import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Download, CreditCard, Building, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ClientPaymentInfoProps {
  permissions: Record<string, any>;
}

interface PaymentInfo {
  bank_name?: string;
  account_type?: string;
  routing_number?: string;
  account_number?: string;
  account_holder_name?: string;
  w9_status?: string;
  w9_date_submitted?: string;
  tax_id?: string;
  business_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  w9_url?: string;
  direct_deposit_url?: string;
}

export const ClientPaymentInfo = ({ permissions }: ClientPaymentInfoProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('payment_info, name, email, phone, address, tax_id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching payment info:', error);
          return;
        }

        if (data?.payment_info) {
          setPaymentInfo(data.payment_info as PaymentInfo);
        }
      } catch (error) {
        console.error('Error fetching payment info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [user]);

  const handleSavePaymentInfo = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .upsert({
          user_id: user.id,
          name: user.email || 'Client',
          email: user.email,
          payment_info: paymentInfo as any,
          contact_type: 'client'
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment information saved successfully",
      });
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast({
        title: "Error",
        description: "Failed to save payment information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'w9' | 'direct_deposit') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${user?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const updatedInfo = {
        ...paymentInfo,
        [`${type}_url`]: publicUrl,
        ...(type === 'w9' && { 
          w9_status: 'submitted',
          w9_date_submitted: new Date().toISOString().split('T')[0]
        })
      };

      setPaymentInfo(updatedInfo);

      toast({
        title: "Success",
        description: `${type === 'w9' ? 'W-9 form' : 'Direct deposit form'} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading payment information...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Payment Information</h2>
        <p className="text-muted-foreground">
          Manage your tax forms and direct deposit information for payments.
        </p>
      </div>

      <Tabs defaultValue="direct-deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="direct-deposit" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Direct Deposit
          </TabsTrigger>
          <TabsTrigger value="tax-forms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tax Forms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct-deposit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Banking Information
              </CardTitle>
              <CardDescription>
                Enter your banking details for direct deposit payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={paymentInfo.bank_name || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Enter your bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select 
                    value={paymentInfo.account_type || ''} 
                    onValueChange={(value) => setPaymentInfo(prev => ({ ...prev, account_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="routing_number">Routing Number</Label>
                  <Input
                    id="routing_number"
                    value={paymentInfo.routing_number || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, routing_number: e.target.value }))}
                    placeholder="9-digit routing number"
                    maxLength={9}
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    type="password"
                    value={paymentInfo.account_number || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Account number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account_holder_name">Account Holder Name</Label>
                <Input
                  id="account_holder_name"
                  value={paymentInfo.account_holder_name || ''}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  placeholder="Name as it appears on the account"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePaymentInfo} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Banking Info'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Direct Deposit Form Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Direct Deposit Authorization
              </CardTitle>
              <CardDescription>
                Upload your signed direct deposit authorization form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentInfo.direct_deposit_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">Direct deposit form on file</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(paymentInfo.direct_deposit_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your signed direct deposit authorization form
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'direct_deposit');
                      }}
                      className="hidden"
                      id="direct-deposit-upload"
                    />
                    <Label htmlFor="direct-deposit-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax-forms" className="space-y-6">
          {/* W-9 Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                W-9 Tax Form
                {paymentInfo.w9_status && (
                  <Badge variant={paymentInfo.w9_status === 'submitted' ? 'default' : 'secondary'}>
                    {paymentInfo.w9_status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Complete and submit your W-9 form for tax reporting purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="business_name">Name or Business Name</Label>
                  <Input
                    id="business_name"
                    value={paymentInfo.business_name || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Individual name or business name"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_id">Tax ID (SSN/EIN)</Label>
                  <Input
                    id="tax_id"
                    type="password"
                    value={paymentInfo.tax_id || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                    placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={paymentInfo.address || ''}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address, city, state, ZIP code"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={paymentInfo.city || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={paymentInfo.state || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={paymentInfo.zip_code || ''}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="ZIP code"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePaymentInfo} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Tax Info'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* W-9 Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Completed W-9
              </CardTitle>
              <CardDescription>
                Upload your completed and signed W-9 form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentInfo.w9_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-green-800">W-9 form submitted</span>
                      {paymentInfo.w9_date_submitted && (
                        <p className="text-sm text-green-600">
                          Submitted on {new Date(paymentInfo.w9_date_submitted).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(paymentInfo.w9_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your completed W-9 form
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'w9');
                      }}
                      className="hidden"
                      id="w9-upload"
                    />
                    <Label htmlFor="w9-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};