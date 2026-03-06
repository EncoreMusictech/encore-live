import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Eye, RotateCcw, Upload, Loader2, X, Crop, Mail } from 'lucide-react';
import { hslStringToHex, hexToHslString } from '@/lib/color-utils';
import { LogoCropper } from './LogoCropper';

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
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelected = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 2MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropperOpen(false);
    setUploading(true);
    try {
      const path = `${companyId}/logo-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(path);
      setBranding(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: 'Logo uploaded', description: 'Your cropped logo has been uploaded.' });
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast({ title: 'Upload failed', description: err.message || 'Failed to upload logo.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

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
                <Label>Logo</Label>
                {/* Current logo preview */}
                {branding.logo_url && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <img
                      src={branding.logo_url}
                      alt="Current logo"
                      className="w-12 h-12 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {branding.logo_url.split('/').pop()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 shrink-0"
                      onClick={() => {
                        setRawImageSrc(branding.logo_url);
                        setCropperOpen(true);
                      }}
                      title="Re-crop logo"
                    >
                      <Crop className="h-4 w-4 mr-1" />
                      <span className="text-xs">Re-crop</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => setBranding(prev => ({ ...prev, logo_url: '' }))}
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {/* Upload or paste URL */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="shrink-0"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <Input
                    placeholder="or paste logo URL"
                    value={branding.logo_url}
                    onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  <strong>Recommended:</strong> Transparent <strong>PNG</strong> with no background, 512×512px (square). Min 128×128px. Under 2MB. A crop tool will appear after selecting a file to ensure correct sizing.
                </p>

                <LogoCropper
                  open={cropperOpen}
                  imageSrc={rawImageSrc}
                  onClose={() => { setCropperOpen(false); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                  onCropComplete={handleCropComplete}
                />
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
                    <input
                      type="color"
                      value={hslStringToHex(branding.colors[key])}
                      onChange={(e) =>
                        setBranding(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: hexToHslString(e.target.value) },
                        }))
                      }
                      className="w-10 h-10 rounded-md border border-border shrink-0 cursor-pointer p-0.5 bg-transparent"
                      title="Pick a color"
                    />
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
              </div>
            </CardContent>
           </Card>

          {/* Send Test Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a branded test email to verify your whitelabel configuration looks correct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  disabled={sendingTest || !testEmail}
                  onClick={async () => {
                    setSendingTest(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('send-test-email', {
                        body: { company_id: companyId, to_email: testEmail },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      toast({ title: 'Test email sent', description: `Branded test email sent to ${testEmail}.` });
                    } catch (err: any) {
                      console.error('Test email error:', err);
                      toast({ title: 'Failed', description: err.message || 'Could not send test email.', variant: 'destructive' });
                    } finally {
                      setSendingTest(false);
                    }
                  }}
                >
                  {sendingTest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {sendingTest ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Save your branding settings before sending a test email to see the latest changes.
              </p>
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
