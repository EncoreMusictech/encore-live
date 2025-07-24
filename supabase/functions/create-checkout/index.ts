import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { productType, productId, billingInterval = 'month', trialModules } = await req.json();
    logStep("Request body parsed", { productType, productId, billingInterval, trialModules });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Get pricing based on product type and ID
    let lineItems = [];
    
    if (productType === 'bundle') {
      // Bundle products from the pricing page
      const bundlePricing = {
        'starter': { monthly: 79, annual: 790 },
        'essentials': { monthly: 149, annual: 1490 },
        'publishing-pro': { monthly: 299, annual: 2990 },
        'licensing-pro': { monthly: 349, annual: 3490 },
        'growth': { monthly: 449, annual: 4490 },
        'enterprise': { monthly: 849, annual: 8490 }
      };
      
      const pricing = bundlePricing[productId];
      if (!pricing) throw new Error(`Invalid bundle product ID: ${productId}`);
      
      const price = billingInterval === 'year' ? pricing.annual : pricing.monthly;
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: { 
            name: `${productId.charAt(0).toUpperCase() + productId.slice(1).replace('-', ' ')} Bundle`,
            description: `Music industry tools bundle - ${billingInterval}ly billing`
          },
          unit_amount: price * 100, // Convert to cents
          recurring: { interval: billingInterval }
        },
        quantity: 1,
      }];
    } else if (productType === 'module') {
      // Individual module pricing
      const modulePricing = {
        'royalties': { monthly: 199, annual: 1990 },
        'copyright': { monthly: 99, annual: 990 },
        'contracts': { monthly: 59, annual: 590 },
        'sync': { monthly: 149, annual: 1490 },
        'valuation': { monthly: 99, annual: 990 },
        'dashboard': { monthly: 149, annual: 1490 }
      };
      
      const pricing = modulePricing[productId];
      if (!pricing) throw new Error(`Invalid module product ID: ${productId}`);
      
      const price = billingInterval === 'year' ? pricing.annual : pricing.monthly;
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: { 
            name: `${productId.charAt(0).toUpperCase() + productId.slice(1)} Module`,
            description: `Music industry tool - ${billingInterval}ly billing`
          },
          unit_amount: price * 100, // Convert to cents
          recurring: { interval: billingInterval }
        },
        quantity: 1,
      }];
    } else {
      throw new Error(`Invalid product type: ${productType}`);
    }

    logStep("Line items prepared", { lineItems });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create session configuration with trial support
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        product_type: productType,
        product_id: productId,
        billing_interval: billingInterval
      }
    };

    // Add free trial if modules are specified (14 day trial)
    if (trialModules && Array.isArray(trialModules) && trialModules.length > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: 14,
        metadata: {
          trial_modules: JSON.stringify(trialModules)
        }
      };
      logStep("Adding 14-day free trial to subscription", { trialModules });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});