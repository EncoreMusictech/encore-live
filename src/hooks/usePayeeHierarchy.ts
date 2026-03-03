import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useDataFiltering } from './useDataFiltering';

export interface Agreement {
  id: string;
  agreement_id: string;
  title: string;
  counterparty_name: string;
}

export interface OriginalPublisher {
  id: string;
  op_id: string;
  publisher_name: string;
  contact_info: any;
  agreement_id: string;
}

export interface Writer {
  id: string;
  writer_id: string;
  writer_name: string;
  contact_info: any;
  original_publisher_id: string;
}

export interface Payee {
  id: string;
  payee_name: string;
  payee_type: string;
  contact_info: any;
  payment_info: any;
  writer_id: string;
  is_primary: boolean;
}

export function usePayeeHierarchy() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [originalPublishers, setOriginalPublishers] = useState<OriginalPublisher[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const { applyUserIdFilter, filterKey, isFilterActive, companyId, companyUserIds } = useDataFiltering();

  // Resolve the effective user ID for write operations
  useEffect(() => {
    const resolveEffectiveUserId = async () => {
      if (!user) {
        setEffectiveUserId(null);
        return;
      }

      if (isFilterActive && companyId) {
        // Try to get the service account for this company
        try {
          const { data: serviceAccountId } = await supabase.rpc(
            'get_company_service_account_user_id',
            { _company_id: companyId }
          );
          if (serviceAccountId) {
            setEffectiveUserId(serviceAccountId);
            return;
          }
          // Fallback: use the first active company user
          if (companyUserIds.length > 0) {
            setEffectiveUserId(companyUserIds[0]);
            return;
          }
        } catch (error) {
          console.error('Error resolving effective user ID:', error);
        }
      }

      // Default to authenticated user
      setEffectiveUserId(user.id);
    };

    resolveEffectiveUserId();
  }, [user, isFilterActive, companyId, companyUserIds]);

  // Get the user ID to use for write operations
  const getWriteUserId = () => effectiveUserId || user?.id;

  // Get scoped user IDs for read queries
  const getScopedUserIds = (): string[] => {
    if (isFilterActive && companyUserIds.length > 0) {
      return companyUserIds;
    }
    return user ? [user.id] : [];
  };

  // Apply user scope to a read query
  const applyScopedFilter = (query: any) => {
    const userIds = getScopedUserIds();
    if (userIds.length === 1) {
      return query.eq('user_id', userIds[0]);
    }
    if (userIds.length > 1) {
      return query.in('user_id', userIds);
    }
    return query;
  };

  // Fetch all agreements (contracts) scoped to sub-account
  const fetchAgreements = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('contracts')
        .select('id, agreement_id, title, counterparty_name')
        .order('created_at', { ascending: false });

      if (isFilterActive && companyId) {
        query = query.eq('client_company_id', companyId);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgreements(data || []);
    } catch (error: any) {
      console.error('Error fetching agreements:', error);
    }
  };

  // Fetch original publishers for a specific agreement
  const fetchOriginalPublishers = async (agreementId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('original_publishers')
        .select('*');

      query = applyScopedFilter(query);

      if (agreementId) {
        query = query.eq('agreement_id', agreementId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOriginalPublishers(data || []);
      
      // If no original publishers exist for this agreement, auto-generate one
      if (agreementId && (!data || data.length === 0)) {
        setTimeout(() => autoGenerateOriginalPublisher(agreementId), 100);
      }
    } catch (error: any) {
      console.error('Error fetching original publishers:', error);
    }
  };

  // Auto-generate original publisher with default name
  const autoGenerateOriginalPublisher = async (agreementId: string) => {
    if (!user) return;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return;

    try {
      const { data: agreementData, error: agreementError } = await supabase
        .from('contracts')
        .select('counterparty_name')
        .eq('id', agreementId)
        .single();

      if (agreementError) throw agreementError;

      const publisherName = `${agreementData.counterparty_name} Publishing Designee`;

      // Check if exists using scoped user IDs
      let checkQuery = supabase
        .from('original_publishers')
        .select('id')
        .eq('agreement_id', agreementId)
        .eq('publisher_name', publisherName);
      checkQuery = applyScopedFilter(checkQuery);
      const { data: existingPublisher } = await checkQuery.single();

      if (existingPublisher) {
        await fetchOriginalPublishers(agreementId);
        return existingPublisher;
      }

      const { data, error } = await supabase
        .from('original_publishers')
        .insert({
          publisher_name: publisherName,
          contact_info: {},
          agreement_id: agreementId,
          user_id: writeUserId,
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          await fetchOriginalPublishers(agreementId);
          return null;
        }
        throw error;
      }

      await fetchOriginalPublishers(agreementId);
      
      toast({
        title: "Auto-generated Publisher",
        description: `Created "${publisherName}" for this agreement`,
      });

      return data;
    } catch (error: any) {
      console.error('Error auto-generating original publisher:', error);
      return null;
    }
  };

  // Fetch writers for a specific original publisher
  const fetchWriters = async (originalPublisherId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('writers')
        .select('*');

      query = applyScopedFilter(query);

      if (originalPublisherId) {
        query = query.eq('original_publisher_id', originalPublisherId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setWriters(data || []);
      
      if (originalPublisherId && (!data || data.length === 0)) {
        setTimeout(() => autoGenerateWriter(originalPublisherId), 100);
      }
    } catch (error: any) {
      console.error('Error fetching writers:', error);
    }
  };

  // Auto-generate writer with default name
  const autoGenerateWriter = async (originalPublisherId: string) => {
    if (!user) return;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return;

    try {
      const { data: publisherData, error: publisherError } = await supabase
        .from('original_publishers')
        .select('publisher_name, agreement_id')
        .eq('id', originalPublisherId)
        .single();

      if (publisherError) throw publisherError;

      const { data: agreementData, error: agreementError } = await supabase
        .from('contracts')
        .select('counterparty_name')
        .eq('id', publisherData.agreement_id)
        .single();

      if (agreementError) throw agreementError;

      const writerName = agreementData.counterparty_name;

      let checkQuery = supabase
        .from('writers')
        .select('id')
        .eq('original_publisher_id', originalPublisherId)
        .eq('writer_name', writerName);
      checkQuery = applyScopedFilter(checkQuery);
      const { data: existingWriter } = await checkQuery.single();

      if (existingWriter) {
        await fetchWriters(originalPublisherId);
        return existingWriter;
      }

      const { data, error } = await supabase
        .from('writers')
        .insert({
          writer_name: writerName,
          contact_info: {},
          original_publisher_id: originalPublisherId,
          user_id: writeUserId,
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          await fetchWriters(originalPublisherId);
          return null;
        }
        throw error;
      }

      await fetchWriters(originalPublisherId);
      
      toast({
        title: "Auto-generated Writer",
        description: `Created "${writerName}" for this original publisher`,
      });

      return data;
    } catch (error: any) {
      console.error('Error auto-generating writer:', error);
      return null;
    }
  };

  // Fetch payees for a specific writer
  const fetchPayees = async (writerId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('payees')
        .select('*');

      query = applyScopedFilter(query);

      if (writerId) {
        query = query.eq('writer_id', writerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPayees(data || []);
    } catch (error: any) {
      console.error('Error fetching payees:', error);
    }
  };

  // Create original publisher
  const createOriginalPublisher = async (publisherData: { publisher_name: string; contact_info: any; agreement_id: string; }) => {
    if (!user) return null;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return null;

    try {
      const { data, error } = await supabase
        .from('original_publishers')
        .insert({
          publisher_name: publisherData.publisher_name,
          contact_info: publisherData.contact_info,
          agreement_id: publisherData.agreement_id,
          user_id: writeUserId,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Original publisher created successfully",
      });

      await fetchOriginalPublishers();
      return data;
    } catch (error: any) {
      console.error('Error creating original publisher:', error);
      toast({
        title: "Error",
        description: "Failed to create original publisher",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create writer
  const createWriter = async (writerData: { writer_name: string; contact_info: any; original_publisher_id: string; }) => {
    if (!user) return null;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return null;

    try {
      const { data, error } = await supabase
        .from('writers')
        .insert({
          writer_name: writerData.writer_name,
          contact_info: writerData.contact_info,
          original_publisher_id: writerData.original_publisher_id,
          user_id: writeUserId,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Writer created successfully",
      });

      await fetchWriters();
      return data;
    } catch (error: any) {
      console.error('Error creating writer:', error);
      toast({
        title: "Error",
        description: "Failed to create writer",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update payee
  const updatePayee = async (payeeId: string, payeeData: { payee_name: string; payee_type: string; contact_info: any; payment_info: any; writer_id: string; is_primary: boolean; }) => {
    if (!user) return null;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return null;

    try {
      const { data, error } = await supabase
        .from('payees')
        .update({
          ...payeeData,
          user_id: writeUserId,
        })
        .eq('id', payeeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payee updated successfully",
      });

      await fetchPayees();
      return data;
    } catch (error: any) {
      console.error('Error updating payee:', error);
      toast({
        title: "Error",
        description: "Failed to update payee",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create payee
  const createPayee = async (payeeData: { payee_name: string; payee_type: string; contact_info: any; payment_info: any; writer_id: string; is_primary: boolean; }) => {
    if (!user) return null;
    const writeUserId = getWriteUserId();
    if (!writeUserId) return null;

    try {
      const insertData: any = {
        ...payeeData,
        user_id: writeUserId,
      };

      // Set client_company_id when creating in sub-account context
      if (isFilterActive && companyId) {
        insertData.client_company_id = companyId;
      }

      const { data, error } = await supabase
        .from('payees')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payee created successfully",
      });

      await fetchPayees();
      return data;
    } catch (error: any) {
      console.error('Error creating payee:', error);
      toast({
        title: "Error",
        description: "Failed to create payee",
        variant: "destructive",
      });
      return null;
    }
  };

  // Build payees from agreement using primary interested parties
  const buildPayeesFromAgreement = async (agreementId: string): Promise<{ created: number; existing: number; errors: number }> => {
    if (!user) throw new Error('Not authenticated');
    const writeUserId = getWriteUserId();
    if (!writeUserId) throw new Error('No effective user ID');

    // 1) Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, commission_percentage, counterparty_name')
      .eq('id', agreementId)
      .maybeSingle();
    if (contractError) throw contractError;

    const commission = contract?.commission_percentage || 0;
    const defaultSplit = Math.max(0, 100 - commission);

    // 2) Ensure an Original Publisher exists (scoped)
    let publisherId: string | null = null;
    let pubQuery = supabase
      .from('original_publishers')
      .select('id')
      .eq('agreement_id', agreementId)
      .order('created_at', { ascending: true });
    pubQuery = applyScopedFilter(pubQuery);
    const { data: pubs, error: pubsError } = await pubQuery;
    if (pubsError) throw pubsError;

    if (pubs && pubs.length > 0) {
      publisherId = pubs[0].id;
    } else {
      const createdPublisher = await autoGenerateOriginalPublisher(agreementId);
      if (createdPublisher) {
        publisherId = createdPublisher.id;
      } else {
        // Re-fetch after potential race
        let retryQuery = supabase
          .from('original_publishers')
          .select('id')
          .eq('agreement_id', agreementId)
          .order('created_at', { ascending: true });
        retryQuery = applyScopedFilter(retryQuery);
        const { data: pubs2 } = await retryQuery;
        publisherId = pubs2 && pubs2.length > 0 ? pubs2[0].id : null;
      }
    }

    if (!publisherId) {
      throw new Error('Unable to determine or create an original publisher for this agreement.');
    }

    // 3) Fetch primary interested parties (writers, not merged)
    const { data: parties, error: partiesError } = await supabase
      .from('contract_interested_parties')
      .select('*')
      .eq('contract_id', agreementId)
      .eq('party_type', 'writer')
      .is('merged_into_id', null);
    if (partiesError) throw partiesError;

    if (!parties || parties.length === 0) {
      return { created: 0, existing: 0, errors: 0 };
    }

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const party of parties) {
      const writerName = party.name?.trim();
      if (!writerName) continue;

      // Find or create writer under publisher (scoped)
      let writerId: string | null = null;
      let writerQuery = supabase
        .from('writers')
        .select('id')
        .eq('original_publisher_id', publisherId)
        .eq('writer_name', writerName);
      writerQuery = applyScopedFilter(writerQuery);
      const { data: existingWriter } = await writerQuery.maybeSingle();

      if (existingWriter?.id) {
        writerId = existingWriter.id;
      } else {
        const newWriter = await createWriter({ writer_name: writerName, contact_info: {}, original_publisher_id: publisherId });
        writerId = newWriter?.id || null;
      }

      if (!writerId) { errors++; continue; }

      // Check if payee already exists (scoped)
      let payeeQuery = supabase
        .from('payees')
        .select('id')
        .eq('writer_id', writerId);
      payeeQuery = applyScopedFilter(payeeQuery);
      const { data: existingPayee } = await payeeQuery.maybeSingle();

      if (existingPayee?.id) { existing++; continue; }

      // Splits from interested party or default
      const performance = (party.performance_percentage ?? defaultSplit) as number;
      const mechanical = (party.mechanical_percentage ?? defaultSplit) as number;
      const sync = (party.synch_percentage ?? defaultSplit) as number;

      const contactInfo: any = {
        email: party.email || undefined,
        phone: party.phone || undefined,
        address: party.address || undefined,
        tax_id: party.tax_id || undefined,
      };

      const paymentInfo = {
        default_splits: { performance, mechanical, synchronization: sync },
        payment_settings: { threshold: 100, frequency: 'quarterly' },
      };

      const createdPayee = await createPayee({
        payee_name: writerName,
        payee_type: 'writer',
        contact_info: contactInfo,
        payment_info: paymentInfo,
        writer_id: writerId,
        is_primary: false,
      });

      if (createdPayee?.id) created++; else errors++;
    }

    return { created, existing, errors };
  };

  useEffect(() => {
    if (user) {
      fetchAgreements();
      setLoading(false);
    }
  }, [user, filterKey]);

  return {
    agreements,
    originalPublishers,
    writers,
    payees,
    loading,
    fetchAgreements,
    fetchOriginalPublishers,
    fetchWriters,
    fetchPayees,
    createOriginalPublisher,
    createWriter,
    createPayee,
    updatePayee,
    autoGenerateOriginalPublisher,
    autoGenerateWriter,
    buildPayeesFromAgreement,
  };
}
