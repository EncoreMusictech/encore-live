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

    // 1. Create enhanced operations team members
    const teamMembers = [
      {
        user_id: user.id,
        team_member_name: 'ENCORE Admin',
        department: 'Administration',
        role_title: 'System Administrator',
        permissions: { manage_team: true, view_analytics: true, manage_support: true },
        hire_date: '2024-01-01',
        performance_score: 95.0,
        active_tickets_count: 3,
        resolved_tickets_count: 147,
        avg_resolution_time_hours: 4.2,
        department_level: 5,
        is_team_lead: true,
        status: 'active',
        contact_info: { email: 'admin@encoremusic.tech', phone: '+1-555-0100', extension: '001' }
      },
      {
        team_member_name: 'Sarah Johnson',
        department: 'Customer Success',
        role_title: 'Customer Success Manager',
        permissions: { view_analytics: true, manage_support: true },
        hire_date: '2024-02-15',
        performance_score: 88.5,
        active_tickets_count: 7,
        resolved_tickets_count: 89,
        avg_resolution_time_hours: 6.8,
        department_level: 3,
        is_team_lead: false,
        status: 'active',
        contact_info: { email: 'sarah.johnson@encoremusic.tech', phone: '+1-555-0101' }
      },
      {
        team_member_name: 'Mike Chen',
        department: 'Technical Support',
        role_title: 'Senior Support Engineer',
        permissions: { manage_support: true },
        hire_date: '2024-03-01',
        performance_score: 92.1,
        active_tickets_count: 12,
        resolved_tickets_count: 203,
        avg_resolution_time_hours: 3.5,
        department_level: 4,
        is_team_lead: false,
        status: 'active',
        contact_info: { email: 'mike.chen@encoremusic.tech', phone: '+1-555-0102' }
      },
      {
        team_member_name: 'Emma Davis',
        department: 'Customer Success',
        role_title: 'Account Manager',
        permissions: { view_analytics: true, manage_support: false },
        hire_date: '2024-04-10',
        performance_score: 84.7,
        active_tickets_count: 5,
        resolved_tickets_count: 34,
        avg_resolution_time_hours: 8.1,
        department_level: 2,
        is_team_lead: false,
        status: 'active',
        contact_info: { email: 'emma.davis@encoremusic.tech', phone: '+1-555-0103' }
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

    // 5. Create sample workflow automation rules
    const workflowRules = [
      {
        user_id: user.id,
        rule_name: 'High Risk Customer Alert',
        trigger_type: 'customer_health_change',
        trigger_conditions: { health_score_threshold: 0.4, risk_level: 'high' },
        actions: { send_notification: true, assign_to_team: 'Customer Success', escalate: true },
        is_active: true,
        priority: 1,
        created_by_user_id: user.id
      },
      {
        user_id: user.id,
        rule_name: 'Urgent Ticket Assignment',
        trigger_type: 'ticket_created',
        trigger_conditions: { priority_level: 'urgent' },
        actions: { auto_assign: true, notify_team_lead: true, escalate_after_hours: 2 },
        is_active: true,
        priority: 2,
        created_by_user_id: user.id
      }
    ];

    for (const rule of workflowRules) {
      const { error } = await supabaseClient
        .from('workflow_automation_rules')
        .insert(rule);
      
      if (error) {
        console.error('Error creating workflow rule:', error);
      }
    }

    // 6. Create sample customer touchpoints
    if (users?.users.length) {
      const touchpoints = Array.from({ length: 25 }, (_, index) => {
        const customer = users.users[Math.floor(Math.random() * Math.min(users.users.length, 10))];
        const types = ['email', 'call', 'meeting', 'support_ticket', 'notification'];
        const channels = ['email', 'phone', 'chat', 'video', 'in_app'];
        const outcomes = ['positive', 'neutral', 'negative', 'no_response'];
        
        return {
          customer_user_id: customer.id,
          touchpoint_type: types[Math.floor(Math.random() * types.length)],
          interaction_direction: Math.random() > 0.6 ? 'outbound' : 'inbound',
          subject: `Customer interaction #${1000 + index}`,
          content: `Sample interaction content for touchpoint ${index + 1}`,
          channel: channels[Math.floor(Math.random() * channels.length)],
          handled_by_user_id: teamMembers[Math.floor(Math.random() * teamMembers.length)].user_id || user.id,
          outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
          follow_up_required: Math.random() > 0.7,
          follow_up_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          metadata: { interaction_duration: Math.floor(Math.random() * 60) + 5, customer_satisfaction: Math.floor(Math.random() * 5) + 1 }
        };
      });

      for (const touchpoint of touchpoints) {
        const { error } = await supabaseClient
          .from('customer_touchpoints')
          .insert(touchpoint);
        
        if (error) {
          console.error('Error creating touchpoint:', error);
        }
      }
    }

    // 7. Create sample performance metrics
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const performanceMetrics = [
      {
        metric_type: 'team_member',
        entity_id: user.id,
        metric_name: 'Tickets Resolved',
        metric_value: 47,
        metric_unit: 'count',
        period_start: lastMonth.toISOString().split('T')[0],
        period_end: endLastMonth.toISOString().split('T')[0],
        calculation_method: 'sum',
        benchmark_value: 40,
        variance_percentage: 17.5,
        trend_direction: 'up'
      },
      {
        metric_type: 'department',
        entity_id: user.id, // Use user.id as placeholder for department
        metric_name: 'Customer Satisfaction',
        metric_value: 4.2,
        metric_unit: 'rating',
        period_start: lastMonth.toISOString().split('T')[0],
        period_end: endLastMonth.toISOString().split('T')[0],
        calculation_method: 'avg',
        benchmark_value: 4.0,
        variance_percentage: 5.0,
        trend_direction: 'up'
      },
      {
        metric_type: 'system',
        entity_id: user.id,
        metric_name: 'Platform Uptime',
        metric_value: 99.8,
        metric_unit: 'percentage',
        period_start: lastMonth.toISOString().split('T')[0],
        period_end: endLastMonth.toISOString().split('T')[0],
        calculation_method: 'avg',
        benchmark_value: 99.5,
        variance_percentage: 0.3,
        trend_direction: 'stable'
      }
    ];

    for (const metric of performanceMetrics) {
      const { error } = await supabaseClient
        .from('performance_metrics')
        .insert(metric);
      
      if (error) {
        console.error('Error creating performance metric:', error);
      }
    }

    console.log('Successfully seeded enhanced operations data');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Enhanced operations data seeded successfully',
      seeded: {
        teamMembers: teamMembers.length,
        healthMetrics: users?.users.length || 0,
        supportTickets: 15,
        revenueEvents: 30,
        workflowRules: workflowRules.length,
        touchpoints: 25,
        performanceMetrics: performanceMetrics.length
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