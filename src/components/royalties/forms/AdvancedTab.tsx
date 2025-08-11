
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdvancedTabProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  batches: any[];
}

export function AdvancedTab({ register, setValue, batches }: AdvancedTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Fields</CardTitle>
        <CardDescription>
          Additional metadata and ENCORE standard fields
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quarter">Quarter</Label>
            <Input
              id="quarter"
              {...register("quarter")}
              placeholder="e.g., Q1 2024"
            />
          </div>

          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              {...register("source")}
              placeholder="e.g., Spotify, ASCAP"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="revenue_source">Revenue Source</Label>
            <Input
              id="revenue_source"
              {...register("revenue_source")}
              placeholder="e.g., Streaming, Performance"
            />
          </div>

          <div>
            <Label htmlFor="media_type">Media Type</Label>
            <Input
              id="media_type"
              {...register("media_type")}
              placeholder="e.g., Digital, Physical"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="country">Territory</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="e.g., US, UK, Global"
            />
          </div>

          <div>
            <Label htmlFor="batch_id">Batch</Label>
            <Select onValueChange={(value) => setValue("batch_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batch_id} - {batch.source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            {...register("comments")}
            placeholder="Additional notes about this royalty..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
