import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ClientPortalAccess = Database['public']['Tables']['client_portal_access']['Row'];
type ClientInvitation = Database['public']['Tables']['client_invitations']['Row'];
type ClientDataAssociation = Database['public']['Tables']['client_data_associations']['Row'];

export type { ClientPortalAccess, ClientInvitation, ClientDataAssociation };

export const useClientPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientAccess, setClientAccess] = useState<ClientPortalAccess[]>([]);
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [dataAssociations, setDataAssociations] = useState<ClientDataAssociation[]>([]);

  // Fetch client access records
  const fetchClientAccess = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_portal_access')
        .select('*')
        .eq('subscriber_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientAccess(data || []);
    } catch (error: any) {
      console.error('Error fetching client access:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load client access records"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch invitations
  const fetchInvitations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('subscriber_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invitations"
      });
    }
  };

  // Fetch data associations
  const fetchDataAssociations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_data_associations')
        .select('*')
        .eq('subscriber_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDataAssociations(data || []);
    } catch (error: any) {
      console.error('Error fetching data associations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data associations',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create invitation
  const createInvitation = async (
    email: string,
    permissions: Record<string, any>,
    role: 'admin' | 'client' = 'client'
  ) => {
    if (!user) return null;

    try {
      setLoading(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from('client_invitations')
        .insert({
          subscriber_user_id: user.id,
          email,
          role,
          permissions: permissions as any,
          expires_at: expiresAt.toISOString()
        } as any)
        .select()
        .single();

      if (error) throw error;

      // After creating the invitation, send the email via Edge Function (best-effort)
      try {
        const { error: sendError } = await supabase.functions.invoke('send-client-invitation', {
          body: {
            invitee_email: email,
            // Optionally pass a name if you collect it elsewhere
            invitee_name: undefined,
            token: (data as any).invitation_token,
            subscriber_name: 'ENCORE',
            site_url: window.location.origin,
            support_email: 'support@encoremusic.tech',
          },
        });

        if (sendError) {
          console.error('Invitation email send error:', sendError);
          toast({
            title: 'Invitation created',
            description: 'Email could not be sent automatically. You can copy the invite link from the list.',
          });
        } else {
          toast({
            title: 'Success',
            description: `Invitation email sent to ${email}`,
          });
        }
      } catch (err) {
        console.error('Unexpected error sending invitation email:', err);
        toast({
          title: 'Invitation created',
          description: 'Email delivery could not be confirmed. You can copy the invite link from the list.',
        });
      }

      await fetchInvitations();
      return data;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create invitation"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (token: string) => {
    if (!user) return null;

    try {
      setLoading(true);
      
      // Accept via secure RPC to bypass RLS safely and enforce email match
      const { data: access, error: rpcError } = await supabase.rpc(
        'accept_client_invitation',
        {
          p_token: token,
          p_accepter: user.id,
          p_accepter_email: user.email as string
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      toast({
        title: "Success",
        description: "Invitation accepted successfully"
      });

      return access;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);

      // Fallback: if invite is invalid/expired, user might already have access
      const { data: existingAccess } = await supabase
        .from('client_portal_access')
        .select('*')
        .eq('client_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingAccess) {
        toast({ title: 'Already has access', description: 'Your client portal access is already active.' });
        return existingAccess as any;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to accept invitation"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Revoke client access
  const revokeClientAccess = async (accessId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_portal_access')
        .update({ status: 'revoked' })
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client access revoked successfully"
      });

      await fetchClientAccess();
    } catch (error: any) {
      console.error('Error revoking client access:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke client access"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create data association
  const createDataAssociation = async (
    clientUserId: string,
    dataType: 'copyright' | 'contract' | 'royalty_allocation' | 'sync_license',
    dataId: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_data_associations')
        .insert({
          subscriber_user_id: user.id,
          client_user_id: clientUserId,
          data_type: dataType,
          data_id: dataId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Data association created successfully"
      });

      await fetchDataAssociations();
      return data;
    } catch (error: any) {
      console.error('Error creating data association:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create data association"
      });
      return null;
    }
  };

  // Update data association
  const updateDataAssociation = async (
    id: string,
    updates: Partial<Pick<ClientDataAssociation, 'data_type' | 'data_id'>>
  ) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_data_associations')
        .update(updates as any)
        .eq('id', id)
        .eq('subscriber_user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Updated', description: 'Association updated successfully' });
      await fetchDataAssociations();
      return data;
    } catch (error: any) {
      console.error('Error updating data association:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update association' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete data association
  const deleteDataAssociation = async (id: string) => {
    if (!user) return false;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_data_associations')
        .delete()
        .eq('id', id)
        .eq('subscriber_user_id', user.id);
      if (error) throw error;
      await fetchDataAssociations();
      toast({ title: 'Removed', description: 'Association removed' });
      return true;
    } catch (error: any) {
      console.error('Error deleting data association:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to remove association' });
      return false;
    } finally {
      setLoading(false);
    }
  };
  // Check if current user is a client
  const isClient = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('client_portal_access')
        .select('id')
        .eq('client_user_id', user.id)
        .eq('status', 'active')
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  };

  // Get client permissions
  const getClientPermissions = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_portal_access')
        .select('permissions')
        .eq('client_user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data?.permissions || {};
    } catch {
      return null;
    }
  };

  // Function to trigger invitation lifecycle maintenance
  const triggerInvitationMaintenance = async (
    action: 'expire_invitations' | 'cleanup_expired' | 'send_reminders' | 'expire_access' | 'full_maintenance' = 'full_maintenance',
    options?: { forceAll?: boolean }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('client-invitation-lifecycle', {
        body: { action, force_all: options?.forceAll === true }
      });
      
      if (error) {
        console.error('Error triggering invitation maintenance:', error);
        return { success: false, error: error.message };
      }
      
      // Refresh data after maintenance
      await fetchClientAccess();
      await fetchInvitations();
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error triggering invitation maintenance:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Remove invitations by status (expired, pending)
  const removeInvitations = async (includePending: boolean = false) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      setLoading(true);
      const statuses = includePending ? ['expired', 'pending'] : ['expired'];
      const { error } = await supabase
        .from('client_invitations')
        .delete()
        .eq('subscriber_user_id', user.id)
        .in('status', statuses as any);
      if (error) throw error;
      await fetchInvitations();
      toast({
        title: 'Invitations removed',
        description: includePending ? 'Pending and expired invitations deleted.' : 'Expired invitations deleted.'
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error removing invitations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove invitations'
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Function to get invitation status with expiry information
  const getInvitationStatus = (invitation: ClientInvitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (invitation.status === 'expired' || expiresAt < now) {
      return { status: 'expired', daysUntilExpiry: 0, isUrgent: false };
    }
    
    if (invitation.status === 'accepted') {
      return { status: 'accepted', daysUntilExpiry, isUrgent: false };
    }
    
    const isUrgent = daysUntilExpiry <= 3;
    return { 
      status: 'pending', 
      daysUntilExpiry: Math.max(0, daysUntilExpiry), 
      isUrgent 
    };
  };

  useEffect(() => {
    if (user) {
      fetchClientAccess();
      fetchInvitations();
      fetchDataAssociations();
    }
  }, [user]);

  return {
    loading,
    clientAccess,
    invitations,
    dataAssociations,
    createInvitation,
    acceptInvitation,
    revokeClientAccess,
    createDataAssociation,
    updateDataAssociation,
    deleteDataAssociation,
    isClient,
    getClientPermissions,
    triggerInvitationMaintenance,
    removeInvitations,
    getInvitationStatus,
    refreshData: () => {
      fetchClientAccess();
      fetchInvitations();
      fetchDataAssociations();
    }
  };
};