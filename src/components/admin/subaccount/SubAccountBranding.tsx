import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Eye, RotateCcw } from 'lucide-react';

interface BrandingConfig {
  enabled: boolean;
  logo_url: string;
  display_name: string;
  colors: {
    primary: string;
    accent: string;
    headerBg: string;
  };
}

const DEFAULT_BRANDING: BrandingConfig = {
  enabled: false,
  logo_url: '',
  display_name: '',
  colors: {
    primary: '262 83% 58%',
    accent: '262 83% 58%',
    headerBg: '262 50% 30%',
  },
};

const COLOR_PRESETS = [
  { name: 'Blue', primary: '220 90% 56%', accent: '220 80% 65%', headerBg: '220 50% 25%' },
  { name: 'Teal', primary: '174 72% 40%', accent: '174 60% 50%', headerBg: '174 50% 20%' },
  { name: 'Red', primary: '0 72% 51%', accent: '0 60% 60%', headerBg: '0 50% 25%' },
  { name: 'Orange', primary: '25 95% 53%', accent: '25 80% 60%', headerBg: '25 50% 25%' },
  { name: 'Green', primary: '142 71% 45%', accent: '142 60% 55%', headerBg: '142 50% 20%' },
  { name: 'Gold', primary: '45 93% 47%', accent: '45 80% 55%', headerBg: '45 50% 22%' },
];

interface SubAccountBrandingProps {
  companyId: string;
}

export function SubAccountBranding({ companyId }: SubAccountBrandingProps) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBranding();
  }, [companyId]);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const settings = data?.settings as Record<string, any> | null;
      if (settings?.branding) {
        setBranding({ ...DEFAULT_BRANDING, ...settings.branding });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Fetch current settings first to merge
      const { data: current, error: fetchError } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (current?.settings as Record<string, any>) || {};
      const updatedSettings = { ...currentSettings, branding: branding as unknown as Record<string, any> };

      const { error } = await supabase
        .from('companies')
        .update({ settings: updatedSettings as any })
        .eq('id', companyId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Branding settings updated successfully.' });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({ title: 'Error', description: 'Failed to save branding settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBranding(prev => ({
      ...prev,
      colors: {
        primary: preset.primary,
        accent: preset.accent,
        headerBg: preset.headerBg,
      },
    }));
  };

  const handleResetToDefault = async () => {
    try {
      setSaving(true);

      const { data: current, error: fetchError } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (current?.settings as Record<string, any>) || {};
      const { branding: _, ...restSettings } = currentSettings;

      const { error } = await supabase
        .from('companies')
        .update({ settings: restSettings as any })
        .eq('id', companyId);

      if (error) throw error;

      setBranding(DEFAULT_BRANDING);
      toast({ title: 'Reset', description: 'Branding restored to default ENCORE theme.' });
    } catch (error) {
      console.error('Error resetting branding:', error);
      toast({ title: 'Error', description: 'Failed to reset branding.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading branding settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Whitelabel Branding
              </CardTitle>
              <CardDescription>
                Customize the Client Portal appearance for this sub-account's clients
              </CardDescription>
            </div>
            <Switch
              checked={branding.enabled}
              onCheckedChange={(checked) => setBranding(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </CardHeader>
      </Card>

      {branding.enabled && (
        <>
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity</CardTitle>
              <CardDescription>Logo and display name shown to clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={branding.logo_url}
                  onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Replaces the ENCORE vinyl record in the portal header</p>
              </div>
              <div className="space-y-2">
                <Label>Portal Display Name</Label>
                <Input
                  placeholder="e.g. Myind Sound"
                  value={branding.display_name}
                  onChange={(e) => setBranding(prev => ({ ...prev, display_name: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Replaces "Client Portal" in the header</p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Color Palette</CardTitle>
              <CardDescription>HSL values — click a preset or enter custom values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets */}
              <div>
                <Label className="mb-2 block">Quick Presets</Label>
                <div className="flex gap-3 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="flex flex-col items-center gap-1 group"
                      title={preset.name}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-border group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `hsl(${preset.primary})` }}
                      />
                      <span className="text-xs text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Inputs */}
              {[
                { key: 'primary' as const, label: 'Primary Color' },
                { key: 'accent' as const, label: 'Accent Color' },
                { key: 'headerBg' as const, label: 'Header Background' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="220 90% 56%"
                      value={branding.colors[key]}
                      onChange={(e) =>
                        setBranding(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: e.target.value },
                        }))
                      }
                      className="flex-1"
                    />
                    <div
                      className="w-8 h-8 rounded-md border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${branding.colors[key]})` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-6 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, hsl(${branding.colors.headerBg}), hsl(${branding.colors.primary}))`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {branding.display_name || 'Client Portal'}
                    </h3>
                    <p className="text-sm opacity-80 mt-1">Manage your works, contracts, and royalties</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {branding.logo_url ? (
                      <img
                        src={branding.logo_url}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-xs opacity-60">
                        No Logo
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs opacity-60">Powered by ENCORE</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        {branding.enabled && (
          <Button variant="outline" onClick={handleResetToDefault} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        )}
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </div>
    </div>
  );
}
