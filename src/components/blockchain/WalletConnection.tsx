import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const WalletConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        alert('Please install MetaMask to connect your wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
  };

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your Web3 wallet to start minting and managing blockchain assets.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </Button>
            
            <Button variant="outline" className="w-full" disabled>
              <Wallet className="w-4 h-4 mr-2" />
              WalletConnect (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  Connected
                </Badge>
                <span className="text-sm font-medium">MetaMask</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Network</p>
              <p className="font-medium">Polygon Mainnet</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p className="font-medium">-- MATIC</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Polygonscan
          </Button>
        </div>
      )}
    </div>
  );
};