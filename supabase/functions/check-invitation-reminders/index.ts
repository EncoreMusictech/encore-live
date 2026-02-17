import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { sendGmail } from "../_shared/gmail.ts";
import { invitationReminderEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Use the existing DB function to find invitations needing reminders
    const { data: invitations, error } = await supabase.rpc('get_invitations_needing_reminders');

    if (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }

    let totalSent = 0;

    for (const inv of invitations || []) {
      const isUrgent = inv.days_until_expiry <= 1;

      const html = invitationReminderEmail({
        daysUntilExpiry: inv.days_until_expiry,
        expiresAt: inv.expires_at,
        isUrgent,
      });

      try {
        await sendGmail({
          to: [inv.email],
          subject: isUrgent
            ? "⚠️ Your ENCORE invitation expires tomorrow!"
            : "Reminder: Your ENCORE invitation expires soon",
          html,
          from: "ENCORE",
        });

        // Mark reminder as sent
        await supabase.rpc('mark_invitation_reminder_sent', { invitation_id: inv.id });
        totalSent++;
      } catch (emailErr) {
        console.error(`Failed to send reminder to ${inv.email}:`, emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: totalSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("check-invitation-reminders error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
