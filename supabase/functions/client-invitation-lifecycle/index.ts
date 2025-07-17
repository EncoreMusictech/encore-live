import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LifecycleRequest {
  action: 'expire_invitations' | 'cleanup_expired' | 'send_reminders' | 'expire_access' | 'full_maintenance';
}

interface InvitationReminder {
  id: string;
  email: string;
  subscriber_user_id: string;
  expires_at: string;
  reminder_count: number;
  days_until_expiry: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    let action: string = 'full_maintenance';
    
    // Handle both GET (cron) and POST (manual) requests
    if (req.method === 'POST') {
      const body: LifecycleRequest = await req.json();
      action = body.action;
    }

    console.log(`Starting client invitation lifecycle action: ${action}`);

    const results: any = {
      action,
      timestamp: new Date().toISOString(),
      results: {}
    };

    // Expire old invitations
    if (action === 'expire_invitations' || action === 'full_maintenance') {
      const { data: expiredCount, error: expireError } = await supabase.rpc('expire_old_invitations');
      if (expireError) {
        console.error('Error expiring invitations:', expireError);
        results.results.expire_error = expireError.message;
      } else {
        console.log(`Expired ${expiredCount} invitations`);
        results.results.expired_invitations = expiredCount;
      }
    }

    // Send reminder emails
    if (action === 'send_reminders' || action === 'full_maintenance') {
      const { data: reminders, error: reminderError } = await supabase.rpc('get_invitations_needing_reminders');
      
      if (reminderError) {
        console.error('Error getting reminders:', reminderError);
        results.results.reminder_error = reminderError.message;
      } else if (reminders && reminders.length > 0) {
        console.log(`Found ${reminders.length} invitations needing reminders`);
        
        let sentCount = 0;
        let errorCount = 0;

        for (const reminder of reminders as InvitationReminder[]) {
          try {
            const isUrgent = reminder.days_until_expiry <= 1;
            const subject = isUrgent 
              ? "⚠️ Your client portal invitation expires tomorrow!"
              : "📋 Reminder: Your client portal invitation expires soon";

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${isUrgent ? '#dc2626' : '#2563eb'};">
                  ${isUrgent ? 'Urgent: ' : ''}Client Portal Invitation Reminder
                </h2>
                <p>Hello,</p>
                <p>This is a ${isUrgent ? 'final' : 'friendly'} reminder that your client portal invitation will expire in <strong>${reminder.days_until_expiry} day${reminder.days_until_expiry !== 1 ? 's' : ''}</strong>.</p>
                <p><strong>Expiration Date:</strong> ${new Date(reminder.expires_at).toLocaleDateString()}</p>
                <p>To accept your invitation and gain access to the client portal, please click the link in your original invitation email or contact your administrator.</p>
                ${isUrgent ? '<p style="color: #dc2626; font-weight: bold;">⚠️ After expiration, you will need to request a new invitation.</p>' : ''}
                <p>Best regards,<br>The Team</p>
              </div>
            `;

            const emailResponse = await resend.emails.send({
              from: "Client Portal <no-reply@encoremusic.tech>",
              to: [reminder.email],
              subject,
              html: emailHtml,
            });

            if (emailResponse.error) {
              console.error(`Failed to send reminder to ${reminder.email}:`, emailResponse.error);
              errorCount++;
            } else {
              // Mark reminder as sent
              await supabase.rpc('mark_invitation_reminder_sent', { invitation_id: reminder.id });
              sentCount++;
              console.log(`Sent reminder ${reminder.reminder_count + 1} to ${reminder.email}`);
            }
          } catch (error) {
            console.error(`Error sending reminder to ${reminder.email}:`, error);
            errorCount++;
          }
        }

        results.results.reminders_sent = sentCount;
        results.results.reminder_errors = errorCount;
      } else {
        results.results.reminders_sent = 0;
      }
    }

    // Expire client portal access
    if (action === 'expire_access' || action === 'full_maintenance') {
      const { data: expiredAccessCount, error: accessError } = await supabase.rpc('expire_client_access');
      if (accessError) {
        console.error('Error expiring client access:', accessError);
        results.results.access_expire_error = accessError.message;
      } else {
        console.log(`Expired ${expiredAccessCount} client access records`);
        results.results.expired_access = expiredAccessCount;
      }
    }

    // Cleanup old expired invitations
    if (action === 'cleanup_expired' || action === 'full_maintenance') {
      const { data: cleanedCount, error: cleanupError } = await supabase.rpc('cleanup_expired_invitations');
      if (cleanupError) {
        console.error('Error cleaning up invitations:', cleanupError);
        results.results.cleanup_error = cleanupError.message;
      } else {
        console.log(`Cleaned up ${cleanedCount} old invitations`);
        results.results.cleaned_invitations = cleanedCount;
      }
    }

    console.log('Client invitation lifecycle maintenance completed:', results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in client-invitation-lifecycle function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        action: 'unknown',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);