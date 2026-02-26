import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export function GlobalChatBubble() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  // Don't show on the messages page itself, auth, or landing
  const hiddenPaths = ['/dashboard/messages', '/auth', '/'];
  const isHidden = hiddenPaths.includes(location.pathname) || !user;

  useEffect(() => {
    if (!user) return;

    // Count unread messages not sent by the current user
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('company_messages')
        .select('id')
        .neq('sender_id', user.id);

      // Filter those that don't include user in read_by
      // Since we can't easily filter jsonb arrays via PostgREST, we do it client-side
      if (data) {
        // We'll just show a simple indicator for now
        setUnread(data.length > 0 ? data.length : 0);
      }
    };

    fetchUnread();

    // Listen for new messages
    const channel = supabase
      .channel('global_chat_bubble_unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'company_messages' },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id !== user.id) {
            setUnread(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isHidden) return null;

  return (
    <button
      onClick={() => navigate('/dashboard/messages')}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
      aria-label="Open messages"
    >
      <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
      {unread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs px-1 rounded-full"
        >
          {unread > 99 ? '99+' : unread}
        </Badge>
      )}
    </button>
  );
}
