import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddWriterDialogProps {
  companyId: string;
  entities: { id: string; entity_name: string }[];
  onAdded: () => void;
}

export function AddWriterDialog({ companyId, entities, onAdded }: AddWriterDialogProps) {
  const [open, setOpen] = useState(false);
  const [entityName, setEntityName] = useState('');
  const [administrator, setAdministrator] = useState('');
  const [originalPublisher, setOriginalPublisher] = useState('');
  const [writerNames, setWriterNames] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const names = writerNames
      .split('\n')
      .map(n => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one writer name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const rows = names.map(name => ({
        company_id: companyId,
        entity_name: entityName || null,
        administrator: administrator || null,
        original_publisher: originalPublisher || null,
        writer_name: name,
      }));

      const { error } = await supabase.from('migration_tracking_items').insert(rows);
      if (error) throw error;

      toast({ title: 'Success', description: `Added ${names.length} writer(s)` });
      setWriterNames('');
      setEntityName('');
      setAdministrator('');
      setOriginalPublisher('');
      setOpen(false);
      onAdded();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Writer(s)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Writer(s) to Migration Tracker</DialogTitle>
          <DialogDescription>Add one writer per line for bulk entry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Entity</Label>
            <Select value={entityName} onValueChange={setEntityName}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent>
                {entities.map(e => (
                  <SelectItem key={e.id} value={e.entity_name}>{e.entity_name}</SelectItem>
                ))}
                <SelectItem value="__other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {entityName === '__other' && (
            <div>
              <Label>Custom Entity Name</Label>
              <Input
                value={entityName === '__other' ? '' : entityName}
                onChange={e => setEntityName(e.target.value)}
                placeholder="Enter entity name..."
              />
            </div>
          )}
          <div>
            <Label>Administrator</Label>
            <Input value={administrator} onChange={e => setAdministrator(e.target.value)} placeholder="e.g. Kobalt" />
          </div>
          <div>
            <Label>Original Publisher</Label>
            <Input value={originalPublisher} onChange={e => setOriginalPublisher(e.target.value)} placeholder="e.g. PAQ Publishing" />
          </div>
          <div>
            <Label>Writer Name(s)</Label>
            <Textarea
              value={writerNames}
              onChange={e => setWriterNames(e.target.value)}
              placeholder={"John Doe\nJane Smith\nAlex Johnson"}
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">One writer per line for bulk entry</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
