import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Check, 
  X, 
  Music, 
  Copyright, 
  FileText, 
  Zap, 
  TrendingUp, 
  Users, 
  Package, 
  Star,
  Crown,
  Building,
  Sparkles,
  Calculator,
  Shield,
  Code,
  Palette,
  Plus
} from "lucide-react";

// Module Data
const moduleData = [
  {
    id: "royalties",
    name: "Royalties Processing",
    icon: Music,
    price: 199,
    description: "Complete royalty management from reconciliation to payouts",
    features: [
      "Bulk import royalty statements",
      "Work-to-rightsholder mapping",
      "Automated royalty calculations",
      "Periodic client statements",
      "Payment tracking & history"
    ]
  },
  {
    id: "copyright",
    name: "Copyright Management", 
    icon: Copyright,
    price: 99,
    description: "Register and track copyrights with split assignments",
    features: [
      "ISRC/ISWC/IPI tracking",
      "Writer/publisher splits",
      "PRO registration status",
      "Duplicate warnings",
      "Metadata form builder"
    ]
  },
  {
    id: "contracts",
    name: "Contract Management",
    icon: FileText,
    price: 59,
    description: "Centralized contract storage with smart tagging and alerts",
    features: [
      "Upload & organize contracts",
      "Auto-tag by deal type",
      "Renewal deadline alerts",
      "Template library access",
      "Smart field extraction"
    ]
  },
  {
    id: "sync",
    name: "Sync Licensing Tracker",
    icon: Zap,
    price: 149,
    description: "Comprehensive sync deal pipeline with pitch tracking",
    features: [
      "Pitch status tracking",
      "Media type categorization",
      "Territory & term management",
      "Contract attachments",
      "Auto-generated deal memos"
    ]
  },
  {
    id: "valuation",
    name: "Catalog Valuation",
    icon: TrendingUp,
    price: 99,
    description: "AI-powered catalog assessment with deal simulation tools",
    features: [
      "Revenue history analysis",
      "Growth modeling (CAGR)",
      "Scenario-based estimates",
      "Deal structure simulation",
      "Downloadable investor reports"
    ]
  },
  {
    id: "dashboard",
    name: "Client Portal",
    icon: Users,
    price: 149,
    description: "Secure tier-based access for artists, managers, and vendors",
    features: [
      "Artist earnings dashboard",
      "Manager deal oversight",
      "Vendor collaboration",
      "Permission-based content",
      "Custom reporting views"
    ]
  }
];

// Bundled Plans Data
const bundledPlans = [
  {
    id: "starter",
    name: "Starter Creator",
    audience: "Indie songwriters",
    price: 79,
    regularPrice: 158,
    savings: 50,
    modules: ["copyright", "contracts"],
    features: [
      "ISRC/ISWC/IPI tracking",
      "Writer/publisher splits",
      "Upload & organize contracts",
      "Auto-tag by deal type",
      "Email support"
    ],
    icon: Sparkles
  },
  {
    id: "essentials",
    name: "Essentials",
    audience: "Small rights holders", 
    price: 149,
    regularPrice: 257,
    savings: 42,
    modules: ["copyright", "contracts", "valuation"],
    features: [
      "Full copyright management",
      "Centralized contract storage",
      "Catalog valuation & deal simulation",
      "Revenue history analysis",
      "Priority email support"
    ],
    icon: Package
  },
  {
    id: "publishing-pro",
    name: "Publishing Pro",
    audience: "Indie publishers",
    price: 299,
    regularPrice: 357,
    savings: 16,
    modules: ["royalties", "copyright", "contracts"],
    features: [
      "Complete royalty processing",
      "Bulk import royalty statements",
      "Writer/publisher split management",
      "Smart contract organization",
      "Phone support"
    ],
    icon: Crown,
    popular: true
  },
  {
    id: "licensing-pro", 
    name: "Licensing Pro",
    audience: "Sync agents, labels",
    price: 349,
    regularPrice: 497,
    savings: 30,
    modules: ["sync", "royalties", "dashboard"],
    features: [
      "Pitch status tracking",
      "Deal memo generation",
      "Royalty distribution",
      "Tier-based client access",
      "Dedicated support"
    ],
    icon: Zap
  },
  {
    id: "growth",
    name: "Growth Bundle", 
    audience: "Scaling admins",
    price: 449,
    regularPrice: 556,
    savings: 19,
    modules: ["royalties", "copyright", "contracts", "valuation"],
    features: [
      "Full royalty management suite",
      "Advanced copyright tracking",
      "Contract automation",
      "Catalog valuation tools",
      "Priority support"
    ],
    icon: TrendingUp
  },
  {
    id: "enterprise",
    name: "Enterprise Suite",
    audience: "Enterprise users", 
    price: 849,
    regularPrice: 1145,
    savings: 26,
    modules: ["royalties", "copyright", "contracts", "sync", "valuation", "dashboard"],
    features: [
      "All modules included",
      "Complete workflow automation",
      "Multi-tier client portal access", 
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "Priority support"
    ],
    icon: Building
  }
];


// Comparison table data
const comparisonFeatures = [
  { name: "Royalties Module", modules: ["royalties"] },
  { name: "Copyright Module", modules: ["copyright"] },
  { name: "Contract Manager", modules: ["contracts"] },
  { name: "Sync Licensing", modules: ["sync"] },
  { name: "Catalog Valuation", modules: ["valuation"] },
  { name: "Client Dashboard", modules: ["dashboard"] },
  { name: "API Access", modules: [] },
  { name: "Priority Support", modules: [] },
  { name: "White Label", modules: [] }
];

const PricingPage = () => {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { subscribed, subscription_tier, loading, createCheckout, openCustomerPortal } = useSubscription();
  const { createTrialCheckout } = useFreeTrial();

  useEffect(() => {
    updatePageMetadata('pricing');
  }, []);

  const handleModuleToggle = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const calculateModulesTotal = () => {
    return Array.from(selectedModules).reduce((total, moduleId) => {
      const module = moduleData.find(m => m.id === moduleId);
      return total + (module?.price || 0);
    }, 0);
  };

  const calculateSavings = () => {
    if (selectedModules.size >= 3) {
      return calculateModulesTotal() * 0.25;
    }
    return 0;
  };

  const getModuleIcon = (moduleId: string) => {
    const module = moduleData.find(m => m.id === moduleId);
    return module?.icon || Package;
  };

  const hasFeature = (planId: string, featureName: string) => {
    const plan = bundledPlans.find(p => p.id === planId);
    if (!plan) return false;

    const feature = comparisonFeatures.find(f => f.name === featureName);
    if (!feature) return false;

    if (featureName === "API Access") {
      return planId === "enterprise";
    }
    if (featureName === "Priority Support") {
      return ["publishing-pro", "licensing-pro", "growth", "enterprise"].includes(planId);
    }
    if (featureName === "White Label") {
      return planId === "enterprise";
    }

    return feature.modules.some(moduleId => plan.modules.includes(moduleId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Ready to Get Started Section */}
      <div className="relative overflow-hidden">
        {/* Record Groove Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/lovable-uploads/ab53c16c-028b-497c-ac9f-feab103ef7de.png')`
        }} />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-jet-black/40" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Ready to Get Started?</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Only pay for what you use. Bundle and save.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              All modules include unlimited assets and users
            </p>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
            
            {/* Subscription Status */}
            {subscribed && subscription_tier && (
              <div className="max-w-md mx-auto">
                <Card className="bg-gradient-primary/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Active Subscription</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Currently subscribed to: <span className="font-medium text-foreground">{subscription_tier}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={openCustomerPortal}
                      disabled={loading}
                    >
                      Manage Subscription
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto mb-12">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Bundles
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Modular Pricing */}
          <TabsContent value="modules">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Pick Your Tools</h2>
              <p className="text-muted-foreground mb-2">Choose individual modules that fit your workflow</p>
              <Badge variant="secondary" className="bg-gradient-primary/10">
                Save 25% when bundling 3 or more modules
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {moduleData.map((module) => {
                const IconComponent = module.icon;
                const isSelected = selectedModules.has(module.id);
                
                return (
                  <Card 
                    key={module.id}
                    className={`transition-all duration-300 cursor-pointer hover:shadow-elegant ${
                      isSelected ? 'ring-2 ring-primary shadow-glow' : ''
                    }`}
                    onClick={() => handleModuleToggle(module.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-primary rounded-lg p-3">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${module.price}</div>
                          <div className="text-sm text-muted-foreground">/month</div>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className={`w-full transition-all ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-gradient-primary text-primary-foreground hover:opacity-90'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            // Redirect to auth page
                            window.location.href = '/auth';
                            return;
                          }
                          createCheckout('module', module.id);
                        }}
                        disabled={loading}
                      >
                        {!user ? 'Sign In to Subscribe' : (isSelected ? 'Added to Plan' : 'Subscribe')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected modules summary */}
            {selectedModules.size > 0 && (
              <Card className="bg-secondary/30 border-dashed max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Custom Plan ({selectedModules.size} modules)</span>
                    <div className="text-right">
                      {calculateSavings() > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          ${calculateModulesTotal()}
                        </div>
                      )}
                      <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        ${(calculateModulesTotal() - calculateSavings()).toFixed(0)}
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      {calculateSavings() > 0 && (
                        <Badge className="bg-gradient-primary text-primary-foreground">
                          Save ${calculateSavings().toFixed(0)}/mo
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-primary text-primary-foreground"
                      onClick={() => {
                        if (!user) {
                          window.location.href = '/auth';
                          return;
                        }
                        // Start free trial for custom selected modules
                        const modulesArray = Array.from(selectedModules);
                        createTrialCheckout('custom', 'custom', modulesArray);
                      }}
                      disabled={loading || selectedModules.size === 0}
                    >
                      {!user ? 'Sign In to Start Trial' : 'Start 14-Day Free Trial'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bundled Plans */}
          <TabsContent value="bundles">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Bundled Plans</h2>
              <p className="text-muted-foreground">Pre-configured packages optimized for different user types</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundledPlans.map((plan) => {
                const IconComponent = plan.icon;
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative transition-all duration-300 hover:shadow-elegant ${
                      plan.popular ? 'ring-2 ring-primary shadow-glow scale-105' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-primary rounded-lg p-3">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <Badge variant="secondary" className="bg-gradient-primary/10">
                          Save {plan.savings}%
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-4">Ideal for {plan.audience}</p>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.regularPrice}/mo
                        </div>
                        <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                          ${plan.price}
                          <span className="text-lg text-muted-foreground">/month</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Included modules */}
                      <div className="border-b pb-4">
                        <p className="text-sm font-medium mb-2">Includes:</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.modules.map((moduleId) => {
                            const ModuleIcon = getModuleIcon(moduleId);
                            const moduleName = moduleData.find(m => m.id === moduleId)?.name || moduleId;
                            return (
                              <div key={moduleId} className="flex items-center gap-1 text-xs bg-secondary/50 rounded px-2 py-1">
                                <ModuleIcon className="w-3 h-3" />
                                <span className="truncate">{moduleName.replace(' Module', '').replace(' Manager', '').replace(' Tool', '').replace(' Tracker', '')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                        onClick={() => {
                          if (!user) {
                            window.location.href = '/auth';
                            return;
                          }
                          createCheckout('bundle', plan.id);
                        }}
                        disabled={loading}
                      >
                        {!user ? 'Sign In to Subscribe' : 'Subscribe to Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>


          {/* Comparison Table */}
          <TabsContent value="compare">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
              <p className="text-muted-foreground">Find the perfect plan for your needs</p>
            </div>

            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Feature</TableHead>
                    {bundledPlans.map((plan) => (
                      <TableHead key={plan.id} className="text-center min-w-32">
                        <div className="space-y-1">
                          <div className="font-bold">{plan.name}</div>
                          <div className="text-lg font-bold text-primary">${plan.price}/mo</div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonFeatures.map((feature) => (
                    <TableRow key={feature.name}>
                      <TableCell className="font-medium">{feature.name}</TableCell>
                      {bundledPlans.map((plan) => (
                        <TableCell key={plan.id} className="text-center">
                          {hasFeature(plan.id, feature.name) ? (
                            <Check className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default PricingPage;