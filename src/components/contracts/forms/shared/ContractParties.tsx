import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface ContractPartiesProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
  partyLabels?: {
    party1: string;
    party2: string;
  };
}

export function ContractParties({ 
  data, 
  onChange, 
  contractType,
  partyLabels = {
    party1: "First Party",
    party2: "Second Party"
  }
}: ContractPartiesProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Party Information</CardTitle>
          <CardDescription>
            Contact details and information for all parties involved in this {contractType || 'agreement'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Party */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{partyLabels.party1}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={data.party1_contact_name || data.contact_name || ""}
                  onChange={(e) => updateData('party1_contact_name', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={data.party1_email || data.recipient_email || ""}
                  onChange={(e) => updateData('party1_email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={data.party1_phone || data.contact_phone || ""}
                  onChange={(e) => updateData('party1_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  value={data.party1_tax_id || ""}
                  onChange={(e) => updateData('party1_tax_id', e.target.value)}
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={data.party1_address || data.contact_address || ""}
                onChange={(e) => updateData('party1_address', e.target.value)}
                placeholder="Full mailing address"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Second Party */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{partyLabels.party2}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company/Contact Name</Label>
                <Input
                  value={data.party2_contact_name || data.counterparty_name || ""}
                  onChange={(e) => updateData('party2_contact_name', e.target.value)}
                  placeholder="Company or contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={data.party2_email || ""}
                  onChange={(e) => updateData('party2_email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={data.party2_phone || ""}
                  onChange={(e) => updateData('party2_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  value={data.party2_tax_id || ""}
                  onChange={(e) => updateData('party2_tax_id', e.target.value)}
                  placeholder="Company tax ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Address</Label>
              <Textarea
                value={data.party2_address || ""}
                onChange={(e) => updateData('party2_address', e.target.value)}
                placeholder="Full business address"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}