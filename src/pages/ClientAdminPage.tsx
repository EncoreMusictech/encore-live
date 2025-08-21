import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { updatePageMetadata } from "@/utils/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClientPortal } from "@/hooks/useClientPortal";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Mail, Users, Database, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, Pencil, Trash2, Check, X, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ClientPortalTestHelper } from "@/components/ClientPortalTestHelper";
import { NameLinker } from "@/components/client-portal/NameLinker";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientAdminPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    updatePageMetadata('clientPortal');
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Client Portal Administration</h1>
            <p className="text-muted-foreground">Manage client invitations and data access</p>
          </div>
        </div>

        <div className="mb-6">
          <ClientPortalTestHelper />
        </div>

        <Tabs defaultValue="invitations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="client-management">Client Management</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Create Invitation */}
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
                  <div className="space-y-2">
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
          </TabsContent>

          <TabsContent value="client-management" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Active Client Access */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Client Access
                  </CardTitle>
                  <CardDescription>
                    Clients with current portal access - View their portal or revoke access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientAccess.length === 0 ? (
                    <p className="text-muted-foreground">No active client access</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientAccess.map((access) => (
                          <TableRow key={access.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getClientEmail(access.client_user_id) ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{access.client_user_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>{access.role}</TableCell>
                            <TableCell>
                              <Badge variant={access.status === 'active' ? 'default' : 'secondary'}>
                                {access.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔍 Navigating to client portal for:', access.client_user_id);
                                    window.open(`/client-portal?client_id=${access.client_user_id}`, '_blank');
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Portal
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevokeAccess(access.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <NameLinker />

              {/* Data Associations Manager */}
              <Card>
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

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Create Data Association
                </CardTitle>
                <CardDescription>
                  Associate specific data records with a client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientUserId">Client User ID</Label>
                  <Input
                    id="clientUserId"
                    value={associationForm.clientUserId}
                    onChange={(e) => setAssociationForm(prev => ({ ...prev, clientUserId: e.target.value }))}
                    placeholder="Client's UUID"
                  />
                </div>

                <div>
                  <Label htmlFor="dataType">Data Type</Label>
                  <Select 
                    value={associationForm.dataType} 
                    onValueChange={(value: typeof associationForm.dataType) => 
                      setAssociationForm(prev => ({ ...prev, dataType: value }))
                    }
                  >
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
                </div>

                <div>
                  <Label htmlFor="dataId">Data ID</Label>
                  <Input
                    id="dataId"
                    value={associationForm.dataId}
                    onChange={(e) => setAssociationForm(prev => ({ ...prev, dataId: e.target.value }))}
                    placeholder="Record UUID"
                  />
                </div>

                <Button onClick={handleCreateAssociation} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Association
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Testing Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Testing</CardTitle>
            <CardDescription>
              Use these SQL commands in Supabase SQL Editor for quick testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Create test user and invitation:</h4>
                <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Create test invitation
INSERT INTO client_invitations (email, permissions, subscriber_user_id)
VALUES ('test@example.com', '{"contracts": {"enabled": true}, "copyright": {"enabled": true}}', auth.uid());`}
                </code>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. View your data for associations:</h4>
                <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- View your copyrights
SELECT id, work_title FROM copyrights WHERE user_id = auth.uid() LIMIT 5;

-- View your contracts  
SELECT id, title FROM contracts WHERE user_id = auth.uid() LIMIT 5;`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}