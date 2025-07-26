import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormBasicInfoProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormBasicInfo: React.FC<ArtistAgreementFormBasicInfoProps> = ({
  data,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Artist Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="artistName">
              Artist Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="artistName"
              value={data.artistName}
              onChange={(e) => onChange({ artistName: e.target.value })}
              placeholder="Enter artist name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="legalName">
              Legal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legalName"
              value={data.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              placeholder="Enter legal name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stageName">Stage Name / Alias</Label>
            <Input
              id="stageName"
              value={data.stageName}
              onChange={(e) => onChange({ stageName: e.target.value })}
              placeholder="Enter stage name or alias"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Agreement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="territory">Territory</Label>
            <Select
              value={data.territory}
              onValueChange={(value) => onChange({ territory: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate">
              Effective Date <span className="text-destructive">*</span>
            </Label>
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
                  {data.effectiveDate ? (
                    format(new Date(data.effectiveDate), "PPP")
                  ) : (
                    <span>Select effective date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.effectiveDate ? new Date(data.effectiveDate) : undefined}
                  onSelect={(date) => onChange({ effectiveDate: date ? format(date, "yyyy-MM-dd") : "" })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
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
                  {data.expirationDate ? (
                    format(new Date(data.expirationDate), "PPP")
                  ) : (
                    <span>Perpetual or select end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.expirationDate ? new Date(data.expirationDate) : undefined}
                  onSelect={(date) => onChange({ expirationDate: date ? format(date, "yyyy-MM-dd") : "" })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};