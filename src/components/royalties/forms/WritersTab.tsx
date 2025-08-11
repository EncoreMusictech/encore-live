
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, User } from "lucide-react";

interface WritersTabProps {
  writers: any[];
  loadingWriters: boolean;
  onAddWriter: () => void;
  onRemoveWriter: (writerId: string) => void;
  onUpdateWriter: (writerId: string, field: string, value: any) => void;
}

export function WritersTab({
  writers,
  loadingWriters,
  onAddWriter,
  onRemoveWriter,
  onUpdateWriter
}: WritersTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Writers & Ownership Splits</CardTitle>
            <CardDescription>
              {loadingWriters ? "Loading writers..." : "Manage writer ownership and revenue splits"}
            </CardDescription>
          </div>
          <Button type="button" onClick={onAddWriter} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Writer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingWriters ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading writers...</p>
          </div>
        ) : writers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No writers added yet.</p>
            <Button type="button" onClick={onAddWriter} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add First Writer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {writers.map((writer, index) => (
              <div key={writer.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Writer {index + 1}</span>
                    {writer.type === 'copyright_writer' && (
                      <Badge variant="outline">From Copyright</Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveWriter(writer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Writer Name</Label>
                    <Input
                      value={writer.name}
                      onChange={(e) => onUpdateWriter(writer.id, 'name', e.target.value)}
                      placeholder="Enter writer name"
                      disabled={writer.type === 'copyright_writer'}
                    />
                  </div>
                  <div>
                    <Label>Writer Share (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={writer.writer_share}
                      onChange={(e) => onUpdateWriter(writer.id, 'writer_share', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Performance (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={writer.performance_share}
                      onChange={(e) => onUpdateWriter(writer.id, 'performance_share', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Mechanical (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={writer.mechanical_share}
                      onChange={(e) => onUpdateWriter(writer.id, 'mechanical_share', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Sync (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={writer.synchronization_share}
                      onChange={(e) => onUpdateWriter(writer.id, 'synchronization_share', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
