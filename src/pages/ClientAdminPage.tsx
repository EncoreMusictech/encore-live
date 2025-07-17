import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useClientPortal } from "@/hooks/useClientPortal";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Mail, Users, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { ClientPortalTestHelper } from "@/components/ClientPortalTestHelper";

export default function ClientAdminPage() {
  const { toast } = useToast();
  const { clientAccess, invitations, createInvitation, revokeClientAccess, createDataAssociation, refreshData } = useClientPortal();
  
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
    dataType: "copyright" as "copyright" | "contract" | "royalty_allocation" | "sync_license",
    dataId: ""
  });

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

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/client-portal?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied",
      description: "Invitation link copied to clipboard",
    });
  };

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

          {/* Create Data Association */}
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

          {/* Active Invitations */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
                <p className="text-muted-foreground">No pending invitations</p>
              ) : (
                <div className="space-y-2">
                  {invitations
                    .filter(inv => inv.status === 'pending')
                    .map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Role: {invitation.role} • Created: {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(invitation.invitation_token)}
                        >
                          Copy Link
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>

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