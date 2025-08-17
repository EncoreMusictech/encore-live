import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserCheck, Clock, Settings, Mail, Database, RefreshCw, AlertTriangle, CheckCircle, XCircle, Pencil, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useClientPortal } from "@/hooks/useClientPortal";
import { NameLinker } from "@/components/client-portal/NameLinker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CRMClientsPage() {
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  const { 
    clientAccess, 
    invitations,
    dataAssociations,
    createInvitation, 
    revokeClientAccess, 
    createDataAssociation, 
    updateDataAssociation,
    deleteDataAssociation,
    triggerInvitationMaintenance,
    removeInvitations,
    getInvitationStatus,
    refreshData 
  } = useClientPortal();

  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "client">("client");
  const [permissions, setPermissions] = useState({
    contracts: false,
    copyright: false,
    royalties: false,
    sync_licenses: false
  });

  const [associationForm, setAssociationForm] = useState({
    clientUserId: "",
    dataType: "copyright" as "copyright" | "contract" | "royalty_allocation" | "sync_license" | "payee",
    dataId: ""
  });

  // Filters & inline edit state for associations manager
  const [typeFilter, setTypeFilter] = useState<'all' | 'copyright' | 'contract' | 'royalty_allocation' | 'sync_license' | 'payee'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ dataType: 'copyright' | 'contract' | 'royalty_allocation' | 'sync_license' | 'payee'; dataId: string}>(
    { dataType: 'copyright', dataId: '' }
  );

  // Resolved names for associations (type:id -> label)
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const getDataLabel = (a: any) => nameMap[`${a.data_type}:${a.data_id}`] || a.data_id;
  
  // Load data labels for associations
  useEffect(() => {
    const loadLabels = async () => {
      if (!dataAssociations || dataAssociations.length === 0) {
        setNameMap({});
        return;
      }
      try {
        const map: Record<string, string> = {};
        const byType = {
          copyright: Array.from(new Set(dataAssociations.filter((x: any) => x.data_type === 'copyright').map((x: any) => x.data_id))).filter(Boolean),
          contract: Array.from(new Set(dataAssociations.filter((x: any) => x.data_type === 'contract').map((x: any) => x.data_id))).filter(Boolean),
          royalty_allocation: Array.from(new Set(dataAssociations.filter((x: any) => x.data_type === 'royalty_allocation').map((x: any) => x.data_id))).filter(Boolean),
          sync_license: Array.from(new Set(dataAssociations.filter((x: any) => x.data_type === 'sync_license').map((x: any) => x.data_id))).filter(Boolean),
          payee: Array.from(new Set(dataAssociations.filter((x: any) => x.data_type === 'payee').map((x: any) => x.data_id))).filter(Boolean),
        } as const;

        const tasks: Promise<void>[] = [];
        if (byType.copyright.length) {
          tasks.push((async () => {
            const { data } = await supabase
              .from('copyrights')
              .select('id, work_title')
              .in('id', byType.copyright as any);
            (data || []).forEach((r: any) => { map[`copyright:${r.id}`] = r.work_title || r.id; });
          })());
        }
        if (byType.contract.length) {
          tasks.push((async () => {
            const { data } = await supabase
              .from('contracts')
              .select('id, title')
              .in('id', byType.contract as any);
            (data || []).forEach((r: any) => { map[`contract:${r.id}`] = r.title || r.id; });
          })());
        }
        if (byType.royalty_allocation.length) {
          tasks.push((async () => {
            const { data } = await supabase
              .from('royalty_allocations')
              .select('id, song_title, artist')
              .in('id', byType.royalty_allocation as any);
            (data || []).forEach((r: any) => {
              const label = r.song_title ? `${r.song_title}${r.artist ? ' — ' + r.artist : ''}` : r.id;
              map[`royalty_allocation:${r.id}`] = label;
            });
          })());
        }
        if (byType.sync_license.length) {
          tasks.push((async () => {
            const { data } = await supabase
              .from('sync_licenses')
              .select('id, project_title')
              .in('id', byType.sync_license as any);
            (data || []).forEach((r: any) => { map[`sync_license:${r.id}`] = r.project_title || r.id; });
          })());
        }
        if (byType.payee.length) {
          tasks.push((async () => {
            const { data } = await supabase
              .from('payees')
              .select('id, payee_name, payee_type')
              .in('id', byType.payee as any);
            (data || []).forEach((r: any) => { map[`payee:${r.id}`] = `${r.payee_name} (${r.payee_type})`; });
          })());
        }

        await Promise.all(tasks);
        setNameMap(map);
      } catch (err) {
        console.error('Failed to load association labels', err);
      }
    };
    loadLabels();
  }, [dataAssociations]);

  // Calculate stats from real data
  const clientStats = {
    totalClients: clientAccess.length,
    activeClients: clientAccess.filter(c => c.status === 'active').length,
    pendingInvites: invitations.filter(i => i.status === 'pending').length,
    totalRevenue: 850000 // This would come from actual revenue data
  };

  // Combine client access records and invitations for display
  const allClients = [
    // Active clients - using client_user_id as identifier
    ...clientAccess.map(access => ({
      id: access.id,
      name: `Client ${access.client_user_id.slice(0, 8)}...`, // Shortened user ID as name
      type: access.role === 'admin' ? 'Admin' : 'Client',
      status: access.status,
      email: 'N/A', // Email not available in access record
      modules: access.permissions ? Object.keys(access.permissions as any).filter(key => (access.permissions as any)[key]) : [],
      lastActive: access.updated_at ? new Date(access.updated_at).toLocaleDateString() : 'Never',
      isInvitation: false
    })),
    // Pending invitations
    ...invitations.filter(inv => inv.status === 'pending').map(invitation => {
      const statusInfo = getInvitationStatus(invitation);
      return {
        id: invitation.id,
        name: invitation.email,
        type: invitation.role === 'admin' ? 'Admin' : 'Client',
        status: statusInfo.status,
        email: invitation.email,
        modules: invitation.permissions ? Object.keys(invitation.permissions as any).filter(key => (invitation.permissions as any)[key]) : [],
        lastActive: 'Never',
        isInvitation: true,
        expiresAt: invitation.expires_at,
        daysUntilExpiry: statusInfo.daysUntilExpiry,
        isUrgent: statusInfo.isUrgent
      };
    })
  ];

  // Helper functions
  const handleCreateInvitation = async () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    const permissionsObj = Object.fromEntries(
      Object.entries(permissions).map(([key, value]) => [key, { enabled: value }])
    );

    const invitation = await createInvitation(inviteEmail, permissionsObj, selectedRole);
    
    if (invitation) {
      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      setPermissions({
        contracts: false,
        copyright: false,
        royalties: false,
        sync_licenses: false
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive"
      });
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    await revokeClientAccess(accessId);
    toast({
      title: "Success",
      description: "Client access revoked",
    });
  };

  const handleCreateAssociation = async () => {
    if (!associationForm.clientUserId || !associationForm.dataId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const association = await createDataAssociation(
      associationForm.clientUserId,
      associationForm.dataType,
      associationForm.dataId
    );

    if (association) {
      toast({
        title: "Success",
        description: "Data association created",
      });
      setAssociationForm({
        clientUserId: "",
        dataType: "copyright",
        dataId: ""
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create data association",
        variant: "destructive"
      });
    }
  };

  const handleStartEdit = (assoc: any) => {
    setEditingId(assoc.id);
    setEditForm({ dataType: assoc.data_type, dataId: assoc.data_id });
  };

  const handleSaveAssociationEdit = async () => {
    if (!editingId) return;
    const updated = await updateDataAssociation(editingId, {
      data_type: editForm.dataType as any,
      data_id: editForm.dataId,
    } as any);
    if (updated) {
      toast({ title: 'Updated', description: 'Association updated' });
      setEditingId(null);
    }
  };

  const handleDeleteAssociation = async (id: string) => {
    const ok = await deleteDataAssociation(id);
    if (ok) {
      toast({ title: 'Removed', description: 'Association removed' });
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/client-portal?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const handleResendEmail = async (invitation: any) => {
    try {
      const { error } = await supabase.functions.invoke('send-client-invitation', {
        body: {
          invitee_email: invitation.email,
          token: invitation.invitation_token,
          subscriber_name: 'ENCORE',
          site_url: window.location.origin,
          support_email: 'support@encoremusic.tech',
        },
      });

      if (error) throw error;

      toast({
        title: 'Email sent',
        description: `Invitation email resent to ${invitation.email}`,
      });
    } catch (err: any) {
      console.error('Resend email error:', err);
      toast({
        title: 'Could not resend email',
        description: err?.message || 'Please try again or copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePendingAndExpired = async () => {
    const result = await removeInvitations(true);
    if (result.success) {
      toast({ title: 'Removed', description: 'All pending and expired invitations have been deleted.' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to remove invitations.', variant: 'destructive' });
    }
  };

  const handleManualMaintenance = async (action: 'expire_invitations' | 'cleanup_expired' | 'send_reminders' | 'expire_access' | 'full_maintenance') => {
    const forceAll = action === 'cleanup_expired';
    const result = await triggerInvitationMaintenance(action, { forceAll });
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Maintenance task completed successfully",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to run maintenance task",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (invitation: any) => {
    const status = getInvitationStatus(invitation);
    
    if (status.status === 'expired') {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Expired</Badge>;
    }
    
    if (status.status === 'accepted') {
      return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Accepted</Badge>;
    }
    
    if (status.isUrgent) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Urgent ({status.daysUntilExpiry}d)</Badge>;
    }
    
    return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending ({status.daysUntilExpiry}d)</Badge>;
  };

  const getClientEmail = (clientUserId: string) => {
    const matches = invitations
      .filter((inv: any) => inv.accepted_by_user_id === clientUserId);
    if (matches.length > 0) {
      matches.sort((a: any, b: any) =>
        new Date(b.accepted_at || b.created_at).getTime() -
        new Date(a.accepted_at || a.created_at).getTime()
      );
      return matches[0]?.email as string | undefined;
    }
    return undefined;
  };

  const filteredAssociations = dataAssociations.filter((a: any) => {
    const typeMatch = typeFilter === 'all' || a.data_type === typeFilter;
    const email = getClientEmail(a.client_user_id) || '';
    const clientMatch = !searchTerm || a.client_user_id?.includes(searchTerm) || email.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && clientMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "pending": return "bg-orange-500 text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Only administrators can access client management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Portal Management</h1>
          <p className="text-muted-foreground">
            Manage client access and portal permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/client-portal">
            <Plus className="mr-2 h-4 w-4" />
            Invite Client
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+5</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.totalClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Clients</p>
            <p className="text-xs text-muted-foreground">All registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">Active</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.activeClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Clients</p>
            <p className="text-xs text-muted-foreground">Currently using portal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm text-orange-600 font-medium">Pending</span>
            </div>
            <CardTitle className="text-2xl font-bold">{clientStats.pendingInvites}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Pending Invites</p>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-sm text-success font-medium">+12%</span>
            </div>
            <CardTitle className="text-2xl font-bold">${clientStats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Client Revenue</p>
            <p className="text-xs text-muted-foreground">Total managed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invitations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="client-management">Client Management</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Client Invitation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Create Client Invitation
                </CardTitle>
                <CardDescription>
                  Send an invitation to give a client access to specific data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(value: "admin" | "client") => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(permissions).map(([key, checked]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={checked}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({ ...prev, [key]: !!checked }))
                          }
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreateInvitation} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invitation
                </Button>
              </CardContent>
            </Card>

            {/* All Invitations */}
            <Card>
              <CardHeader>
                <CardTitle>All Invitations</CardTitle>
                <CardDescription>
                  Complete list of invitations with status tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground">No invitations yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{invitation.email}</p>
                            {getStatusBadge(invitation)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Role: {invitation.role} • Created: {new Date(invitation.created_at).toLocaleDateString()}
                            {invitation.expires_at && ` • Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`}
                            {invitation.reminder_count > 0 && ` • Reminders sent: ${invitation.reminder_count}`}
                          </p>
                        </div>
                        {invitation.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationLink(invitation.invitation_token)}
                            >
                              Copy Link
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleResendEmail(invitation)}
                            >
                              Resend Email
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invitation Lifecycle Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Invitation Lifecycle Management
                </CardTitle>
                <CardDescription>
                  Automate and manage invitation expiry, cleanup, and reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualMaintenance('send_reminders')}
                  >
                    Send Reminders
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualMaintenance('expire_invitations')}
                  >
                    Expire Old
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualMaintenance('cleanup_expired')}
                  >
                    Cleanup Expired
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualMaintenance('full_maintenance')}
                  >
                    Full Maintenance
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleRemovePendingAndExpired}
                >
                  Remove All Pending + Expired
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="client-management" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Client Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Client Access
                </CardTitle>
                <CardDescription>
                  Clients with current portal access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientAccess.length === 0 ? (
                  <p className="text-muted-foreground">No active client access</p>
                ) : (
                  <div className="space-y-2">
                    {clientAccess.map((access) => (
                      <div key={access.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Client ID: {access.client_user_id}</p>
                          <p className="text-sm text-muted-foreground">Email: {getClientEmail(access.client_user_id) ?? 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Role: {access.role} • Status: {access.status}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeAccess(access.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


            <NameLinker />

            {/* Data Associations Manager */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Data Associations</CardTitle>
                <CardDescription>View, filter, edit, or remove client data links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter by client email or ID"
                  />
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue placeholder="Data type" />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="copyright">Copyright</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="royalty_allocation">Royalty Allocation</SelectItem>
                        <SelectItem value="sync_license">Sync License</SelectItem>
                        <SelectItem value="payee">Payee</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                {filteredAssociations.length === 0 ? (
                  <p className="text-muted-foreground">No associations found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Data Type</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssociations.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{getClientEmail(a.client_user_id) ?? 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{a.client_user_id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingId === a.id ? (
                              <Select value={editForm.dataType} onValueChange={(v) => setEditForm((p) => ({ ...p, dataType: v as any }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="copyright">Copyright</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="royalty_allocation">Royalty Allocation</SelectItem>
                                  <SelectItem value="sync_license">Sync License</SelectItem>
                                  <SelectItem value="payee">Payee</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="uppercase text-xs">{a.data_type}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === a.id ? (
                              <Input
                                value={editForm.dataId}
                                onChange={(e) => setEditForm((p) => ({ ...p, dataId: e.target.value }))}
                                placeholder="UUID"
                              />
                            ) : (
                              <span className="text-sm">{getDataLabel(a)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === a.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveAssociationEdit}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleStartEdit(a)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteAssociation(a.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>Showing {filteredAssociations.length} association(s)</TableCaption>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Permissions</CardTitle>
              <CardDescription>
                Configure which modules clients can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Available Modules</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Copyright Management</span>
                      <Badge variant="secondary">38 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Contract Management</span>
                      <Badge variant="secondary">25 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Royalties Processing</span>
                      <Badge variant="secondary">42 clients</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Sync Licensing</span>
                      <Badge variant="secondary">15 clients</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Permission Levels</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded">
                      <div className="font-medium">View Only</div>
                      <div className="text-sm text-muted-foreground">Read-only access to data</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Full Access</div>
                      <div className="text-sm text-muted-foreground">Complete module functionality</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Custom</div>
                      <div className="text-sm text-muted-foreground">Granular permission control</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Portal Usage Analytics</CardTitle>
              <CardDescription>
                Client activity and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">
                    {Math.round((clientStats.activeClients / Math.max(clientStats.totalClients, 1)) * 100)}%
                  </div>
                  <p className="text-muted-foreground text-sm">Active client usage rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">Royalties</div>
                  <p className="text-muted-foreground text-sm">Most used module</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{clientStats.pendingInvites}</div>
                  <p className="text-muted-foreground text-sm">Pending invitations</p>
                </div>
              </div>
              
              <div className="text-center py-8 text-muted-foreground border-t">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>Detailed analytics dashboard coming soon</p>
                <p className="text-sm">Track portal usage and engagement metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}