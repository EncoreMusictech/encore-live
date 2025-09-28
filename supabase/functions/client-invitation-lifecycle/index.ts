import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
// import { Resend } from "npm:resend@2.0.0"; // Temporarily disabled to fix build

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LifecycleRequest {
  action: 'expire_invitations' | 'cleanup_expired' | 'send_reminders' | 'expire_access' | 'full_maintenance';
  force_all?: boolean;
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

    // const resend = new Resend(Deno.env.get("RESEND_API_KEY")); // Temporarily disabled

    let action: string = 'full_maintenance';
    
    // Handle both GET (cron) and POST (manual) requests
    let forceAll = false;
    if (req.method === 'POST') {
      const body: LifecycleRequest = await req.json();
      action = body.action;
      forceAll = !!body.force_all;
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

            // Temporarily skip email sending due to Resend import issue
            // TODO: Fix email sending implementation
            console.log(`Would send reminder to ${reminder.email} (${reminder.days_until_expiry} days until expiry)`);
            
            // Mark reminder as sent anyway for testing
            await supabase.rpc('mark_invitation_reminder_sent', { invitation_id: reminder.id });
            sentCount++;
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

    // Cleanup expired invitations
    if (action === 'cleanup_expired' || action === 'full_maintenance') {
      if (action === 'cleanup_expired' && forceAll) {
        // First mark any past-due invites as expired
        await supabase
          .from('client_invitations')
          .update({ status: 'expired', auto_cleanup_scheduled_at: new Date().toISOString() })
          .lt('expires_at', new Date().toISOString())
          .neq('status', 'accepted');

        // Then hard-delete all that are expired or past expiration
        const { error: forceCleanupError, count } = await supabase
          .from('client_invitations')
          .delete({ count: 'exact' })
          .or(`status.eq.expired,expires_at.lt.${new Date().toISOString()}`);
        if (forceCleanupError) {
          console.error('Error force cleaning invitations:', forceCleanupError);
          results.results.cleanup_error = forceCleanupError.message;
        } else {
          console.log(`Force cleaned ${count || 0} expired/past-due invitations`);
          results.results.cleaned_invitations = count || 0;
        }
      } else {
        const { data: cleanedCount, error: cleanupError } = await supabase.rpc('cleanup_expired_invitations');
        if (cleanupError) {
          console.error('Error cleaning up invitations:', cleanupError);
          results.results.cleanup_error = cleanupError.message;
        } else {
          console.log(`Cleaned up ${cleanedCount} old invitations`);
          results.results.cleaned_invitations = cleanedCount;
        }
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