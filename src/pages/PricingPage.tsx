import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
    name: "Royalties Module",
    icon: Music,
    price: 199,
    annualPrice: 2388,
    description: "Royalty splits, recoupment, statements, and payouts",
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
    name: "Copyright Module",
    icon: Copyright,
    price: 99,
    annualPrice: 1188,
    description: "Metadata registration, DDEX/CWR export, PRO status tracking",
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
    name: "Contract Manager",
    icon: FileText,
    price: 59,
    annualPrice: 708,
    description: "Deal templates, rights ownership, contract workflow",
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
    annualPrice: 1788,
    description: "Sync requests, license terms, deal approvals",
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
    name: "Catalog Valuation Tool",
    icon: TrendingUp,
    price: 99,
    annualPrice: 1188,
    description: "Revenue forecasting, growth modeling, terminal value estimates",
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
    name: "Client Dashboard",
    icon: Users,
    price: 149,
    annualPrice: 1788,
    description: "Artist/manager portal for real-time visibility & statements",
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
    annualPrice: 799,
    modules: ["copyright", "contracts"],
    features: [
      "Metadata management (no CWR/DDEX export)",
      "Writer/publisher splits",
      "Basic contract templates (no uploads)",
      "Auto-tag by deal type",
      "Email support"
    ],
    icon: Sparkles
  },
  {
    id: "essentials",
    name: "Essentials",
    audience: "Small rights owners", 
    price: 149,
    annualPrice: 1499,
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
    annualPrice: 2999,
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
    audience: "Sync teams, labels",
    price: 349,
    annualPrice: 3499,
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
    audience: "Scaling publishers",
    price: 399,
    annualPrice: 4499,
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
    audience: "Large catalogs/admins", 
    price: 0,
    annualPrice: 0,
    custom: true,
    modules: ["royalties", "copyright", "contracts", "sync", "valuation", "dashboard"],
    features: [
      "All modules included",
      "White-label branding & custom theming",
      "Custom integrations & SLAs",
      "Complete workflow automation",
      "Multi-tier client portal access", 
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "24/7 priority support"
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
  { name: "24/7 Support", modules: [] },
  
];

const PricingPage = () => {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const { user } = useAuth();
  const { subscribed, subscription_tier, loading, createCheckout, openCustomerPortal } = useSubscription();
  const { createTrialCheckout } = useFreeTrial();
  const { isAdmin } = useUserRoles();

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
  return total + (module ? (billingInterval === 'month' ? module.price : module.annualPrice) : 0);
}, 0);
  };

  const calculateSavings = () => 0;

  // Upsell mapping based on specific a la carte selections (order-insensitive)
  const getUpsellPlanId = (): string | null => {
    const key = Array.from(selectedModules).sort().join('+');
    const mapping: Record<string, string> = {
      'contracts+copyright': 'starter',
      'contracts+copyright+valuation': 'essentials',
      'contracts+copyright+royalties': 'publishing-pro',
      'dashboard+royalties+sync': 'licensing-pro',
      'contracts+copyright+royalties+valuation': 'growth',
    };
    return mapping[key] || null;
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
    if (featureName === "24/7 Support") {
      return true;
    }

    return feature.modules.some(moduleId => plan.modules.includes(moduleId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Ready to Get Started Section */}
      <div className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Flexible <span className="bg-gradient-primary bg-clip-text text-transparent">Pricing</span> for Every Creator</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Only pay for what you use. Bundle and save.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              All modules include unlimited assets and users
            </p>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mb-8">
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
            
            
            
            {/* Subscription Status - Show for subscribed users or admins */}
            {(subscribed && subscription_tier) || (isAdmin && !subscribed) ? (
              <div className="max-w-3xl mx-auto">
                <Card className="bg-gradient-primary/10 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-6 h-6 text-primary" />
                      <CardTitle>
                        {subscribed ? 'Your Active Subscription' : 'Subscription Management (Admin Preview)'}
                      </CardTitle>
                    </div>
                    {!subscribed && isAdmin && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        This is a preview of what paid subscribers see
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Plan */}
                    <div className="text-center">
                      <Badge className="mb-2 bg-primary text-primary-foreground px-4 py-1 text-base">
                        {subscription_tier || 'Pro Plan (Demo)'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {subscribed ? 'Your current plan' : 'Example subscription tier'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={subscribed ? openCustomerPortal : undefined}
                        disabled={!subscribed || loading}
                        className="bg-gradient-primary text-primary-foreground"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Manage Subscription
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={subscribed ? openCustomerPortal : undefined}
                        disabled={!subscribed || loading}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        View Billing & Cancel
                      </Button>
                    </div>

                    {/* Upgrade Suggestion */}
                    <div className="border-t pt-4">
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">Want to unlock more features?</p>
                        <p className="text-xs text-muted-foreground">
                          Explore our bundles below to access additional modules and save up to 20%
                        </p>
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground text-center">
                        Click "Manage Subscription" to upgrade your plan or "View Billing & Cancel" to access your billing portal where you can update payment methods or cancel your subscription.
                      </p>
                    </div>

                    {!subscribed && isAdmin && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-xs text-center text-primary">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Admin Note: Buttons are disabled in preview mode. Actual subscribers can click them to access Stripe's customer portal.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
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

{/* Billing Interval Toggle */}
<div className="flex items-center justify-center mb-8">
  <div className="flex items-center gap-3 rounded-full bg-secondary/30 px-4 py-2">
    <span className={billingInterval === 'month' ? 'text-foreground text-sm font-medium' : 'text-muted-foreground text-sm'}>
      Monthly
    </span>
    <Switch
      checked={billingInterval === 'year'}
      onCheckedChange={(checked) => setBillingInterval(checked ? 'year' : 'month')}
      aria-label="Toggle billing interval"
    />
    <span className={billingInterval === 'year' ? 'text-foreground text-sm font-medium' : 'text-muted-foreground text-sm'}>
      Annual
    </span>
  </div>
</div>

{/* Modular Pricing */}
          <TabsContent value="modules">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Pick Your Tools</h2>
              <p className="text-muted-foreground mb-2">Choose individual modules that fit your workflow</p>
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
  <div className="text-2xl font-bold">${billingInterval === 'month' ? module.price : module.annualPrice}</div>
  <div className="text-sm text-muted-foreground">/{billingInterval === 'month' ? 'month' : 'year'}</div>
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
                            // Redirect to trial signup page with module info
                            const params = new URLSearchParams({
                              type: 'module',
                              identifier: module.id,
                              modules: module.id,
                              billing: billingInterval,
                            });
                            window.location.href = `/trial-signup?${params.toString()}`;
                            return;
                          }
                          // Restrict Client Dashboard purchase for new subscribers
                          if (module.id === 'dashboard' && !subscribed) {
                            return; // blocked; show note below
                          }
                          createCheckout('module', module.id, billingInterval);
                        }}
                        disabled={loading || (module.id === 'dashboard' && !subscribed)}
                      >
                      {!user
                          ? 'Sign Up to Subscribe'
                          : (module.id === 'dashboard' && !subscribed)
                            ? 'Requires another module'
                            : (isSelected ? 'Added to Plan' : 'Subscribe')}
                      </Button>
                      {(module.id === 'dashboard' && !subscribed) && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          New subscribers must purchase another module before adding Client Dashboard. Consider a bundle.
                        </p>
                      )}
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
                      <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        ${calculateModulesTotal().toFixed(0)}
                        <span className="text-sm text-muted-foreground">/{billingInterval === 'month' ? 'month' : 'year'}</span>
                      </div>
                      {(() => {
                        const upsellId = getUpsellPlanId();
                        if (!upsellId) return null;
                        const plan = bundledPlans.find(p => p.id === upsellId);
                        if (!plan) return null;
                        const regular = calculateModulesTotal();
                        const price = billingInterval === 'month' ? plan.price : plan.annualPrice;
                        const savingsPercent = Math.max(0, Math.round(((regular - price) / (regular || 1)) * 100));
                        return (
                          <div className="mt-2 text-left">
                            <Badge variant="secondary" className="bg-gradient-primary/10">
                              Save {savingsPercent}% with {plan.name}
                            </Badge>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!user) {
                                    const params = new URLSearchParams({
                                      type: 'bundle',
                                      identifier: plan.id,
                                      modules: plan.modules.join(','),
                                      billing: billingInterval,
                                    });
                                    window.location.href = `/trial-signup?${params.toString()}`;
                                    return;
                                  }
                                  createCheckout('bundle', plan.id, billingInterval);
                                }}
                                disabled={loading}
                              >
                                Switch to {plan.name} — ${price.toLocaleString()}/{billingInterval === 'month' ? 'mo' : 'yr'}
                              </Button>
                            </div>
                            {plan.id === 'starter' && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Note: Starter Creator uses lite modules — no CWR/DDEX export and no contract uploads.
                              </p>
                            )}
                          </div>
                        );
                      })()}
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
                          // Redirect to trial signup with module info
                          const modulesArray = Array.from(selectedModules);
                          const params = new URLSearchParams({
                            type: 'custom',
                            identifier: 'custom',
                            modules: modulesArray.join(','),
                            billing: billingInterval,
                          });
                          window.location.href = `/trial-signup?${params.toString()}`;
                          return;
                        }
                        // Start free trial for custom selected modules
                        const modulesArray = Array.from(selectedModules);
                        createTrialCheckout('custom', 'custom', modulesArray, billingInterval);
                      }}
                      disabled={
                        loading ||
                        selectedModules.size === 0 ||
                        (!subscribed && selectedModules.size === 1 && selectedModules.has('dashboard'))
                      }
                    >
                      {!user ? 'Start Free Trial' : 'Start 14-Day Free Trial'}
                    </Button>
                  </div>
                  {(!subscribed && selectedModules.size === 1 && selectedModules.has('dashboard')) && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Client Dashboard requires at least one other module for new subscribers.
                    </p>
                  )}
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
                const isCustom = (plan as any).custom || plan.id === 'enterprise';
                const regularMonthly = plan.modules.reduce((sum, moduleId) => {
                  const mod = moduleData.find((m) => m.id === moduleId);
                  return sum + (mod?.price || 0);
                }, 0);
                const regularAnnual = plan.modules.reduce((sum, moduleId) => {
                  const mod = moduleData.find((m) => m.id === moduleId);
                  return sum + (mod?.annualPrice || 0);
                }, 0);
                const selectedPrice = isCustom ? null : (billingInterval === 'month' ? plan.price : plan.annualPrice);
                const selectedRegular = billingInterval === 'month' ? regularMonthly : regularAnnual;
                const savingsPercent = isCustom ? 0 : Math.max(
                  0,
                  Math.round(((selectedRegular - ((selectedPrice ?? 0))) / (selectedRegular || 1)) * 100)
                );
                const annualSavingsVsModules = isCustom ? 0 : Math.max(0, regularAnnual - ((plan.annualPrice as any) || (plan.price as any) * 12));
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative transition-all duration-300 hover:shadow-elegant ${
                      (plan as any).popular ? 'ring-2 ring-primary shadow-glow scale-105' : ''
                    }`}
                  >

                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-gradient-primary rounded-lg p-3">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>
                        {isCustom ? (
                          <Badge variant="secondary" className="bg-gradient-primary/10">Custom Pricing</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gradient-primary/10">Save {savingsPercent}%</Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-4">Ideal for {plan.audience}</p>
                      
                      <div className="text-center">
                        {isCustom ? (
                          <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Custom pricing
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-muted-foreground line-through">
                              ${selectedRegular.toLocaleString()}/{billingInterval === 'month' ? 'mo' : 'yr'}
                            </div>
                            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                              ${selectedPrice!.toLocaleString()}
                              <span className="text-lg text-muted-foreground">/{billingInterval === 'month' ? 'month' : 'year'}</span>
                            </div>
                            {billingInterval === 'month' && (
                              <div className="text-xs text-muted-foreground mt-1">or ${plan.annualPrice}/yr</div>
                            )}
                            {billingInterval === 'year' && annualSavingsVsModules > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">Save ${annualSavingsVsModules.toLocaleString()}/yr vs modules</div>
                            )}
                          </>
                        )}
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
                            const baseLabel = moduleName.replace(' Module', '').replace(' Manager', '').replace(' Tool', '').replace(' Tracker', '');
                            const label = plan.id === 'starter' && (moduleId === 'copyright' || moduleId === 'contracts')
                              ? `${baseLabel} (Lite)`
                              : baseLabel;
                            return (
                              <div key={moduleId} className="flex items-center gap-1 text-xs bg-secondary/50 rounded px-2 py-1">
                                <ModuleIcon className="w-3 h-3" />
                                <span className="truncate">{label}</span>
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
                          if ((plan as any).custom || plan.id === 'enterprise') {
                            window.location.href = '/contact';
                            return;
                          }
                          if (!user) {
                            const params = new URLSearchParams({
                              type: 'bundle',
                              identifier: plan.id,
                              modules: plan.modules.join(','),
                              billing: billingInterval,
                            });
                            window.location.href = `/trial-signup?${params.toString()}`;
                            return;
                          }
                          createCheckout('bundle', plan.id, billingInterval);
                        }}
                        disabled={loading}
                      >
                        {(plan as any).custom || plan.id === 'enterprise' ? 'Contact Sales' : (!user ? 'Start Free Trial' : 'Subscribe to Plan')}
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
                          <div className="text-lg font-bold text-primary">{(plan as any).custom || plan.id === 'enterprise' ? 'Custom' : `$${(billingInterval === 'month' ? plan.price : plan.annualPrice)}/${billingInterval === 'month' ? 'mo' : 'yr'}`}</div>
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