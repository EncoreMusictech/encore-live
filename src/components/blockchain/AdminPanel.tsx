import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Users, Activity, AlertTriangle, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

interface BlockchainTransaction {
  id: string;
  user_id: string;
  transaction_hash: string;
  transaction_type: string;
  network: string;
  status: string;
  gas_used?: number;
  gas_price?: number;
  value_eth?: number;
  created_at: string;
}

export const AdminPanel = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch admin settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('blockchain_admin_settings')
        .select('*')
        .order('setting_key');

      if (settingsError) throw settingsError;
      setSettings(settingsData || []);

      // Fetch all blockchain transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('blockchain_admin_settings')
        .update({ setting_value: newValue })
        .eq('setting_key', settingKey);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${settingKey} setting`
      });

      fetchAdminData();
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const stats = [
    {
      title: "Total Users",
      value: "--",
      icon: Users,
      description: "Active blockchain users"
    },
    {
      title: "Total Transactions",
      value: transactions.length.toString(),
      icon: Activity,
      description: "All blockchain transactions"
    },
    {
      title: "Pending Transactions",
      value: transactions.filter(t => t.status === 'pending').length.toString(),
      icon: AlertTriangle,
      description: "Transactions awaiting confirmation"
    },
    {
      title: "System Health",
      value: "Healthy",
      icon: Shield,
      description: "Overall system status"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Controls */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Monitor</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Blockchain Configuration
              </CardTitle>
              <CardDescription>
                Manage system-wide blockchain settings and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label className="text-sm font-medium">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</Label>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                  <div className="flex gap-2">
                    <Textarea
                      value={JSON.stringify(setting.setting_value, null, 2)}
                      onChange={(e) => {
                        try {
                          const newValue = JSON.parse(e.target.value);
                          const updatedSettings = settings.map(s =>
                            s.id === setting.id ? { ...s, setting_value: newValue } : s
                          );
                          setSettings(updatedSettings);
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      className="min-h-[100px] font-mono text-sm"
                    />
                    <Button
                      onClick={() => updateSetting(setting.setting_key, setting.setting_value)}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Transaction Monitor
              </CardTitle>
              <CardDescription>
                Monitor all blockchain transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No blockchain transactions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hash</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gas Used</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.transaction_type}</Badge>
                        </TableCell>
                        <TableCell>{tx.network}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={tx.status === 'completed' ? 'default' : 
                                   tx.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.gas_used ? tx.gas_used.toLocaleString() : '--'}</TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user access and blockchain permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">User management features coming soon</p>
                <p className="text-sm text-muted-foreground">
                  This will include user role management, blockchain permissions, and access controls
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                System maintenance tools and diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Clear Transaction Cache</Label>
                  <Button variant="outline" className="w-full">
                    Clear Cache
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Refresh Network Status</Label>
                  <Button variant="outline" className="w-full">
                    Refresh Status
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Backup Configuration</Label>
                  <Button variant="outline" className="w-full">
                    Create Backup
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>System Health Check</Label>
                  <Button variant="outline" className="w-full">
                    Run Diagnostics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};