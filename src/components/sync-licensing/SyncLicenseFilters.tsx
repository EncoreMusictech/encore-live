import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface SyncLicenseFilters {
  status?: string;
  mediaType?: string;
  paymentStatus?: string;
  agent?: string;
  searchTerm?: string;
}

interface SyncLicenseFiltersProps {
  filters: SyncLicenseFilters;
  onFiltersChange: (filters: SyncLicenseFilters) => void;
  activeFiltersCount: number;
}

const SyncLicenseFiltersComponent = ({
  filters,
  onFiltersChange,
  activeFiltersCount,
}: SyncLicenseFiltersProps) => {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof SyncLicenseFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== "all") {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Inquiry", label: "Inquiry" },
    { value: "Negotiating", label: "Negotiating" },
    { value: "Approved", label: "Approved" },
    { value: "Licensed", label: "Licensed" },
    { value: "Declined", label: "Declined" },
  ];

  const mediaTypeOptions = [
    { value: "all", label: "All Media Types" },
    { value: "TV", label: "TV" },
    { value: "Film", label: "Film" },
    { value: "Commercial", label: "Commercial" },
    { value: "Web", label: "Web" },
    { value: "Game", label: "Game" },
    { value: "Podcast", label: "Podcast" },
  ];

  const paymentStatusOptions = [
    { value: "all", label: "All Payment Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Paid in Full", label: "Paid in Full" },
    { value: "Partially Paid", label: "Partially Paid" },
    { value: "Overdue", label: "Overdue" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-background border border-border shadow-lg" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Filter Sync Deals</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by project title, sync ID..."
                value={filters.searchTerm || ""}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mediaType" className="text-sm font-medium">
                Media Type
              </Label>
              <Select
                value={filters.mediaType || "all"}
                onValueChange={(value) => updateFilter("mediaType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {mediaTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentStatus" className="text-sm font-medium">
                Payment Status
              </Label>
              <Select
                value={filters.paymentStatus || "all"}
                onValueChange={(value) => updateFilter("paymentStatus", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {paymentStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agent" className="text-sm font-medium">
                Agent/Contact
              </Label>
              <Input
                id="agent"
                placeholder="Filter by agent name..."
                value={filters.agent || ""}
                onChange={(e) => updateFilter("agent", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Active Filters</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(filters).map(([key, value]) => (
                    value && (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {key}: {value}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-foreground"
                          onClick={() => updateFilter(key as keyof SyncLicenseFilters, undefined)}
                        />
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SyncLicenseFiltersComponent;