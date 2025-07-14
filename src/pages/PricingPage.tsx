import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Package, Zap, Crown, Building, Users, Plus, Infinity } from "lucide-react";

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  tier_level: number;
  included_modules: string[];
  max_valuations_per_month: number | null;
  max_deal_simulations_per_month: number | null;
  max_contracts_per_month: number | null;
  api_access_enabled: boolean;
  priority_support: boolean;
  custom_branding: boolean;
  features: string[];
  is_popular: boolean;
}

interface SubscriptionAddon {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  addon_type: string;
  features: string[];
}

interface ModuleProduct {
  id: string;
  module_id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
}

const PricingPage = () => {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);
  const [modules, setModules] = useState<ModuleProduct[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load subscription tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('tier_level');

      if (tiersError) throw tiersError;

      // Load add-ons
      const { data: addonsData, error: addonsError } = await supabase
        .from('subscription_addons')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (addonsError) throw addonsError;

      // Load individual modules (for a la carte)
      const { data: moduleData, error: moduleError } = await supabase
        .from('module_products')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (moduleError) throw moduleError;

      // Transform the data
      const transformedTiers = (tiersData || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        monthly_price: item.monthly_price,
        annual_price: item.annual_price || 0,
        tier_level: item.tier_level,
        included_modules: item.included_modules || [],
        max_valuations_per_month: item.max_valuations_per_month,
        max_deal_simulations_per_month: item.max_deal_simulations_per_month,
        max_contracts_per_month: item.max_contracts_per_month,
        api_access_enabled: item.api_access_enabled || false,
        priority_support: item.priority_support || false,
        custom_branding: item.custom_branding || false,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : [],
        is_popular: item.is_popular || false
      }));

      const transformedAddons = (addonsData || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        monthly_price: item.monthly_price,
        addon_type: item.addon_type,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));

      const transformedModules = (moduleData || []).map(item => ({
        id: item.id,
        module_id: item.module_id,
        name: item.name,
        description: item.description || '',
        monthly_price: item.monthly_price,
        annual_price: item.annual_price || 0,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));

      setTiers(transformedTiers);
      setAddons(transformedAddons);
      setModules(transformedModules);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddonToggle = (addonId: string) => {
    const newSelected = new Set(selectedAddons);
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId);
    } else {
      newSelected.add(addonId);
    }
    setSelectedAddons(newSelected);
  };

  const handleModuleToggle = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const calculateSelectedAddonsPrice = () => {
    const selectedAddonProducts = addons.filter(a => selectedAddons.has(a.id));
    return selectedAddonProducts.reduce((total, addon) => total + addon.monthly_price, 0);
  };

  const calculateSelectedModulesPrice = () => {
    const selectedModuleProducts = modules.filter(m => selectedModules.has(m.module_id));
    return selectedModuleProducts.reduce((total, module) => {
      return total + (isAnnual ? module.annual_price : module.monthly_price);
    }, 0);
  };

  const handlePurchase = (type: 'tier' | 'addon' | 'module', productId: string) => {
    toast({
      title: "Coming Soon",
      description: "Payment integration will be available soon!",
    });
  };

  const getTierIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return <Zap className="w-5 h-5" />;
      case 2: return <Star className="w-5 h-5" />;
      case 3: return <Crown className="w-5 h-5" />;
      case 4: return <Building className="w-5 h-5" />;
      case 5: return <Users className="w-5 h-5" />;
      case 6: return <Package className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const formatUsageLimit = (value: number | null) => {
    if (value === null) return <Infinity className="w-4 h-4 inline" />;
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Loading pricing information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with improved styling */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-music-purple/10 via-transparent to-music-blue/10 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Flexible <span className="bg-gradient-accent bg-clip-text text-transparent">Pricing</span> for Every Creator
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Choose from our comprehensive subscription tiers, add-ons, or build your own plan with individual modules.
            </p>
            
            {/* Enhanced Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8 p-1 bg-secondary/50 backdrop-blur-sm rounded-full w-fit mx-auto">
              <span className={`text-sm px-4 py-2 rounded-full transition-all ${!isAnnual ? 'text-foreground font-medium bg-background shadow-sm' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch 
                checked={isAnnual} 
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-music-purple"
              />
              <span className={`text-sm px-4 py-2 rounded-full transition-all ${isAnnual ? 'text-foreground font-medium bg-background shadow-sm' : 'text-muted-foreground'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="bg-gradient-accent text-accent-foreground ml-2 animate-slide-up">
                  Save up to 17%
                </Badge>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-music-purple" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-music-purple" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-music-purple" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <Tabs defaultValue="tiers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-12">
            <TabsTrigger value="tiers" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Subscription Tiers
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add-ons
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              À la Carte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {tiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`relative transition-all duration-300 hover:shadow-elegant ${
                    tier.is_popular ? 'ring-2 ring-music-purple shadow-glow scale-105' : ''
                  } ${tier.tier_level >= 5 ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20' : ''}`}
                >
                  {tier.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-accent text-accent-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getTierIcon(tier.tier_level)}
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {tier.monthly_price === 0 ? 'Free' : `$${isAnnual ? tier.annual_price : tier.monthly_price}`}
                      {tier.monthly_price > 0 && (
                        <span className="text-lg text-muted-foreground">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Usage Limits */}
                    {(tier.max_valuations_per_month || tier.max_deal_simulations_per_month || tier.max_contracts_per_month) && (
                      <div className="border-b pb-4 space-y-2">
                        {tier.max_valuations_per_month && (
                          <div className="text-sm flex justify-between">
                            <span>Valuations/month:</span>
                            <span className="font-medium">{formatUsageLimit(tier.max_valuations_per_month)}</span>
                          </div>
                        )}
                        {tier.max_deal_simulations_per_month && (
                          <div className="text-sm flex justify-between">
                            <span>Deal simulations/month:</span>
                            <span className="font-medium">{formatUsageLimit(tier.max_deal_simulations_per_month)}</span>
                          </div>
                        )}
                        {tier.max_contracts_per_month && (
                          <div className="text-sm flex justify-between">
                            <span>Contracts/month:</span>
                            <span className="font-medium">{formatUsageLimit(tier.max_contracts_per_month)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <Check className="h-4 w-4 text-music-purple flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={() => handlePurchase('tier', tier.id)}
                    >
                      {tier.monthly_price === 0 ? 'Get Started Free' : `Choose ${tier.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="addons">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Boost Your Plan</h2>
                <p className="text-muted-foreground">Add extra features and increased limits to any subscription tier.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {addons.map((addon) => (
                  <Card 
                    key={addon.id}
                    className={`transition-all duration-300 cursor-pointer ${
                      selectedAddons.has(addon.id) 
                        ? 'ring-2 ring-music-purple shadow-glow' 
                        : 'hover:shadow-elegant'
                    }`}
                    onClick={() => handleAddonToggle(addon.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{addon.name}</CardTitle>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            ${addon.monthly_price}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /month
                          </div>
                        </div>
                      </div>
                      <CardDescription>{addon.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {addon.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Check className="h-3 w-3 text-music-purple flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected add-ons summary */}
              {selectedAddons.size > 0 && (
                <Card className="bg-secondary/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Selected Add-ons ({selectedAddons.size})</span>
                      <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        ${calculateSelectedAddonsPrice().toFixed(2)}
                        <span className="text-sm text-muted-foreground">/month</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.from(selectedAddons).map(addonId => {
                        const addon = addons.find(a => a.id === addonId);
                        return addon ? (
                          <Badge key={addonId} variant="secondary">
                            {addon.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground"
                      onClick={() => handlePurchase('addon', Array.from(selectedAddons).join(','))}
                    >
                      Add Selected Add-ons
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Build Your Own Plan</h2>
                <p className="text-muted-foreground">Pick and choose individual modules to create a custom solution.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {modules.map((module) => (
                  <Card 
                    key={module.id}
                    className={`transition-all duration-300 cursor-pointer ${
                      selectedModules.has(module.module_id) 
                        ? 'ring-2 ring-music-purple shadow-glow' 
                        : 'hover:shadow-elegant'
                    }`}
                    onClick={() => handleModuleToggle(module.module_id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            ${isAnnual ? module.annual_price : module.monthly_price}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{isAnnual ? 'year' : 'month'}
                          </div>
                        </div>
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {module.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Check className="h-3 w-3 text-music-purple flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                      {module.features.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{module.features.length - 3} more features
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected modules summary */}
              {selectedModules.size > 0 && (
                <Card className="bg-secondary/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Selected Modules ({selectedModules.size})</span>
                      <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        ${calculateSelectedModulesPrice().toFixed(2)}
                        <span className="text-sm text-muted-foreground">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.from(selectedModules).map(moduleId => {
                        const module = modules.find(m => m.module_id === moduleId);
                        return module ? (
                          <Badge key={moduleId} variant="secondary">
                            {module.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground"
                      onClick={() => handlePurchase('module', Array.from(selectedModules).join(','))}
                    >
                      Purchase Selected Modules
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our pricing</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch between plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my usage limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We'll notify you when you're approaching your limits. You can either upgrade your plan or purchase add-ons to increase your limits for the current month.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Absolutely. You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via bank transfer.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-16 bg-gradient-to-r from-music-purple/10 to-music-blue/10 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of music creators who trust ENCORE to manage their rights and maximize their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground px-8">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;