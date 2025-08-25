import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Copyright, DollarSign, Coins, Upload } from "lucide-react";

export const AssetMinting = () => {
  const [selectedAssetType, setSelectedAssetType] = useState("contract");
  const [isMinting, setIsMinting] = useState(false);

  const assetTypes = [
    {
      id: "contract",
      title: "Contract NFT",
      description: "Mint a contract as an NFT with terms and execution status",
      icon: FileText,
      examples: ["Publishing Agreement", "Artist Contract", "Producer Deal"]
    },
    {
      id: "copyright",
      title: "Copyright NFT", 
      description: "Tokenize musical works with ownership splits",
      icon: Copyright,
      examples: ["Song Copyright", "Album Rights", "Publishing Rights"]
    },
    {
      id: "royalty",
      title: "Royalty Transaction NFT",
      description: "Mint royalty statements as proof of earnings",
      icon: DollarSign,
      examples: ["Streaming Royalties", "Performance Rights", "Sync Fees"]
    }
  ];

  const handleMint = async () => {
    setIsMinting(true);
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsMinting(false);
  };

  const selectedType = assetTypes.find(type => type.id === selectedAssetType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Asset Minting
          </CardTitle>
          <CardDescription>
            Convert your music assets into blockchain NFTs for provenance tracking and trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asset Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Asset Type</Label>
            <div className="grid gap-4 md:grid-cols-3">
              {assetTypes.map(type => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAssetType === type.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAssetType(type.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <CardTitle className="text-sm">{type.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {type.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {type.examples.map(example => (
                        <Badge key={example} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Minting Form */}
          {selectedType && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <selectedType.icon className="h-5 w-5" />
                <h3 className="text-lg font-medium">Mint {selectedType.title}</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Asset Name</Label>
                  <Input
                    id="asset-name"
                    placeholder={`Enter ${selectedType.title.toLowerCase()} name`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset-source">Source Asset</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No existing assets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the asset and its significance"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="royalty-percentage">Royalty Percentage</Label>
                  <Input
                    id="royalty-percentage"
                    type="number"
                    placeholder="5.0"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supply">NFT Supply</Label>
                  <Input
                    id="supply"
                    type="number"
                    placeholder="1"
                    min="1"
                    defaultValue="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metadata Files</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: PDF, DOC, MP3, WAV (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleMint} disabled={isMinting} className="flex-1">
                  {isMinting ? "Minting..." : `Mint ${selectedType.title}`}
                </Button>
                <Button variant="outline">Preview NFT</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};