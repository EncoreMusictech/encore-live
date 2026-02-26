import { useGlobalMessageNotifications } from '@/hooks/useGlobalMessageNotifications';
import { MessageBubbleOverlay } from '@/components/notifications/MessageBubbleOverlay';

export function GlobalMessageNotifier() {
  useGlobalMessageNotifications();
  return <MessageBubbleOverlay />;
}
