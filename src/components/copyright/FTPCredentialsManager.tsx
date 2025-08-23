import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Settings, 
  Trash2, 
  TestTube, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Server
} from 'lucide-react';
import { useFTPCredentials } from '@/hooks/useFTPCredentials';
import { useToast } from '@/hooks/use-toast';

interface FTPCredentialFormData {
  pro_name: string;
  pro_code: string;
  host: string;
  port: number;
  username: string;
  password: string;
  base_path: string;
  connection_type: 'ftp' | 'sftp';
}

const FTPCredentialsManager: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCredential, setEditingCredential] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState<FTPCredentialFormData>({
    pro_name: '',
    pro_code: '',
    host: '',
    port: 21,
    username: '',
    password: '',
    base_path: '/',
    connection_type: 'ftp'
  });

  const { credentials, loading, testing, createCredential, updateCredential, deleteCredential, testConnection } = useFTPCredentials();
  const { toast } = useToast();

  const handleCreate = async () => {
    const result = await createCredential(formData);
    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingCredential) return;
    
    const { password, ...updateData } = formData;
    const result = await updateCredential(editingCredential, password ? formData : updateData);
    if (result) {
      setEditingCredential(null);
      resetForm();
    }
  };

  const handleEdit = (credential: any) => {
    setEditingCredential(credential.id);
    setFormData({
      pro_name: credential.pro_name,
      pro_code: credential.pro_code,
      host: credential.host,
      port: credential.port,
      username: credential.username,
      password: '', // Don't populate password for security
      base_path: credential.base_path,
      connection_type: credential.connection_type
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      pro_name: '',
      pro_code: '',
      host: '',
      port: 21,
      username: '',
      password: '',
      base_path: '/',
      connection_type: 'ftp'
    });
    setEditingCredential(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="text-emerald-700 bg-emerald-50"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Untested</Badge>;
    }
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPassword(prev => ({ ...prev, [credentialId]: !prev[credentialId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">FTP/SFTP Credentials</h2>
          <p className="text-muted-foreground">Manage PRO delivery endpoints for automated export transmission</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add FTP Credentials
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCredential ? 'Edit FTP Credentials' : 'Add FTP Credentials'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pro_name">PRO Name</Label>
                  <Input
                    id="pro_name"
                    value={formData.pro_name}
                    onChange={(e) => setFormData({ ...formData, pro_name: e.target.value })}
                    placeholder="e.g., ASCAP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pro_code">PRO Code</Label>
                  <Input
                    id="pro_code"
                    value={formData.pro_code}
                    onChange={(e) => setFormData({ ...formData, pro_code: e.target.value })}
                    placeholder="e.g., ASCAP"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="ftp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 21 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connection_type">Connection Type</Label>
                <Select 
                  value={formData.connection_type} 
                  onValueChange={(value: 'ftp' | 'sftp') => setFormData({ ...formData, connection_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ftp">FTP</SelectItem>
                    <SelectItem value="sftp">SFTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingCredential ? "Leave blank to keep current password" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_path">Base Path</Label>
                <Input
                  id="base_path"
                  value={formData.base_path}
                  onChange={(e) => setFormData({ ...formData, base_path: e.target.value })}
                  placeholder="/"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingCredential ? handleUpdate : handleCreate}
                disabled={loading}
              >
                {editingCredential ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No FTP Credentials Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add FTP/SFTP credentials to enable automated export delivery to PROs.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First FTP Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configured FTP/SFTP Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PRO</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.map((credential) => (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{credential.pro_name}</div>
                        <div className="text-sm text-muted-foreground">{credential.pro_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {credential.host}:{credential.port}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {credential.base_path}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {credential.connection_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(credential.connection_status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {credential.last_connection_test 
                          ? new Date(credential.last_connection_test).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(credential.id)}
                          disabled={testing === credential.id}
                        >
                          {testing === credential.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          ) : (
                            <TestTube className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(credential)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete FTP Credentials</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the FTP credentials for {credential.pro_name}? 
                                This action cannot be undone and will prevent automated delivery to this endpoint.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCredential(credential.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FTPCredentialsManager;