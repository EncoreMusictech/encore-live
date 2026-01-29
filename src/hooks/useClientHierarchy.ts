import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChildCompany {
  company_id: string;
  company_name: string;
  display_name: string;
  company_type: string;
}

interface CompanyHierarchy {
  id: string;
  name: string;
  display_name: string;
  company_type: string;
  parent_company_id: string | null;
  parent_company_name: string | null;
  child_count: number;
}

interface UseClientHierarchyReturn {
  childCompanies: ChildCompany[];
  companyHierarchy: CompanyHierarchy | null;
  loading: boolean;
  error: string | null;
  isPublishingFirm: boolean;
  hasChildren: boolean;
  fetchChildCompanies: (parentId: string) => Promise<ChildCompany[]>;
  fetchCompanyHierarchy: (companyId: string) => Promise<CompanyHierarchy | null>;
  createClientLabel: (parentId: string, name: string, displayName: string) => Promise<string | null>;
  updateCompanyType: (companyId: string, companyType: 'publishing_firm' | 'client_label' | 'standard') => Promise<boolean>;
  setParentCompany: (childId: string, parentId: string | null) => Promise<boolean>;
  refetch: () => void;
}

export function useClientHierarchy(companyId?: string): UseClientHierarchyReturn {
  const [childCompanies, setChildCompanies] = useState<ChildCompany[]>([]);
  const [companyHierarchy, setCompanyHierarchy] = useState<CompanyHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChildCompanies = useCallback(async (parentId: string): Promise<ChildCompany[]> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_child_companies', {
        _parent_id: parentId
      });

      if (rpcError) throw rpcError;
      return (data as ChildCompany[]) || [];
    } catch (err) {
      console.error('Error fetching child companies:', err);
      return [];
    }
  }, []);

  const fetchCompanyHierarchy = useCallback(async (id: string): Promise<CompanyHierarchy | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_company_with_hierarchy', {
        _company_id: id
      });

      if (rpcError) throw rpcError;
      
      if (data && data.length > 0) {
        return data[0] as CompanyHierarchy;
      }
      return null;
    } catch (err) {
      console.error('Error fetching company hierarchy:', err);
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [hierarchy, children] = await Promise.all([
        fetchCompanyHierarchy(companyId),
        fetchChildCompanies(companyId)
      ]);
      
      setCompanyHierarchy(hierarchy);
      setChildCompanies(children);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy data');
    } finally {
      setLoading(false);
    }
  }, [companyId, fetchCompanyHierarchy, fetchChildCompanies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createClientLabel = async (
    parentId: string,
    name: string,
    displayName: string
  ): Promise<string | null> => {
    try {
      // Generate a slug from the name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error: insertError } = await (supabase as any)
        .rpc('create_client_label', {
          _parent_company_id: parentId,
          _name: name,
          _display_name: displayName,
          _slug: `${slug}-${Date.now()}`,
        })
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Client Label Created',
        description: `${displayName} has been added as a client label.`
      });

      // Refetch to update the list
      loadData();
      
      return data?.id || null;
    } catch (err) {
      console.error('Error creating client label:', err);
      toast({
        title: 'Error',
        description: 'Failed to create client label',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateCompanyType = async (
    id: string,
    companyType: 'publishing_firm' | 'client_label' | 'standard'
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ company_type: companyType })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: 'Company Type Updated',
        description: `Company type changed to ${companyType.replace('_', ' ')}.`
      });

      loadData();
      return true;
    } catch (err) {
      console.error('Error updating company type:', err);
      toast({
        title: 'Error',
        description: 'Failed to update company type',
        variant: 'destructive'
      });
      return false;
    }
  };

  const setParentCompany = async (
    childId: string,
    parentId: string | null
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ parent_company_id: parentId })
        .eq('id', childId);

      if (updateError) throw updateError;

      toast({
        title: 'Parent Company Updated',
        description: parentId 
          ? 'Company has been assigned to a parent.' 
          : 'Company has been made independent.'
      });

      loadData();
      return true;
    } catch (err) {
      console.error('Error setting parent company:', err);
      toast({
        title: 'Error',
        description: 'Failed to update parent company',
        variant: 'destructive'
      });
      return false;
    }
  };

  const isPublishingFirm = companyHierarchy?.company_type === 'publishing_firm';
  const hasChildren = (companyHierarchy?.child_count ?? 0) > 0;

  return {
    childCompanies,
    companyHierarchy,
    loading,
    error,
    isPublishingFirm,
    hasChildren,
    fetchChildCompanies,
    fetchCompanyHierarchy,
    createClientLabel,
    updateCompanyType,
    setParentCompany,
    refetch: loadData
  };
}
