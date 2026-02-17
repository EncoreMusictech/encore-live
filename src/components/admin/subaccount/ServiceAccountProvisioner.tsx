import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServiceAccountProvisionerProps {
  companyId: string;
  companyName: string;
  companySlug?: string;
}

/**
 * Displays service account status for a sub-account and lets admins provision one if missing.
 * The service account is a virtual auth user that is used as the identity for all write
 * operations performed by ENCORE admins in "View as" mode, ensuring data is correctly
 * scoped to the sub-account's buckets. Audit logs still record the real Encore admin.
 */
export function ServiceAccountProvisioner({
  companyId,
  companyName,
  companySlug,
}: ServiceAccountProvisionerProps) {
  const { toast } = useToast();
  const [serviceAccount, setServiceAccount] = useState<{
    service_user_id: string;
    service_email: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  const checkServiceAccount = async () => {
    setChecking(true);
    try {
      const { data } = await supabase
        .from('company_service_accounts')
        .select('service_user_id, service_email')
        .eq('company_id', companyId)
        .maybeSingle();
      setServiceAccount(data || null);
    } catch (err) {
      console.error('Failed to check service account:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkServiceAccount();
  }, [companyId]);

  const provisionServiceAccount = async () => {
    setProvisioning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-service-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            companyId,
            companyName,
            companySlug,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to provision service account');
      }

      toast({
        title: result.alreadyExisted ? 'Service Account Found' : 'Service Account Created',
        description: result.alreadyExisted
          ? `Service account already existed for ${companyName}.`
          : `Service account provisioned: ${result.serviceEmail}`,
      });

      await checkServiceAccount();
    } catch (err: any) {
      console.error('Provisioning error:', err);
      toast({
        title: 'Provisioning Failed',
        description: err.message || 'Could not create service account.',
        variant: 'destructive',
      });
    } finally {
      setProvisioning(false);
    }
  };

  if (checking) return null;

  if (serviceAccount) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-xs border-primary/40 text-primary cursor-default">
              <CheckCircle2 className="h-3 w-3" />
              Service Account Active
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs font-mono">{serviceAccount.service_email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              All actions in View-as mode are attributed to this account so data stays scoped to {companyName}. Audit logs still show the Encore admin.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={provisionServiceAccount}
            disabled={provisioning}
            className="gap-1.5 text-xs"
          >
            {provisioning ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Shield className="h-3 w-3" />
            )}
            {provisioning ? 'Creating…' : 'Provision Service Account'}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            Creates a virtual service account for {companyName}. Required so View-as actions are correctly scoped to this sub-account's data.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
