import { useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useSearchParams } from "react-router-dom";
import { TrendingUp, FileText, Copyright, Film, DollarSign } from "lucide-react";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useTour } from "@/hooks/useTour";
const DemoModulesPage = () => {
  const { getRemainingUsage, canAccess } = useDemoAccess();

  useEffect(() => {
    updatePageMetadata('modules');
  }, []);

  const demoModules = [
    {
      id: "catalog-valuation",
      title: "Catalog Valuation & Deal Simulator",
      description: "AI-powered catalog assessment with 3-5 year forecasting and deal simulation tools. Includes 1 demo valuation and 1 demo deal scenario save.",
      icon: TrendingUp,
      path: "/catalog-valuation",
      demoKey: "catalogValuation",
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
      path: "/contract-management",
      demoKey: "contractManagement"
    },
    {
      id: "copyright-management",
      title: "Copyright Management",
      description: "Register and track copyrights with split assignments and metadata management",
      icon: Copyright,
      path: "/copyright-management",
      demoKey: "copyrightManagement"
    },
    {
      id: "sync-licensing",
      title: "Sync Licensing Tracker",
      description: "Comprehensive sync deal pipeline with pitch tracking and deal memo generation",
      icon: Film,
      path: "/sync-licensing",
      demoKey: "syncLicensing"
    },
    {
      id: "royalties-processing",
      title: "Royalties Processing",
      description: "Complete royalty management system from reconciliation to payouts",
      icon: DollarSign,
      path: "/reconciliation",
      demoKey: "royaltiesProcessing",
      subModules: [
        { title: "Reconciliation", path: "/reconciliation" },
        { title: "Royalties Allocation", path: "/royalties" },
        { title: "Payouts & Client Accounting", path: "/payouts" }
      ]
    }
  ];

  const { startTour } = useTour();
  const [searchParams] = useSearchParams();

  const steps = [
    {
      target: "[data-tour='demo-title']",
      content: "Welcome! This page lists all demo modules you can explore.",
    },
    {
      target: "[data-tour='demo-limits']",
      content: "In demo mode, each module allows one key action to showcase the workflow.",
    },
    {
      target: "[data-tour='module-card-catalog-valuation']",
      content: "Start with Catalog Valuation & Deal Simulator to analyze catalogs and model deals.",
    },
    {
      target: "[data-tour='module-card-royalties-processing']",
      content: "Royalties suite covers Reconciliation, Royalties, and Payouts end-to-end.",
    },
    {
      target: "[data-tour='module-card-contract-management']",
      content: "Create, upload, or import contracts with smart templates and parsing.",
    },
    {
      target: "[data-tour='module-card-sync-licensing']",
      content: "Track sync opportunities with table, kanban, and calendar views.",
    },
    {
      target: "[data-tour='demo-cta']",
      content: "Ready to unlock everything? View pricing or sign up anytime.",
    },
  ];

  useEffect(() => {
    updatePageMetadata('modules');
  }, []);

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      startTour(steps);
    }
  }, [searchParams, startTour]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-tour="demo-title">Demo Access - Music Industry Tools</h1>
              <p className="text-muted-foreground">Explore our powerful music industry modules with limited demo access. Sign up for unlimited usage!</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-primary text-primary-foreground" data-tour="demo-mode-badge">
                Demo Mode
              </Badge>
              <Button variant="outline" size="sm" onClick={() => startTour(steps)} data-tour="start-tour-btn">
                Start Interactive Tour
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-muted rounded-lg" data-tour="demo-limits">
          <h3 className="font-semibold mb-2">Demo Limitations</h3>
          <p className="text-sm text-muted-foreground">
            Each module allows 1 demo action. Once used, you'll need to sign up for full access to continue using the tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoModules.map((module) => {
            const IconComponent = module.icon;
            const remainingUsage = getRemainingUsage(module.demoKey);
            const hasAccess = canAccess(module.demoKey);
            const isUsed = remainingUsage === 0;
            
            return (
              <Card key={module.id} data-tour={`module-card-${module.id}`} className={`hover:shadow-lg transition-shadow ${isUsed ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2 w-fit ${isUsed ? 'bg-muted' : 'bg-gradient-primary'}`}>
                      <IconComponent className={`h-6 w-6 ${isUsed ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant={isUsed ? "outline" : "secondary"} 
                        className={isUsed ? "text-muted-foreground" : "bg-green-100 text-green-800"}
                      >
                        {isUsed ? "Used" : "Available"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {remainingUsage} of 1 demo{remainingUsage !== 1 ? 's' : ''} left
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasAccess ? (
                    <Button asChild className="w-full">
                      <Link to={module.path}>
                        Try Demo
                      </Link>
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button disabled className="w-full">
                        Demo Used
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/auth">Sign Up for Full Access</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg" data-tour="demo-cta">
          <h3 className="text-xl font-semibold mb-2">Ready for Full Access?</h3>
          <p className="text-muted-foreground mb-4">
            Unlock unlimited usage of all modules and access advanced features.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/auth">Sign Up Now</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModulesPage;