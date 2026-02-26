import { useGlobalMessageNotifications } from '@/hooks/useGlobalMessageNotifications';

export function GlobalMessageNotifier() {
  useGlobalMessageNotifications();
  return null;
}
