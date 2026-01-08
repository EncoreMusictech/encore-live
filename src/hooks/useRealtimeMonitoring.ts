import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeEvent {
  id: string;
  event_type: string;
  event_source: string;
  event_data: any;
  severity: string;
  status: string;
  assigned_to?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export function useRealtimeMonitoring() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('realtime_monitoring_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching realtime events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('realtime_monitoring_events')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              status: 'acknowledged',
              acknowledged_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : event
      ));

      toast({
        title: "Event Acknowledged",
        description: "The monitoring event has been acknowledged",
      });
    } catch (err) {
      console.error('Error acknowledging event:', err);
      toast({
        title: "Error",
        description: "Failed to acknowledge event",
        variant: "destructive"
      });
    }
  };

  const resolveEvent = async (eventId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('realtime_monitoring_events')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : event
      ));

      toast({
        title: "Event Resolved",
        description: "The monitoring event has been resolved",
      });
    } catch (err) {
      console.error('Error resolving event:', err);
      toast({
        title: "Error",
        description: "Failed to resolve event",
        variant: "destructive"
      });
    }
  };

  const createEvent = async (event: Omit<RealtimeEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('realtime_monitoring_events')
        .insert({
          event_type: event.event_type,
          event_source: event.event_source,
          event_data: event.event_data,
          severity: event.severity,
          status: event.status || 'active',
          assigned_to: event.assigned_to,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEvents(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating event:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription for monitoring events
    const channel = supabase
      .channel('realtime_monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'realtime_monitoring_events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    acknowledgeEvent,
    resolveEvent,
    createEvent
  };
}
