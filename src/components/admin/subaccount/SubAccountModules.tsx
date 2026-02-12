import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileText, Scale, Music, Users, CheckCircle2 } from 'lucide-react';

interface ModuleAccess {
  id: string;
  module_id: string;
  enabled: boolean;
}

interface SubAccountModulesProps {
  companyId: string;
  onUpdate: () => void;
}

const AVAILABLE_MODULES = [
  {
    name: 'catalog_valuation',
    label: 'Catalog Valuation',
    description: 'Music catalog valuation and analysis tools',
    icon: DollarSign,
    financial: false,
  },
  {
    name: 'contract_management',
    label: 'Contract Management',
    description: 'Legal contract creation and management',
    icon: FileText,
    financial: true,
  },
  {
    name: 'copyright_management',
    label: 'Copyright Management',
    description: 'Copyright registration and ownership tracking',
    icon: Scale,
    financial: false,
  },
  {
    name: 'royalty_processing',
    label: 'Royalty Processing',
    description: 'Royalty calculation and distribution',
    icon: DollarSign,
    financial: true,
  },
  {
    name: 'sync_licensing',
    label: 'Sync Licensing',
    description: 'Synchronization licensing management',
    icon: Music,
    financial: true,
  },
  {
    name: 'client_portal',
    label: 'Client Portal',
    description: 'Client communication and data sharing',
    icon: Users,
    financial: false,
  },
];

export function SubAccountModules({ companyId, onUpdate }: SubAccountModulesProps) {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyTier, setCompanyTier] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModuleAccess();
    fetchCompanyTier();
  }, [companyId]);

  // Auto-enable all modules for enterprise tier sub-accounts
  useEffect(() => {
    if (!loading && companyTier && (companyTier === 'enterprise' || companyTier === 'enterprise_internal')) {
      autoEnableAllModules();
    }
  }, [loading, companyTier]);

  const fetchCompanyTier = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('subscription_tier')
        .eq('id', companyId)
        .single();
      if (!error && data) {
        setCompanyTier(data.subscription_tier);
      }
    } catch (error) {
      console.error('Error fetching company tier:', error);
    }
  };

  const autoEnableAllModules = async () => {
    const missingModules = AVAILABLE_MODULES.filter(
      (m) => !moduleAccess.find((a) => a.module_id === m.name && a.enabled)
    );
    if (missingModules.length === 0) return;

    for (const mod of missingModules) {
      const existing = moduleAccess.find((a) => a.module_id === mod.name);
      if (existing) {
        await supabase.from('company_module_access').update({ enabled: true }).eq('id', existing.id);
      } else {
        await supabase.from('company_module_access').insert({ company_id: companyId, module_id: mod.name, enabled: true });
      }
    }
    fetchModuleAccess();
  };

  const fetchModuleAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_module_access')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      setModuleAccess(data || []);
    } catch (error) {
      console.error('Error fetching module access:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      setSaving(true);

      const existingAccess = moduleAccess.find((m) => m.module_id === moduleId);

      if (existingAccess) {
        const { error } = await supabase
          .from('company_module_access')
          .update({ enabled })
          .eq('id', existingAccess.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_module_access')
          .insert({
            company_id: companyId,
            module_id: moduleId,
            enabled,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Module access ${enabled ? 'granted' : 'revoked'}`,
      });

      await fetchModuleAccess();
    } catch (error) {
      console.error('Error toggling module:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module access',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const isModuleActive = (moduleId: string) => {
    const access = moduleAccess.find((m) => m.module_id === moduleId);
    return access?.enabled || false;
  };

  const activeModulesCount = AVAILABLE_MODULES.filter((m) => isModuleActive(m.name)).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Module Access Overview
          </CardTitle>
          <CardDescription>
            {activeModulesCount} of {AVAILABLE_MODULES.length} modules enabled
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Module Cards */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading modules...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_MODULES.map((module) => {
            const Icon = module.icon;
            const active = isModuleActive(module.name);

            return (
              <Card key={module.name} className={active ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{module.label}</CardTitle>
                        {module.financial && (
                          <Badge variant="outline" className="mt-1">
                            Financial
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={active}
                      onCheckedChange={(checked) => handleToggleModule(module.name, checked)}
                      disabled={saving}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
