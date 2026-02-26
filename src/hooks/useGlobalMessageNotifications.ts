import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const notificationSound = new Audio('/sounds/message-notification.mp3');

/**
 * Global listener for company_messages inserts.
 * Shows an on-screen toast, plays a sound, and creates a bell notification
 * whenever a new message arrives that wasn't sent by the current user.
 */
export function useGlobalMessageNotifications() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user || subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel('global_company_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_messages',
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            sender_name: string;
            content: string;
            company_id: string;
            is_encore_admin: boolean;
          };

          // Don't notify for own messages
          if (msg.sender_id === user.id) return;

          // Play notification sound
          notificationSound.currentTime = 0;
          notificationSound.play().catch(() => {});

          // Show on-screen toast
          toast({
            title: `New message from ${msg.sender_name}`,
            description: msg.content.length > 80
              ? msg.content.slice(0, 80) + '…'
              : msg.content,
          });

          // Create a bell notification via RPC
          try {
            await supabase.rpc('create_notification', {
              p_user_id: user.id,
              p_type: 'system_alert' as any,
              p_title: `New message from ${msg.sender_name}`,
              p_message: msg.content.length > 120
                ? msg.content.slice(0, 120) + '…'
                : msg.content,
              p_data: { company_id: msg.company_id, message_id: msg.id },
              p_priority: 'medium',
              p_expires_at: null,
            });
          } catch (err) {
            console.error('[GlobalMessageNotifications] Failed to create notification:', err);
          }
        }
      )
      .subscribe();

    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);
}
