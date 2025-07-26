import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContractBasicInfoProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
}

export function ContractBasicInfo({ data, onChange, contractType }: ContractBasicInfoProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agreement Information</CardTitle>
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
                value={data.title || ""}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Enter agreement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty">Counterparty Name *</Label>
              <Input
                id="counterparty"
                value={data.counterparty_name || data.counterpartyName || ""}
                onChange={(e) => updateData('counterparty_name', e.target.value)}
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
                      !data.effective_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.effective_date ? format(new Date(data.effective_date), "PPP") : "Select effective date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.effective_date ? new Date(data.effective_date) : undefined}
                    onSelect={(date) => updateData('effective_date', date)}
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
                      !data.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.end_date ? format(new Date(data.end_date), "PPP") : "Select expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.end_date ? new Date(data.end_date) : undefined}
                    onSelect={(date) => updateData('end_date', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="territory">Territory</Label>
              <Select 
                value={data.territory || "worldwide"}
                onValueChange={(value) => updateData('territory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select territory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worldwide">Worldwide</SelectItem>
                  <SelectItem value="north_america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governing_law">Governing Law</Label>
              <Select 
                value={data.governing_law || ""}
                onValueChange={(value) => updateData('governing_law', value)}
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
              value={data.notes || ""}
              onChange={(e) => updateData('notes', e.target.value)}
              placeholder="Any additional information or special terms"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}