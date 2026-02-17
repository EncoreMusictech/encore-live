import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { welcomeEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, temp_password, client_name, role } = await req.json();
    if (!email || !temp_password) throw new Error("Missing email or temp_password");

    const html = welcomeEmail({
      email,
      tempPassword: temp_password,
      clientName: client_name || "ENCORE",
      role: role || "user",
    });

    const result = await sendGmail({
      to: [email],
      subject: `Welcome to ${client_name || "ENCORE"} — Your Account is Ready`,
      html,
      from: "ENCORE",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-welcome-email error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
