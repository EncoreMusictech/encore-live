import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/contexts/TenantContext';
import { Upload, Palette, Globe, Settings, Users, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BrandConfigurationPanel() {
  const { tenantConfig, updateTenantConfig, loading } = useTenant();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tenant_name: tenantConfig?.tenant_name || '',
    tenant_slug: tenantConfig?.tenant_slug || '',
    brand_config: {
      logo_url: tenantConfig?.brand_config?.logo_url || '',
      favicon_url: tenantConfig?.brand_config?.favicon_url || '',
      brand_colors: {
        primary: tenantConfig?.brand_config?.brand_colors?.primary || '254 100% 76%',
        secondary: tenantConfig?.brand_config?.brand_colors?.secondary || '0 0% 15%',
        accent: tenantConfig?.brand_config?.brand_colors?.accent || '39 35% 64%',
        background: tenantConfig?.brand_config?.brand_colors?.background || '0 0% 0%',
        foreground: tenantConfig?.brand_config?.brand_colors?.foreground || '0 0% 90%',
      },
      fonts: {
        heading: tenantConfig?.brand_config?.fonts?.heading || 'Space Grotesk',
        body: tenantConfig?.brand_config?.fonts?.body || 'Inter',
      },
    },
    custom_domain: tenantConfig?.custom_domain || '',
    subdomain: tenantConfig?.subdomain || '',
    ssl_enabled: tenantConfig?.ssl_enabled ?? true,
    company_info: {
      company_name: tenantConfig?.company_info?.company_name || '',
      contact_email: tenantConfig?.company_info?.contact_email || '',
      support_email: tenantConfig?.company_info?.support_email || '',
      website: tenantConfig?.company_info?.website || '',
      address: tenantConfig?.company_info?.address || {},
    },
    enabled_modules: tenantConfig?.enabled_modules || [],
  });

  const availableModules = [
    'catalog-valuation',
    'deal-simulator',
    'contract-management',
    'copyright-management',
    'royalties-processing',
    'sync-licensing',
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTenantConfig(formData);
      toast({
        title: 'Configuration saved',
        description: 'Your whitelabel configuration has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: 'Failed to update your whitelabel configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const updatedModules = formData.enabled_modules.includes(moduleId)
      ? formData.enabled_modules.filter(id => id !== moduleId)
      : [...formData.enabled_modules, moduleId];
    
    setFormData(prev => ({
      ...prev,
      enabled_modules: updatedModules,
    }));
  };

  if (loading) {
    return <div className="animate-pulse">Loading configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Whitelabel Configuration
          </CardTitle>
          <CardDescription>
            Customize your branded music rights management platform
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Customize your platform's visual appearance and brand elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={formData.brand_config.logo_url}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        brand_config: {
                          ...prev.brand_config,
                          logo_url: e.target.value,
                        },
                      }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      value={formData.brand_config.favicon_url}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        brand_config: {
                          ...prev.brand_config,
                          favicon_url: e.target.value,
                        },
                      }))}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Brand Colors (HSL format)</h4>
                  {Object.entries(formData.brand_config.brand_colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          value={value}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            brand_config: {
                              ...prev.brand_config,
                              brand_colors: {
                                ...prev.brand_config.brand_colors,
                                [key]: e.target.value,
                              },
                            },
                          }))}
                          placeholder="254 100% 76%"
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Set up custom domain and subdomain for your whitelabel platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom_domain">Custom Domain</Label>
                  <Input
                    id="custom_domain"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                    placeholder="music.yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                    placeholder="yourcompany"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ssl_enabled"
                  checked={formData.ssl_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ssl_enabled: checked }))}
                />
                <Label htmlFor="ssl_enabled">Enable SSL (HTTPS)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Configure your company details for the whitelabel platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_info.company_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      company_info: { ...prev.company_info, company_name: e.target.value },
                    }))}
                    placeholder="Your Company Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.company_info.website}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      company_info: { ...prev.company_info, website: e.target.value },
                    }))}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.company_info.contact_email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      company_info: { ...prev.company_info, contact_email: e.target.value },
                    }))}
                    placeholder="contact@yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.company_info.support_email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      company_info: { ...prev.company_info, support_email: e.target.value },
                    }))}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Enabled Modules</CardTitle>
              <CardDescription>
                Choose which modules to enable for your whitelabel platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModules.map((moduleId) => (
                  <div key={moduleId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">
                        {moduleId.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {moduleId} module functionality
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.enabled_modules.includes(moduleId) && (
                        <Badge variant="secondary">Enabled</Badge>
                      )}
                      <Switch
                        checked={formData.enabled_modules.includes(moduleId)}
                        onCheckedChange={() => toggleModule(moduleId)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview & Apply</CardTitle>
              <CardDescription>
                Review your configuration and apply changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Configuration Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Company:</strong> {formData.company_info.company_name || 'Not set'}
                  </div>
                  <div>
                    <strong>Domain:</strong> {formData.custom_domain || formData.subdomain || 'Not set'}
                  </div>
                  <div>
                    <strong>Enabled Modules:</strong> {formData.enabled_modules.length}
                  </div>
                  <div>
                    <strong>SSL:</strong> {formData.ssl_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}