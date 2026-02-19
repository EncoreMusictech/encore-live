import { useState, useRef, useEffect } from 'react';
import { useCompanyChat } from '@/hooks/useCompanyChat';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface SubAccountChatProps {
  companyId: string;
  companyName: string;
}

export function SubAccountChat({ companyId, companyName }: SubAccountChatProps) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, scrollRef, isEncoreAdmin } = useCompanyChat(companyId);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, scrollRef]);

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          Messages — {companyName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time chat between ENCORE and {companyName} admins
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                    {/* Sender info */}
                    <div className={`flex items-center gap-1.5 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-xs font-medium text-muted-foreground">
                        {isOwn ? 'You' : msg.sender_name || msg.sender_email}
                      </span>
                      {msg.is_encore_admin ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/90">
                          ENCORE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {companyName}
                        </Badge>
                      )}
                    </div>
                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <div className="border-t p-3 flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
