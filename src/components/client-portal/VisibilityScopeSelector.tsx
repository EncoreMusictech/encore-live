import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Eye, Users, Building2, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { VisibilityScope } from '@/hooks/useClientVisibilityScope';

interface VisibilityScopeSelectorProps {
  value: VisibilityScope;
  onChange: (scope: VisibilityScope) => void;
}

export function VisibilityScopeSelector({ value, onChange }: VisibilityScopeSelectorProps) {
  const { user } = useAuth();
  const [availableArtists, setAvailableArtists] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<{ id: string; name: string }[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Fetch available artists and labels from user's data
  useEffect(() => {
    if (!user) return;
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        // Get unique artist names from copyright_writers
        const { data: writers } = await supabase
          .from('copyright_writers')
          .select('writer_name, copyrights!inner(user_id)')
          .eq('copyrights.user_id', user.id);

        if (writers) {
          const uniqueNames = [...new Set(writers.map((w: any) => w.writer_name).filter(Boolean))];
          setAvailableArtists(uniqueNames as string[]);
        }

        // Get child companies (labels) for this user's company
        const { data: membership } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (membership?.company_id) {
          const { data: childCompanies } = await supabase
            .from('companies')
            .select('id, display_name')
            .eq('parent_company_id', membership.company_id);

          if (childCompanies) {
            setAvailableLabels(childCompanies.map(c => ({ id: c.id, name: c.display_name })));
          }
        }
      } catch (err) {
        console.error('Error loading scope options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [user]);

  const handleScopeTypeChange = (type: string) => {
    onChange({
      scope_type: type as VisibilityScope['scope_type'],
      artists: type === 'artist' ? (value.artists || []) : undefined,
      labels: type === 'label' ? (value.labels || []) : undefined,
      work_ids: type === 'custom' ? (value.work_ids || []) : undefined,
      contract_ids: type === 'custom' ? (value.contract_ids || []) : undefined,
      sync_ids: type === 'custom' ? (value.sync_ids || []) : undefined,
      royalty_ids: type === 'custom' ? (value.royalty_ids || []) : undefined,
    });
  };

  const addArtist = (name: string) => {
    if (!name || value.artists?.includes(name)) return;
    onChange({ ...value, artists: [...(value.artists || []), name] });
    setNewItem('');
  };

  const removeArtist = (name: string) => {
    onChange({ ...value, artists: (value.artists || []).filter(a => a !== name) });
  };

  const toggleLabel = (labelId: string) => {
    const current = value.labels || [];
    if (current.includes(labelId)) {
      onChange({ ...value, labels: current.filter(l => l !== labelId) });
    } else {
      onChange({ ...value, labels: [...current, labelId] });
    }
  };

  const scopeTypeDescriptions: Record<string, string> = {
    all: 'Client can see all assets you share with them',
    artist: 'Client can only see works by specific artists/writers',
    label: 'Client can only see assets under specific labels',
    custom: 'Manually select specific works, contracts, and royalties',
  };

  const scopeTypeIcons: Record<string, React.ReactNode> = {
    all: <Eye className="h-4 w-4" />,
    artist: <Users className="h-4 w-4" />,
    label: <Building2 className="h-4 w-4" />,
    custom: <Music className="h-4 w-4" />,
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Visibility Scope
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Control what data this client can see in their portal
        </p>
      </div>

      <Select value={value.scope_type} onValueChange={handleScopeTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              {scopeTypeIcons.all}
              <span>All Assets</span>
            </div>
          </SelectItem>
          <SelectItem value="artist">
            <div className="flex items-center gap-2">
              {scopeTypeIcons.artist}
              <span>By Artist / Writer</span>
            </div>
          </SelectItem>
          <SelectItem value="label">
            <div className="flex items-center gap-2">
              {scopeTypeIcons.label}
              <span>By Label / Client Company</span>
            </div>
          </SelectItem>
          <SelectItem value="custom">
            <div className="flex items-center gap-2">
              {scopeTypeIcons.custom}
              <span>Custom Selection</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground italic">
        {scopeTypeDescriptions[value.scope_type]}
      </p>

      {/* Artist scope configuration */}
      {value.scope_type === 'artist' && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <Label className="text-sm">Select Artists / Writers</Label>
          
          {availableArtists.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableArtists.map(name => {
                const selected = value.artists?.includes(name);
                return (
                  <Badge
                    key={name}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => selected ? removeArtist(name) : addArtist(name)}
                  >
                    {name}
                    {selected && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add artist name manually..."
              className="flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArtist(newItem); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => addArtist(newItem)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {(value.artists?.length ?? 0) > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Selected ({value.artists?.length}):</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {value.artists?.map(name => (
                  <Badge key={name} variant="secondary" className="gap-1">
                    {name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeArtist(name)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label scope configuration */}
      {value.scope_type === 'label' && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <Label className="text-sm">Select Labels / Client Companies</Label>
          
          {loadingOptions ? (
            <p className="text-xs text-muted-foreground">Loading labels...</p>
          ) : availableLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map(label => {
                const selected = value.labels?.includes(label.id);
                return (
                  <Badge
                    key={label.id}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleLabel(label.id)}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {label.name}
                    {selected && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No child labels found. Create client labels first in Client Management.
            </p>
          )}

          {(value.labels?.length ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {value.labels?.length} label{(value.labels?.length ?? 0) !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {/* Custom scope info */}
      {value.scope_type === 'custom' && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            With custom selection, use the <strong>Data Associations</strong> tab to manually link specific works, 
            contracts, and royalties to this client. Only explicitly linked items will be visible.
          </p>
        </div>
      )}
    </div>
  );
}
