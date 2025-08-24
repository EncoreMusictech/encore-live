import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get current user from request
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Only allow ENCORE admin to seed data
    if (user.email !== 'info@encoremusic.tech') {
      throw new Error('Access denied - ENCORE admin required');
    }

    console.log('Seeding operations data for ENCORE admin...');

    // 1. Create operations team members (if not exist)
    const teamMembers = [
      {
        user_id: user.id,
        team_member_name: 'ENCORE Admin',
        department: 'Administration',
        role_title: 'System Administrator',
        permissions: { manage_team: true, view_analytics: true, manage_support: true },
        hire_date: '2024-01-01'
      },
      {
        team_member_name: 'Sarah Johnson',
        department: 'Customer Success',
        role_title: 'Customer Success Manager',
        permissions: { view_analytics: true, manage_support: true },
        hire_date: '2024-02-15'
      },
      {
        team_member_name: 'Mike Chen',
        department: 'Technical Support',
        role_title: 'Senior Support Engineer',
        permissions: { manage_support: true },
        hire_date: '2024-03-01'
      }
    ];

    for (const member of teamMembers) {
      const { error } = await supabaseClient
        .from('operations_team_members')
        .upsert(member, { 
          onConflict: 'team_member_name', 
          ignoreDuplicates: true 
        });
      
      if (error) {
        console.error('Error creating team member:', error);
      }
    }

    // 2. Get all users for customer health metrics
    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      // Create sample customer health metrics for existing users
      const healthMetrics = users.users.slice(0, 10).map((customer, index) => ({
        customer_user_id: customer.id,
        health_score: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        feature_adoption_rate: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
        login_frequency: Math.floor(Math.random() * 20) + 5, // 5 to 25
        last_activity_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        modules_used: ['catalog-valuation', 'contract-management', 'royalties-processing'].slice(0, Math.floor(Math.random() * 3) + 1),
        contracts_created: Math.floor(Math.random() * 15) + 1,
        royalties_processed: Math.random() * 50000,
        support_tickets_count: Math.floor(Math.random() * 5),
        subscription_status: ['active', 'trial', 'cancelled'][Math.floor(Math.random() * 3)],
        days_since_signup: Math.floor(Math.random() * 365) + 30,
        risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
      }));

      for (const metric of healthMetrics) {
        const { error } = await supabaseClient
          .from('customer_health_metrics')
          .upsert(metric, { 
            onConflict: 'customer_user_id', 
            ignoreDuplicates: true 
          });
        
        if (error) {
          console.error('Error creating health metric:', error);
        }
      }
    }

    // 3. Create sample support tickets
    const { data: teamMembersList } = await supabaseClient
      .from('operations_team_members')
      .select('id')
      .limit(3);

    const supportCategories = ['Technical', 'Billing', 'Feature Request', 'Bug Report', 'General'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];

    if (teamMembersList && teamMembersList.length > 0) {
      const sampleTickets = Array.from({ length: 15 }, (_, index) => {
        const createdDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isResolved = status === 'resolved' || status === 'closed';
        
        return {
          customer_user_id: users?.users[Math.floor(Math.random() * Math.min(users.users.length, 10))]?.id,
          assigned_team_member_id: teamMembersList[Math.floor(Math.random() * teamMembersList.length)].id,
          ticket_subject: `${supportCategories[Math.floor(Math.random() * supportCategories.length)]} Issue #${1000 + index}`,
          ticket_category: supportCategories[Math.floor(Math.random() * supportCategories.length)],
          priority_level: priorities[Math.floor(Math.random() * priorities.length)],
          status: status,
          resolution_time_hours: isResolved ? Math.random() * 48 + 2 : null,
          first_response_time_hours: Math.random() * 4 + 0.5,
          customer_satisfaction_score: isResolved ? Math.floor(Math.random() * 2) + 4 : null, // 4-5 stars
          tags: ['support', supportCategories[Math.floor(Math.random() * supportCategories.length)].toLowerCase()],
          created_at: createdDate.toISOString(),
          resolved_at: isResolved ? new Date(createdDate.getTime() + (Math.random() * 48 + 2) * 60 * 60 * 1000).toISOString() : null
        };
      });

      for (const ticket of sampleTickets) {
        const { error } = await supabaseClient
          .from('support_ticket_analytics')
          .insert(ticket);
        
        if (error) {
          console.error('Error creating support ticket:', error);
        }
      }
    }

    // 4. Create sample revenue events
    const eventTypes = ['signup', 'upgrade', 'downgrade', 'churn', 'payment_success', 'payment_failed'];
    const plans = ['starter', 'professional', 'enterprise'];
    
    const revenueEvents = Array.from({ length: 30 }, (_, index) => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      let revenueAmount = 0;
      
      if (eventType === 'signup' || eventType === 'upgrade' || eventType === 'payment_success') {
        revenueAmount = [29, 99, 299][Math.floor(Math.random() * 3)]; // Plan prices
      }
      
      return {
        customer_user_id: users?.users[Math.floor(Math.random() * Math.min(users?.users.length || 1, 10))]?.id,
        event_type: eventType,
        revenue_amount: revenueAmount,
        previous_plan: eventType === 'upgrade' || eventType === 'downgrade' ? plans[Math.floor(Math.random() * plans.length)] : null,
        new_plan: eventType === 'signup' || eventType === 'upgrade' ? plans[Math.floor(Math.random() * plans.length)] : null,
        billing_cycle: 'monthly',
        mrr_change: eventType === 'signup' || eventType === 'upgrade' ? revenueAmount : (eventType === 'churn' ? -revenueAmount : 0),
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    for (const event of revenueEvents) {
      const { error } = await supabaseClient
        .from('revenue_events')
        .insert(event);
      
      if (error) {
        console.error('Error creating revenue event:', error);
      }
    }

    console.log('Successfully seeded operations data');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Operations data seeded successfully',
      seeded: {
        teamMembers: teamMembers.length,
        healthMetrics: users?.users.length || 0,
        supportTickets: 15,
        revenueEvents: 30
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in operations-data-seeder function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to seed operations data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});