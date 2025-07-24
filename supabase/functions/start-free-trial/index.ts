import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[START-FREE-TRIAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { trialType, trialIdentifier, trialModules } = await req.json();
    logStep("Request body parsed", { trialType, trialIdentifier, trialModules });

    // Validate input
    if (!trialType || !trialIdentifier || !trialModules || !Array.isArray(trialModules)) {
      throw new Error("Invalid trial parameters");
    }

    // Start the free trial using the database function
    const { data: trialData, error: trialError } = await supabaseClient.rpc('start_free_trial', {
      p_user_id: user.id,
      p_trial_type: trialType,
      p_trial_identifier: trialIdentifier,
      p_trial_modules: trialModules
    });

    if (trialError) {
      logStep("Error starting trial", { error: trialError.message });
      throw new Error(trialError.message);
    }

    logStep("Free trial started successfully", { trialId: trialData });

    // Fetch the trial details to return
    const { data: trial, error: fetchError } = await supabaseClient
      .from('user_free_trials')
      .select('*')
      .eq('id', trialData)
      .single();

    if (fetchError) {
      logStep("Error fetching trial details", { error: fetchError.message });
      throw new Error("Trial started but could not fetch details");
    }

    return new Response(JSON.stringify({
      success: true,
      trial: trial,
      message: "14-day free trial started successfully!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in start-free-trial", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});