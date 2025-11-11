import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, DollarSign, FileText, Music, Scale, Users, CheckCircle2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface ModuleAccess {
  id: string;
  module_id: string;
  enabled: boolean;
}

interface ManageSubAccountModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
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

export function ManageSubAccountModulesDialog({ open, onOpenChange, company, onSuccess }: ManageSubAccountModulesDialogProps) {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchModuleAccess();
    }
  }, [open, company.id]);

  const fetchModuleAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_module_access')
        .select('*')
        .eq('company_id', company.id);

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
        // Update existing access
        const { error } = await supabase
          .from('company_module_access')
          .update({ enabled })
          .eq('id', existingAccess.id);

        if (error) throw error;
      } else {
        // Create new access
        const { error } = await supabase
          .from('company_module_access')
          .insert({
            company_id: company.id,
            module_id: moduleId,
            enabled,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Module access ${enabled ? 'granted' : 'revoked'}`,
      });

      fetchModuleAccess();
      onSuccess();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Module Access - {company.name}</DialogTitle>
          <DialogDescription>
            Control which modules this sub-account can access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Active Modules
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

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Financial</Badge>
              <span>Requires financial data access approval</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
