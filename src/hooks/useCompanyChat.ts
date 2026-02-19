import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CompanyMessage {
  id: string;
  company_id: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  content: string;
  is_encore_admin: boolean;
  read_by: string[];
  created_at: string;
}

export function useCompanyChat(companyId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<CompanyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
  const isEncoreAdmin = adminEmails.includes(user?.email?.toLowerCase() || '');

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_messages')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as unknown as CompanyMessage[]) || []);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;
    try {
      setSending(true);
      const senderName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown';

      const { error } = await supabase
        .from('company_messages')
        .insert({
          company_id: companyId,
          sender_id: user.id,
          sender_email: user.email || '',
          sender_name: senderName,
          content: content.trim(),
          is_encore_admin: isEncoreAdmin,
          read_by: [user.id],
        } as any);

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [user, companyId, isEncoreAdmin, toast]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`company_chat_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_messages',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newMsg = payload.new as unknown as CompanyMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchMessages, scrollToBottom]);

  const unreadCount = messages.filter(
    (m) => m.sender_id !== user?.id && !(m.read_by || []).includes(user?.id || '')
  ).length;

  return { messages, loading, sending, sendMessage, scrollRef, unreadCount, isEncoreAdmin };
}
