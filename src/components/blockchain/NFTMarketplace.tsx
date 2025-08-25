import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Eye, Music, FileText, DollarSign, TrendingUp } from "lucide-react";

export const NFTMarketplace = () => {
  const [view, setView] = useState("my-nfts");

  const myNFTs = [
    {
      id: "1",
      name: "Song Rights - Summer Vibes",
      type: "Copyright",
      price: "2.5 ETH",
      status: "Listed",
      views: 124,
      image: "/placeholder.svg"
    },
    {
      id: "2",  
      name: "Producer Agreement - Beat Pack Vol.1",
      type: "Contract",
      price: "Not Listed",
      status: "Owned",
      views: 0,
      image: "/placeholder.svg"
    }
  ];

  const marketplaceNFTs = [
    {
      id: "3",
      name: "Publishing Rights - Electronic Dreams",
      type: "Copyright", 
      price: "5.0 ETH",
      seller: "0x1234...5678",
      royalty: "10%",
      image: "/placeholder.svg"
    },
    {
      id: "4",
      name: "Sync License - Commercial Use",
      type: "License",
      price: "1.2 ETH", 
      seller: "0x9876...5432",
      royalty: "5%",
      image: "/placeholder.svg"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Copyright': return Music;
      case 'Contract': return FileText;
      case 'License': return DollarSign;
      default: return Music;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Copyright': return 'bg-blue-500/10 text-blue-500';
      case 'Contract': return 'bg-green-500/10 text-green-500';  
      case 'License': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Rights Marketplace
          </CardTitle>
          <CardDescription>
            Trade tokenized music rights with verified ownership and provenance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="marketplace">Browse Marketplace</TabsTrigger>
          <TabsTrigger value="activity">Trading Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nfts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Tokenized Assets</h3>
            <Button size="sm">List New Asset</Button>
          </div>

          {myNFTs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't minted any NFTs yet</p>
                <p className="text-sm text-muted-foreground">Start by minting your first asset</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myNFTs.map(nft => {
                const TypeIcon = getTypeIcon(nft.type);
                return (
                  <Card key={nft.id} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getTypeColor(nft.type)}>{nft.type}</Badge>
                          <Badge variant={nft.status === 'Listed' ? 'default' : 'secondary'}>
                            {nft.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2">{nft.name}</h3>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{nft.price}</span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>{nft.views}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            {nft.status === 'Listed' ? 'Update Listing' : 'List for Sale'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input placeholder="Search assets..." className="max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="copyright">Copyright</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="license">License</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="price-low">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceNFTs.map(nft => {
              const TypeIcon = getTypeIcon(nft.type);
              return (
                <Card key={nft.id} className="overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <TypeIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(nft.type)}>{nft.type}</Badge>
                        <Badge variant="outline">{nft.royalty} royalty</Badge>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2">{nft.name}</h3>
                      <p className="text-xs text-muted-foreground">by {nft.seller}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{nft.price}</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1">Purchase</Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No trading activity yet</p>
              <p className="text-sm text-muted-foreground">Start trading to see your transaction history</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};