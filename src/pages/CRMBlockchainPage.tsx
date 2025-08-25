import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Wallet, Coins, Shield, Activity, TrendingUp } from "lucide-react";
import { updatePageMetadata } from "@/utils/metadata";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { WalletConnection } from "@/components/blockchain/WalletConnection";
import { AssetMinting } from "@/components/blockchain/AssetMinting";
import { SmartContractDashboard } from "@/components/blockchain/SmartContractDashboard";
import { NFTMarketplace } from "@/components/blockchain/NFTMarketplace";
import { BlockchainAnalytics } from "@/components/blockchain/BlockchainAnalytics";
import { AdminPanel } from "@/components/blockchain/AdminPanel";

export default function CRMBlockchainPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");

  // Update page metadata
  updatePageMetadata({
    title: "Digital Rights & Blockchain | Encore Music",
    description: "Mint and manage your music assets on the blockchain with smart contract automation"
  });

  const stats = [
    {
      title: "Total Minted Assets",
      value: "0",
      icon: Coins,
      description: "NFTs created from your assets"
    },
    {
      title: "Smart Contracts",
      value: "0",
      icon: Shield,
      description: "Active automated contracts"
    },
    {
      title: "Blockchain Revenue",
      value: "$0.00",
      icon: TrendingUp,
      description: "Earnings from tokenized rights"
    },
    {
      title: "Wallet Status",
      value: "Disconnected",
      icon: Wallet,
      description: "Web3 wallet connection"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Rights & Blockchain</h1>
          <p className="text-muted-foreground">
            Mint, manage, and trade your music assets on the blockchain
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Link2 className="w-4 h-4 mr-1" />
          Enterprise Module
        </Badge>
      </div>

      {/* Stats Overview */}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="minting">Asset Minting</TabsTrigger>
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>
                  Connect your Web3 wallet to start minting assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WalletConnection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest blockchain transactions and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No blockchain activity yet. Start by connecting your wallet and minting your first asset.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="minting">
          <AssetMinting />
        </TabsContent>

        <TabsContent value="contracts">
          <SmartContractDashboard />
        </TabsContent>

        <TabsContent value="marketplace">
          <NFTMarketplace />
        </TabsContent>

        <TabsContent value="analytics">
          <BlockchainAnalytics />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}