import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BarChart3, Calculator, TrendingUp, FileText, Copyright, Film, DollarSign } from "lucide-react";

const ModulesPage = () => {
  const subscribedModules = [
    {
      id: "catalog-valuation",
      title: "Catalog Valuation",
      description: "AI-powered catalog assessment with 3-5 year forecasting and deal simulation tools",
      icon: TrendingUp,
      status: "Active",
      path: "/catalog-valuation",
      subModules: [
        { title: "Catalog Valuation", path: "/catalog-valuation" },
        { title: "Deal Simulator", path: "/deal-simulator" }
      ]
    },
    {
      id: "contract-management",
      title: "Contract Management",
      description: "Manage music industry agreements with smart contract features",
      icon: FileText,
      status: "Active",
      path: "/contract-management"
    },
    {
      id: "copyright-management",
      title: "Copyright Management",
      description: "Register and track copyrights with split assignments and metadata management",
      icon: Copyright,
      status: "Active",
      path: "/copyright-management"
    },
    {
      id: "sync-licensing",
      title: "Sync Licensing Tracker",
      description: "Comprehensive sync deal pipeline with pitch tracking and deal memo generation",
      icon: Film,
      status: "Active",
      path: "/sync-licensing"
    },
    {
      id: "royalties-processing",
      title: "Royalties Processing",
      description: "Complete royalty management system from reconciliation to payouts",
      icon: DollarSign,
      status: "Active",
      path: "/reconciliation",
      subModules: [
        { title: "Reconciliation", path: "/reconciliation" },
        { title: "Royalties Allocation", path: "/royalties" },
        { title: "Payouts & Client Accounting", path: "/payouts" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Modules</h1>
          <p className="text-muted-foreground">Manage your subscribed modules and access powerful music industry tools.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscribedModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-primary rounded-lg p-2 w-fit">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {module.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={module.path}>
                      Open Module
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;