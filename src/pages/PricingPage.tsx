import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Package, Zap } from "lucide-react";

interface ModuleProduct {
  id: string;
  module_id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
}

interface BundleProduct {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  included_modules: string[];
  discount_percentage: number;
  is_popular: boolean;
  features: string[];
}

const PricingPage = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState<ModuleProduct[]>([]);
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load module products
      const { data: moduleData, error: moduleError } = await supabase
        .from('module_products')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (moduleError) throw moduleError;

      // Load bundle products
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundle_products')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (bundleError) throw bundleError;

      // Transform the data to match our interfaces
      const transformedModules = (moduleData || []).map(item => ({
        id: item.id,
        module_id: item.module_id,
        name: item.name,
        description: item.description || '',
        monthly_price: item.monthly_price,
        annual_price: item.annual_price || 0,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));
      
      const transformedBundles = (bundleData || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        monthly_price: item.monthly_price,
        annual_price: item.annual_price || 0,
        included_modules: item.included_modules || [],
        discount_percentage: item.discount_percentage || 0,
        is_popular: item.is_popular || false,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));

      setModules(transformedModules);
      setBundles(transformedBundles);
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

  const handleModuleToggle = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const calculateSelectedModulesPrice = () => {
    const selectedModuleProducts = modules.filter(m => selectedModules.has(m.module_id));
    return selectedModuleProducts.reduce((total, module) => {
      return total + (isAnnual ? module.annual_price : module.monthly_price);
    }, 0);
  };

  const handlePurchase = (type: 'module' | 'bundle', productId: string) => {
    toast({
      title: "Coming Soon",
      description: "Payment integration will be available soon!",
    });
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
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="bg-gradient-accent bg-clip-text text-transparent">Perfect Plan</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Buy individual modules or save with our bundles. Switch between monthly and annual billing.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-music-purple"
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="bundles" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Bundles
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Individual Modules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bundles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {bundles.map((bundle) => (
                <Card 
                  key={bundle.id}
                  className={`relative transition-all duration-300 hover:shadow-elegant ${
                    bundle.is_popular ? 'ring-2 ring-music-purple shadow-glow scale-105' : ''
                  }`}
                >
                  {bundle.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-accent text-accent-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                    <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      ${isAnnual ? bundle.annual_price : bundle.monthly_price}
                      <span className="text-lg text-muted-foreground">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    </div>
                    {isAnnual && bundle.discount_percentage > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Save {bundle.discount_percentage}% annually
                      </div>
                    )}
                    <CardDescription>{bundle.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {bundle.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <Check className="h-4 w-4 text-music-purple flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={() => handlePurchase('bundle', bundle.id)}
                    >
                      {bundle.monthly_price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="individual">
            <div className="max-w-6xl mx-auto">
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
                      onClick={() => {
                        // For now, just show coming soon
                        toast({
                          title: "Coming Soon",
                          description: "Custom module purchases will be available soon!",
                        });
                      }}
                    >
                      Purchase Selected Modules
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PricingPage;