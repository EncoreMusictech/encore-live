import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useCopyright } from "@/hooks/useCopyright";

interface ScheduleWorksTableProps {
  contractId: string;
}

export function ScheduleWorksTable({ contractId }: ScheduleWorksTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { contracts, addScheduleWork, removeScheduleWork } = useContracts();
  const { copyrights } = useCopyright();

  const contract = contracts.find(c => c.id === contractId);
  const scheduleWorks = contract?.schedule_works || [];

  const [formData, setFormData] = useState({
    copyright_id: "",
    work_id: "",
    song_title: "",
    artist_name: "",
    album_title: "",
    isrc: "",
    iswc: "",
    inherits_royalty_splits: true,
    inherits_recoupment_status: true,
    inherits_controlled_status: true,
    work_specific_advance: 0,
    work_specific_rate_reduction: 0,
  });

  const handleAddWork = async () => {
    try {
      await addScheduleWork(contractId, formData);
      setIsAddDialogOpen(false);
      setFormData({
        copyright_id: "",
        work_id: "",
        song_title: "",
        artist_name: "",
        album_title: "",
        isrc: "",
        iswc: "",
        inherits_royalty_splits: true,
        inherits_recoupment_status: true,
        inherits_controlled_status: true,
        work_specific_advance: 0,
        work_specific_rate_reduction: 0,
      });
    } catch (error) {
      console.error('Error adding work:', error);
    }
  };

  const handleRemoveWork = async (workId: string) => {
    try {
      await removeScheduleWork(workId);
    } catch (error) {
      console.error('Error removing work:', error);
    }
  };

  const handleCopyrightSelect = (copyrightId: string) => {
    const copyright = copyrights.find(c => c.id === copyrightId);
    if (copyright) {
      setFormData({
        ...formData,
        copyright_id: copyrightId,
        song_title: copyright.work_title,
        work_id: copyright.work_id || "",
        iswc: copyright.iswc || "",
        album_title: copyright.album_title || "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Schedule of Works
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Work
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Work to Schedule</DialogTitle>
                  <DialogDescription>
                    Link a work to this contract and configure inheritance settings
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6">
                  {/* Copyright Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="copyright_select">Link to Existing Copyright (Optional)</Label>
                    <Select onValueChange={handleCopyrightSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from copyright catalog" />
                      </SelectTrigger>
                      <SelectContent>
                        {copyrights.map(copyright => (
                          <SelectItem key={copyright.id} value={copyright.id}>
                            {copyright.work_title} {copyright.work_id && `(${copyright.work_id})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Work Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="song_title">Song Title *</Label>
                      <Input
                        id="song_title"
                        value={formData.song_title}
                        onChange={(e) => setFormData({...formData, song_title: e.target.value})}
                        placeholder="Song title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="artist_name">Artist Name</Label>
                      <Input
                        id="artist_name"
                        value={formData.artist_name}
                        onChange={(e) => setFormData({...formData, artist_name: e.target.value})}
                        placeholder="Recording artist"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="album_title">Album Title</Label>
                      <Input
                        id="album_title"
                        value={formData.album_title}
                        onChange={(e) => setFormData({...formData, album_title: e.target.value})}
                        placeholder="Album or release title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="work_id">Work ID</Label>
                      <Input
                        id="work_id"
                        value={formData.work_id}
                        onChange={(e) => setFormData({...formData, work_id: e.target.value})}
                        placeholder="Internal work identifier"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="isrc">ISRC</Label>
                      <Input
                        id="isrc"
                        value={formData.isrc}
                        onChange={(e) => setFormData({...formData, isrc: e.target.value})}
                        placeholder="International Standard Recording Code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="iswc">ISWC</Label>
                      <Input
                        id="iswc"
                        value={formData.iswc}
                        onChange={(e) => setFormData({...formData, iswc: e.target.value})}
                        placeholder="International Standard Work Code"
                      />
                    </div>
                  </div>

                  {/* Inheritance Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Inheritance Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inherits_royalty_splits">Inherit Royalty Splits from Contract</Label>
                        <Switch
                          id="inherits_royalty_splits"
                          checked={formData.inherits_royalty_splits}
                          onCheckedChange={(checked) => setFormData({...formData, inherits_royalty_splits: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inherits_recoupment_status">Inherit Recoupment Status</Label>
                        <Switch
                          id="inherits_recoupment_status"
                          checked={formData.inherits_recoupment_status}
                          onCheckedChange={(checked) => setFormData({...formData, inherits_recoupment_status: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inherits_controlled_status">Inherit Controlled Status</Label>
                        <Switch
                          id="inherits_controlled_status"
                          checked={formData.inherits_controlled_status}
                          onCheckedChange={(checked) => setFormData({...formData, inherits_controlled_status: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work-Specific Overrides */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Work-Specific Overrides</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="work_specific_advance">Work-Specific Advance ($)</Label>
                        <Input
                          id="work_specific_advance"
                          type="number"
                          min="0"
                          value={formData.work_specific_advance}
                          onChange={(e) => setFormData({...formData, work_specific_advance: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="work_specific_rate_reduction">Work-Specific Rate Reduction (%)</Label>
                        <Input
                          id="work_specific_rate_reduction"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.work_specific_rate_reduction}
                          onChange={(e) => setFormData({...formData, work_specific_rate_reduction: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddWork} disabled={!formData.song_title}>
                      Add Work
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Works linked to this contract inherit royalty and party metadata
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {scheduleWorks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No works in schedule yet. Click "Add Work" to link works to this contract.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Song Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Work ID</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>Inheritance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="font-medium">{work.song_title}</div>
                      {work.iswc && (
                        <div className="text-sm text-muted-foreground">ISWC: {work.iswc}</div>
                      )}
                    </TableCell>
                    <TableCell>{work.artist_name || '-'}</TableCell>
                    <TableCell>{work.album_title || '-'}</TableCell>
                    <TableCell>{work.work_id || '-'}</TableCell>
                    <TableCell>{work.isrc || '-'}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {work.inherits_royalty_splits && <div>✓ Royalty Splits</div>}
                        {work.inherits_recoupment_status && <div>✓ Recoupment</div>}
                        {work.inherits_controlled_status && <div>✓ Controlled Status</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {work.copyright_id && (
                          <Button variant="ghost" size="sm" title="View in Copyright Module">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWork(work.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}