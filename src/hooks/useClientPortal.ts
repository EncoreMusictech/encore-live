import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useViewModeOptional } from '@/hooks/useViewModeOptional';
import { useHierarchicalFiltering } from '@/hooks/useHierarchicalFiltering';
import type { Database } from '@/integrations/supabase/types';

type ClientPortalAccess = Database['public']['Tables']['client_portal_access']['Row'];
type ClientInvitation = Database['public']['Tables']['client_invitations']['Row'];
type ClientDataAssociation = Database['public']['Tables']['client_data_associations']['Row'];

export type { ClientPortalAccess, ClientInvitation, ClientDataAssociation };

export const useClientPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isViewingAsSubAccount, viewContext } = useViewModeOptional();
  const { filterConfig } = useHierarchicalFiltering();
  const [loading, setLoading] = useState(false);
  const [clientAccess, setClientAccess] = useState<ClientPortalAccess[]>([]);
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [dataAssociations, setDataAssociations] = useState<ClientDataAssociation[]>([]);
  const [viewModeUserIds, setViewModeUserIds] = useState<string[]>([]);

  // Resolve user IDs for the viewed sub-account
  useEffect(() => {
    const loadViewModeUsers = async () => {
      if (!isViewingAsSubAccount || !viewContext?.companyId) {
        setViewModeUserIds([]);
        return;
      }
      const { data } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', viewContext.companyId)
        .eq('status', 'active');
      setViewModeUserIds(data?.map(cu => cu.user_id) || []);
    };
    loadViewModeUsers();
  }, [isViewingAsSubAccount, viewContext?.companyId]);

  // The effective user ID for READ queries — in view mode, use the sub-account's primary user
  const effectiveUserId = useMemo(() => {
    if (isViewingAsSubAccount && viewModeUserIds.length > 0) {
      return viewModeUserIds[0]; // Primary user of the viewed company
    }
    return user?.id;
  }, [isViewingAsSubAccount, viewModeUserIds, user?.id]);

  // The acting user ID for WRITE operations — prefer the service account if provisioned,
  // otherwise fall back to the first real company user.
  // Audit logs always record the real Encore admin as the actor (via ViewModeContext).
  const actingWriteUserId = useMemo(() => {
    if (isViewingAsSubAccount) {
      if (filterConfig.serviceAccountUserId) return filterConfig.serviceAccountUserId;
      if (viewModeUserIds.length > 0) return viewModeUserIds[0];
    }
    return user?.id;
  }, [isViewingAsSubAccount, filterConfig.serviceAccountUserId, viewModeUserIds, user?.id]);

  // Fetch client access records
  const fetchClientAccess = async () => {
    if (!effectiveUserId) {
      console.log('🔍 fetchClientAccess: No effective user found');
      return;
    }
    
    try {
      setLoading(true);
      let query = supabase
        .from('client_portal_access')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (isViewingAsSubAccount && viewModeUserIds.length > 0) {
        query = query.in('subscriber_user_id', viewModeUserIds);
      } else {
        query = query.eq('subscriber_user_id', effectiveUserId);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setClientAccess(data || []);
    } catch (error: any) {
      console.error('🔍 fetchClientAccess: Error fetching client access:', error);
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
    if (!effectiveUserId) return;
    
    try {
      let query = supabase
        .from('client_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (isViewingAsSubAccount && viewModeUserIds.length > 0) {
        query = query.in('subscriber_user_id', viewModeUserIds);
      } else {
        query = query.eq('subscriber_user_id', effectiveUserId);
      }
      
      const { data, error } = await query;

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
    if (!effectiveUserId) return;
    try {
      setLoading(true);
      let query = supabase
        .from('client_data_associations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (isViewingAsSubAccount && viewModeUserIds.length > 0) {
        query = query.in('subscriber_user_id', viewModeUserIds);
      } else {
        query = query.eq('subscriber_user_id', effectiveUserId);
      }
      
      const { data, error } = await query;
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
    role: 'admin' | 'client' | 'user' = 'client',
    visibilityScope?: any
  ) => {
    if (!user) return null;

    // In view-as mode, write under the service account (or first company user as fallback)
    // so data is scoped to the sub-account. Audit logs record the real Encore admin.
    const actingUserId = actingWriteUserId || user.id;

    // Map 'user' role to 'client' for database compatibility
    const dbRole = role === 'user' ? 'client' : role;

    try {
      setLoading(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const insertData: any = {
        subscriber_user_id: actingUserId,
        email,
        role: dbRole,
        permissions: permissions as any,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await supabase
        .from('client_invitations')
        .insert(insertData)
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
            role: role, // Pass the role to determine email template and route
            permissions: permissions, // Pass permissions for user role template
            subscriber_name: 'ENCORE',
            site_url: 'https://www.encoremusic.tech',
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

  // Update invitation permissions
  const updateInvitationPermissions = async (
    invitationId: string,
    permissions: Record<string, any>
  ) => {
    if (!user) return null;
    const actingUserId = actingWriteUserId || user.id;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_invitations')
        .update({ permissions: permissions as any })
        .eq('id', invitationId)
        .eq('subscriber_user_id', actingUserId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permissions updated successfully"
      });

      await fetchInvitations();
      return data;
    } catch (error: any) {
      console.error('Error updating invitation permissions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update permissions"
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

  // Create data association (idempotent)
  const createDataAssociation = async (
    clientUserId: string,
    dataType: 'copyright' | 'contract' | 'royalty_allocation' | 'sync_license' | 'payee',
    dataId: string
  ) => {
    if (!user) return null;
    const actingUserId = actingWriteUserId || user.id;

    try {
      // Idempotency: skip if this link already exists
      const { data: existing } = await supabase
        .from('client_data_associations')
        .select('id')
        .eq('subscriber_user_id', actingUserId)
        .eq('client_user_id', clientUserId)
        .eq('data_type', dataType)
        .eq('data_id', dataId)
        .maybeSingle();

      if (existing) {
        return { ...existing, alreadyLinked: true } as any;
      }

      const { data, error } = await supabase
        .from('client_data_associations')
        .insert({
          subscriber_user_id: actingUserId,
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
    const actingUserId = actingWriteUserId || user.id;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_data_associations')
        .update(updates as any)
        .eq('id', id)
        .eq('subscriber_user_id', actingUserId)
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
    const actingUserId = actingWriteUserId || user.id;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_data_associations')
        .delete()
        .eq('id', id)
        .eq('subscriber_user_id', actingUserId);
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

  // Remove specific invitation by ID
  const removeInvitation = async (invitationId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const actingUserId = actingWriteUserId || user.id;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('subscriber_user_id', actingUserId);
      
      if (error) throw error;
      
      await fetchInvitations();
      toast({
        title: 'Invitation removed',
        description: 'The invitation has been deleted successfully.'
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error removing invitation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove invitation'
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Remove invitations by status (expired, pending)
  const removeInvitations = async (includePending: boolean = false) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const actingUserId = actingWriteUserId || user.id;
    try {
      setLoading(true);
      const statuses = includePending ? ['expired', 'pending'] : ['expired'];
      const { error } = await supabase
        .from('client_invitations')
        .delete()
        .eq('subscriber_user_id', actingUserId)
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
    if (effectiveUserId) {
      fetchClientAccess();
      fetchInvitations();
      fetchDataAssociations();
    }
  }, [effectiveUserId, isViewingAsSubAccount, viewModeUserIds]);

  return {
    loading,
    clientAccess,
    invitations,
    dataAssociations,
    createInvitation,
    updateInvitationPermissions,
    acceptInvitation,
    revokeClientAccess,
    createDataAssociation,
    updateDataAssociation,
    deleteDataAssociation,
    isClient,
    getClientPermissions,
    triggerInvitationMaintenance,
    removeInvitation,
    removeInvitations,
    getInvitationStatus,
    refreshData: () => {
      fetchClientAccess();
      fetchInvitations();
      fetchDataAssociations();
    }
  };
};