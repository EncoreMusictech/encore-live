import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();

  // Fetch all agreements (contracts)
  const fetchAgreements = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, agreement_id, title, counterparty_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
        .select('*')
        .eq('user_id', user.id);

      if (agreementId) {
        query = query.eq('agreement_id', agreementId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOriginalPublishers(data || []);
      
      // If no original publishers exist for this agreement, auto-generate one
      if (agreementId && (!data || data.length === 0)) {
        // Use setTimeout to avoid race conditions from multiple rapid calls
        setTimeout(() => autoGenerateOriginalPublisher(agreementId), 100);
      }
    } catch (error: any) {
      console.error('Error fetching original publishers:', error);
    }
  };

  // Auto-generate original publisher with default name
  const autoGenerateOriginalPublisher = async (agreementId: string) => {
    if (!user) return;

    try {
      // Get the agreement details to extract writer name
      const { data: agreementData, error: agreementError } = await supabase
        .from('contracts')
        .select('counterparty_name')
        .eq('id', agreementId)
        .single();

      if (agreementError) throw agreementError;

      const publisherName = `${agreementData.counterparty_name} Publishing Designee`;

      // Check if a publisher with this name already exists for this agreement
      const { data: existingPublisher } = await supabase
        .from('original_publishers')
        .select('id')
        .eq('agreement_id', agreementId)
        .eq('publisher_name', publisherName)
        .eq('user_id', user.id)
        .single();

      if (existingPublisher) {
        // Publisher already exists, just refresh the list
        await fetchOriginalPublishers(agreementId);
        return existingPublisher;
      }

      const { data, error } = await supabase
        .from('original_publishers')
        .insert({
          publisher_name: publisherName,
          contact_info: {},
          agreement_id: agreementId,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, just refresh and return
        if (error.code === '23505') {
          await fetchOriginalPublishers(agreementId);
          return null;
        }
        throw error;
      }

      // Refresh the original publishers list
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
        .select('*')
        .eq('user_id', user.id);

      if (originalPublisherId) {
        query = query.eq('original_publisher_id', originalPublisherId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setWriters(data || []);
      
      // If no writers exist for this original publisher, auto-generate one
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

    try {
      // Get the original publisher and agreement details
      const { data: publisherData, error: publisherError } = await supabase
        .from('original_publishers')
        .select('publisher_name, agreement_id')
        .eq('id', originalPublisherId)
        .single();

      if (publisherError) throw publisherError;

      // Get the agreement counterparty name
      const { data: agreementData, error: agreementError } = await supabase
        .from('contracts')
        .select('counterparty_name')
        .eq('id', publisherData.agreement_id)
        .single();

      if (agreementError) throw agreementError;

      const writerName = agreementData.counterparty_name;

      // Check if a writer with this name already exists for this original publisher
      const { data: existingWriter } = await supabase
        .from('writers')
        .select('id')
        .eq('original_publisher_id', originalPublisherId)
        .eq('writer_name', writerName)
        .eq('user_id', user.id)
        .single();

      if (existingWriter) {
        // Writer already exists, just refresh the list
        await fetchWriters(originalPublisherId);
        return existingWriter;
      }

      const { data, error } = await supabase
        .from('writers')
        .insert({
          writer_name: writerName,
          contact_info: {},
          original_publisher_id: originalPublisherId,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, just refresh and return
        if (error.code === '23505') {
          await fetchWriters(originalPublisherId);
          return null;
        }
        throw error;
      }

      // Refresh the writers list
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
        .select('*')
        .eq('user_id', user.id);

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

    try {
      const { data, error } = await supabase
        .from('original_publishers')
        .insert({
          publisher_name: publisherData.publisher_name,
          contact_info: publisherData.contact_info,
          agreement_id: publisherData.agreement_id,
          user_id: user.id,
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

    try {
      const { data, error } = await supabase
        .from('writers')
        .insert({
          writer_name: writerData.writer_name,
          contact_info: writerData.contact_info,
          original_publisher_id: writerData.original_publisher_id,
          user_id: user.id,
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

    try {
      const { data, error } = await supabase
        .from('payees')
        .update({
          ...payeeData,
          user_id: user.id,
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

    try {
      const { data, error } = await supabase
        .from('payees')
        .insert({
          ...payeeData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Import the quarterly balance reports hook function
      const { useQuarterlyBalanceReports } = await import('@/hooks/useQuarterlyBalanceReports');
      
      // Initialize quarterly balance reports for the new payee
      // We'll need to get the contact_id and agreement_id from the writer hierarchy
      try {
        // Get writer details to extract contact and agreement info
        const { data: writerData } = await supabase
          .from('writers')
          .select(`
            id,
            original_publisher_id,
            original_publishers!inner(
              agreement_id,
              contracts!inner(id)
            )
          `)
          .eq('id', payeeData.writer_id)
          .single();

        const contactId = payeeData.contact_info?.email ? data.id : undefined;
        const agreementId = writerData?.original_publishers?.agreement_id;

        // Call the initialization function directly using the Supabase client
        // Since we can't easily access the hook function here, we'll duplicate the logic
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
        
        // Generate reports for current quarter and next 7 quarters (2 years)
        const reportsToCreate = [];
        
        for (let i = 0; i < 8; i++) {
          let year = currentYear;
          let quarter = currentQuarter + i;
          
          // Handle year rollover
          while (quarter > 4) {
            quarter -= 4;
            year += 1;
          }
          
          reportsToCreate.push({
            user_id: user.id,
            payee_id: data.id,
            contact_id: contactId || null,
            agreement_id: agreementId || null,
            year,
            quarter,
            opening_balance: 0,
            royalties_amount: 0,
            expenses_amount: 0,
            payments_amount: 0,
            closing_balance: 0,
            is_calculated: false
          });
        }

        // Insert all quarterly balance reports
        const { error: reportsError } = await supabase
          .from('quarterly_balance_reports')
          .insert(reportsToCreate);

        if (reportsError) {
          console.error('Error initializing quarterly balance reports:', reportsError);
        } else {
          console.log(`Initialized ${reportsToCreate.length} quarterly balance reports for payee ${data.id}`);
        }
      } catch (initError) {
        console.error('Error during payee initialization:', initError);
        // Don't fail the payee creation if report initialization fails
      }

      toast({
        title: "Success",
        description: "Payee created successfully with quarterly balance reports initialized",
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

  useEffect(() => {
    if (user) {
      fetchAgreements();
      setLoading(false);
    }
  }, [user]);

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
  };
}