
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link2, Unlink2 } from "lucide-react";

interface BasicInfoTabProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: any;
  linkedCopyright: any;
  onShowSongMatch: () => void;
  onCopyrightUnlink: () => void;
}

export function BasicInfoTab({
  register,
  setValue,
  watch,
  errors,
  linkedCopyright,
  onShowSongMatch,
  onCopyrightUnlink
}: BasicInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Core details about the royalty allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copyright Linking Section */}
        <div className="space-y-3">
          <Label>Copyright Link</Label>
          {linkedCopyright ? (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">{linkedCopyright.work_title}</p>
                  <p className="text-sm text-muted-foreground">ID: {linkedCopyright.work_id}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopyrightUnlink}
              >
                <Unlink2 className="h-4 w-4 mr-1" />
                Unlink
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onShowSongMatch}
              className="w-full"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link to Copyright
            </Button>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="song_title">Song Title *</Label>
            <Input
              id="song_title"
              {...register("song_title")}
              placeholder="Enter song title"
            />
            {errors.song_title && (
              <p className="text-sm text-destructive mt-1">
                {errors.song_title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              {...register("artist")}
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gross_royalty_amount">Gross Amount *</Label>
            <Input
              id="gross_royalty_amount"
              type="number"
              step="0.01"
              {...register("gross_royalty_amount", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.gross_royalty_amount && (
              <p className="text-sm text-destructive mt-1">
                {errors.gross_royalty_amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="controlled_status">Status</Label>
            <Select 
              onValueChange={(value) => setValue("controlled_status", value as "Controlled" | "Non-Controlled")}
              defaultValue={watch("controlled_status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Controlled">Controlled</SelectItem>
                <SelectItem value="Non-Controlled">Non-Controlled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="recoupable_expenses"
            {...register("recoupable_expenses")}
          />
          <Label htmlFor="recoupable_expenses">Recoupable Expenses</Label>
        </div>
      </CardContent>
    </Card>
  );
}
