import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BubbleMessage {
  id: string;
  senderName: string;
  content: string;
  companyId: string;
}

const DISPLAY_DURATION = 5000;

let pushBubble: (msg: BubbleMessage) => void = () => {};

export function usePushBubble() {
  return pushBubble;
}

export function MessageBubbleOverlay() {
  const [bubbles, setBubbles] = useState<BubbleMessage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    pushBubble = (msg: BubbleMessage) => {
      setBubbles((prev) => [...prev, msg]);
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== msg.id));
      }, DISPLAY_DURATION);
    };
    return () => {
      pushBubble = () => {};
    };
  }, []);

  const dismiss = (id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClick = (b: BubbleMessage) => {
    dismiss(b.id);
    navigate('/dashboard/messages');
  };

  if (bubbles.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {bubbles.map((b, i) => (
        <div
          key={b.id}
          className="pointer-events-auto animate-fade-in max-w-sm w-80 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-lg shadow-black/10 dark:shadow-black/30 p-3 flex items-start gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
          onClick={() => handleClick(b)}
          role="button"
          tabIndex={0}
        >
          <div className="flex-shrink-0 mt-0.5 h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              New Message
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {b.senderName}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {b.content}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss(b.id);
            }}
            className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
