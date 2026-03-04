import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, FileText, Users, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCallback, memo, useState } from "react";

const TERRITORY_OPTIONS = [
  { value: "worldwide", label: "Worldwide" },
  { value: "north_america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "uk", label: "United Kingdom" },
  { value: "us", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "asia_pacific", label: "Asia Pacific" },
  { value: "latin_america", label: "Latin America" },
];
interface ContractBasicInfoAndPartiesProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
  partyLabels?: {
    firstParty: string;
    secondParty: string;
  };
}

function ContractBasicInfoAndPartiesComponent({ 
  data, 
  onChange, 
  contractType,
  partyLabels = {
    firstParty: "First Party",
    secondParty: "Second Party"
  }
}: ContractBasicInfoAndPartiesProps) {
  const updateData = useCallback((field: string, value: any) => {
    onChange({ ...data, [field]: value });
  }, [onChange, data]);

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreement Information
          </CardTitle>
          <CardDescription>
            Basic details about the {contractType || 'contract'} agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Agreement Title *</Label>
              <Input
                id="title"
                defaultValue={data.agreementTitle || data.title || ""}
                onBlur={(e) => updateData('agreementTitle', e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Enter agreement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty">Counterparty Name *</Label>
              <Input
                id="counterparty"
                defaultValue={data.counterparty || data.counterparty_name || data.counterpartyName || ""}
                onBlur={(e) => updateData('counterparty', e.currentTarget.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Name of the other party"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.effectiveDate ? format(new Date(data.effectiveDate), "PPP") : "Select effective date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.effectiveDate ? new Date(data.effectiveDate) : undefined}
                    onSelect={(date) => updateData('effectiveDate', date?.toISOString().split('T')[0])}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.expirationDate ? format(new Date(data.expirationDate), "PPP") : "Select expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.expirationDate ? new Date(data.expirationDate) : undefined}
                    onSelect={(date) => updateData('expirationDate', date?.toISOString().split('T')[0])}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Territories</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal min-h-[40px] h-auto"
                  >
                    {(data.territories && data.territories.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {data.territories.map((t: string) => {
                          const opt = TERRITORY_OPTIONS.find(o => o.value === t);
                          return (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {opt?.label || t}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateData('territories', data.territories.filter((v: string) => v !== t));
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No territories selected (defaults to Worldwide)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="space-y-1">
                    {TERRITORY_OPTIONS.map((opt) => {
                      const selected = (data.territories || []).includes(opt.value);
                      return (
                        <div
                          key={opt.value}
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => {
                            const current: string[] = data.territories || [];
                            if (selected) {
                              updateData('territories', current.filter(v => v !== opt.value));
                            } else {
                              updateData('territories', [...current, opt.value]);
                            }
                          }}
                        >
                          <Checkbox checked={selected} />
                          <span className="text-sm">{opt.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Leave empty for Worldwide coverage. Select specific territories to restrict.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governing_law">Governing Law</Label>
              <Select 
                value={data.governingLaw || ""}
                onValueChange={(value) => updateData('governingLaw', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select governing law" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_york">New York</SelectItem>
                  <SelectItem value="california">California</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="australia">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              defaultValue={data.notes || ""}
              onBlur={(e) => updateData('notes', e.currentTarget.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              placeholder="Any additional information or special terms"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parties Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Party Information
          </CardTitle>
          <CardDescription>
            Contact details and information for all parties involved in this {contractType || 'agreement'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Party */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{partyLabels.firstParty}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  defaultValue={data.firstParty?.contactName || ""}
                  onBlur={(e) => updateData('firstParty', { ...data.firstParty, contactName: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  defaultValue={data.firstParty?.email || ""}
                  onBlur={(e) => updateData('firstParty', { ...data.firstParty, email: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  defaultValue={data.firstParty?.phone || ""}
                  onBlur={(e) => updateData('firstParty', { ...data.firstParty, phone: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  defaultValue={data.firstParty?.taxId || ""}
                  onBlur={(e) => updateData('firstParty', { ...data.firstParty, taxId: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                defaultValue={data.firstParty?.address || ""}
                onBlur={(e) => updateData('firstParty', { ...data.firstParty, address: e.currentTarget.value })}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Full mailing address"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Second Party */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{partyLabels.secondParty}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company/Contact Name</Label>
                <Input
                  defaultValue={data.secondParty?.contactName || ""}
                  onBlur={(e) => updateData('secondParty', { ...data.secondParty, contactName: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Company or contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  defaultValue={data.secondParty?.email || ""}
                  onBlur={(e) => updateData('secondParty', { ...data.secondParty, email: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  defaultValue={data.secondParty?.phone || ""}
                  onBlur={(e) => updateData('secondParty', { ...data.secondParty, phone: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  defaultValue={data.secondParty?.taxId || ""}
                  onBlur={(e) => updateData('secondParty', { ...data.secondParty, taxId: e.currentTarget.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Company tax ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Address</Label>
              <Textarea
                defaultValue={data.secondParty?.address || ""}
                onBlur={(e) => updateData('secondParty', { ...data.secondParty, address: e.currentTarget.value })}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
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

export const ContractBasicInfoAndParties = memo(ContractBasicInfoAndPartiesComponent);