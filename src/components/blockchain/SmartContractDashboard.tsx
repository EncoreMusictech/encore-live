import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock, DollarSign, Users, Settings, Play } from "lucide-react";

export const SmartContractDashboard = () => {
  const contracts = [
    {
      id: "1",
      name: "Automated Royalty Split",
      type: "Royalty Distribution",
      status: "Active",
      participants: 3,
      totalValue: "$2,450.00",
      nextExecution: "2025-02-01",
      progress: 75
    },
    {
      id: "2", 
      name: "Rights Escrow Agreement",
      type: "Escrow",
      status: "Pending",
      participants: 2,
      totalValue: "$10,000.00",
      nextExecution: "2025-01-15",
      progress: 30
    }
  ];

  const contractTypes = [
    {
      title: "Royalty Distribution",
      description: "Automatically split royalties based on ownership percentages",
      icon: DollarSign,
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Rights Escrow",
      description: "Hold rights or payments in escrow until conditions are met",
      icon: Shield,
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: "Usage Licensing",
      description: "Automated licensing with instant payment processing",
      icon: Play,
      color: "bg-purple-500/10 text-purple-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Create New Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Smart Contract Templates
          </CardTitle>
          <CardDescription>
            Create automated contracts for royalty distribution and rights management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {contractTypes.map(type => (
              <Card key={type.title} className="cursor-pointer hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-md ${type.color}`}>
                      <type.icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{type.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" className="w-full">Deploy Contract</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Smart Contracts</CardTitle>
          <CardDescription>
            Monitor and manage your deployed blockchain contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No smart contracts deployed yet</p>
              <p className="text-sm text-muted-foreground">Deploy your first contract using the templates above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map(contract => (
                <Card key={contract.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{contract.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{contract.type}</Badge>
                          <Badge 
                            variant={contract.status === 'Active' ? 'default' : 'secondary'}
                            className={contract.status === 'Active' ? 'bg-green-500/10 text-green-500' : ''}
                          >
                            {contract.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">{contract.totalValue}</p>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Execution Progress</span>
                        <span>{contract.progress}%</span>
                      </div>
                      <Progress value={contract.progress} className="h-2" />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{contract.participants} participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Next: {contract.nextExecution}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};