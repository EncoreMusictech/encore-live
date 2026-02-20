import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, Edit2, Trash2, RefreshCw } from 'lucide-react';

interface PublishingEntity {
  id: string;
  company_id: string;
  name: string;
  display_name: string | null;
  administrator: string | null;
  administrator_type: string | null;
  ipi_number: string | null;
  cae_number: string | null;
  pro_affiliation: string | null;
  territory: string[] | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface EntityFormData {
  name: string;
  display_name: string;
  administrator: string;
  administrator_type: string;
  ipi_number: string;
  cae_number: string;
  pro_affiliation: string;
}

const emptyForm: EntityFormData = {
  name: '',
  display_name: '',
  administrator: '',
  administrator_type: 'third_party',
  ipi_number: '',
  cae_number: '',
  pro_affiliation: '',
};

interface PublishingEntitiesManagerProps {
  companyId: string;
  companyName: string;
}

export function PublishingEntitiesManager({ companyId, companyName }: PublishingEntitiesManagerProps) {
  const [entities, setEntities] = useState<PublishingEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<PublishingEntity | null>(null);
  const [form, setForm] = useState<EntityFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('publishing_entities')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching publishing entities:', error);
      toast({ title: 'Error', description: 'Failed to load publishing entities', variant: 'destructive' });
    } else {
      setEntities((data ?? []) as unknown as PublishingEntity[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, [companyId]);

  const openCreate = () => {
    setEditingEntity(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entity: PublishingEntity) => {
    setEditingEntity(entity);
    setForm({
      name: entity.name,
      display_name: entity.display_name || '',
      administrator: entity.administrator || '',
      administrator_type: entity.administrator_type || 'third_party',
      ipi_number: entity.ipi_number || '',
      cae_number: entity.cae_number || '',
      pro_affiliation: entity.pro_affiliation || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Entity name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      display_name: form.display_name.trim() || null,
      administrator: form.administrator.trim() || null,
      administrator_type: form.administrator_type || null,
      ipi_number: form.ipi_number.trim() || null,
      cae_number: form.cae_number.trim() || null,
      pro_affiliation: form.pro_affiliation.trim() || null,
    };

    if (editingEntity) {
      const { error } = await supabase
        .from('publishing_entities')
        .update(payload)
        .eq('id', editingEntity.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update entity', variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: `${form.name} updated successfully` });
        setDialogOpen(false);
        fetchEntities();
      }
    } else {
      const { error } = await supabase
        .from('publishing_entities')
        .insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Failed to create entity', variant: 'destructive' });
      } else {
        toast({ title: 'Created', description: `${form.name} created successfully` });
        setDialogOpen(false);
        fetchEntities();
      }
    }
    setSaving(false);
  };

  const handleDeactivate = async (entity: PublishingEntity) => {
    const newStatus = entity.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('publishing_entities')
      .update({ status: newStatus })
      .eq('id', entity.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `${entity.name} is now ${newStatus}` });
      fetchEntities();
    }
  };

  const adminTypeLabel = (type: string | null) => {
    switch (type) {
      case 'third_party': return 'Third Party';
      case 'self': return 'Self';
      case 'co_admin': return 'Co-Admin';
      default: return type || '—';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Publishing Entities
            </CardTitle>
            <CardDescription>
              Manage publishing entities and administrators for {companyName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEntities} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingEntity ? 'Edit' : 'Create'} Publishing Entity</DialogTitle>
                  <DialogDescription>
                    {editingEntity
                      ? 'Update entity details and administrator information.'
                      : 'Add a new publishing entity under this account.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Entity Name *</Label>
                    <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., PAQ / Kobalt" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input id="display_name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="e.g., PAQ Publishing (Kobalt)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="administrator">Administrator</Label>
                      <Input id="administrator" value={form.administrator} onChange={e => setForm(f => ({ ...f, administrator: e.target.value }))} placeholder="e.g., Kobalt" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="administrator_type">Admin Type</Label>
                      <Select value={form.administrator_type} onValueChange={v => setForm(f => ({ ...f, administrator_type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="third_party">Third Party</SelectItem>
                          <SelectItem value="self">Self-Administered</SelectItem>
                          <SelectItem value="co_admin">Co-Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ipi_number">IPI Number</Label>
                      <Input id="ipi_number" value={form.ipi_number} onChange={e => setForm(f => ({ ...f, ipi_number: e.target.value }))} placeholder="IPI #" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cae_number">CAE Number</Label>
                      <Input id="cae_number" value={form.cae_number} onChange={e => setForm(f => ({ ...f, cae_number: e.target.value }))} placeholder="CAE #" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pro_affiliation">PRO Affiliation</Label>
                    <Input id="pro_affiliation" value={form.pro_affiliation} onChange={e => setForm(f => ({ ...f, pro_affiliation: e.target.value }))} placeholder="e.g., ASCAP, BMI, SESAC" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : editingEntity ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No publishing entities configured</p>
              <p className="text-sm mt-1">Create entities to scope contracts, works, and royalties by administrator.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Name</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IPI</TableHead>
                  <TableHead>PRO</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map(entity => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-medium">{entity.name}</TableCell>
                    <TableCell>{entity.administrator || '—'}</TableCell>
                    <TableCell>{adminTypeLabel(entity.administrator_type)}</TableCell>
                    <TableCell className="font-mono text-xs">{entity.ipi_number || '—'}</TableCell>
                    <TableCell>{entity.pro_affiliation || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                        {entity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entity)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(entity)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
