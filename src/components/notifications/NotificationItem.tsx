import { formatDistanceToNow } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  Shield, 
  Users,
  Music,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const getNotificationIcon = (type: string, priority: string) => {
  const iconClass = cn(
    "h-4 w-4 flex-shrink-0",
    priority === 'critical' && "text-destructive",
    priority === 'high' && "text-orange-500",
    priority === 'medium' && "text-primary",
    priority === 'low' && "text-muted-foreground"
  );

  switch (type) {
    case 'contract_signed':
    case 'contract_expiring':
    case 'contract_pending':
      return <FileText className={iconClass} />;
    case 'royalty_statement':
    case 'payment_processed':
      return <DollarSign className={iconClass} />;
    case 'copyright_registered':
      return <Music className={iconClass} />;
    case 'sync_opportunity':
      return <Calendar className={iconClass} />;
    case 'system_alert':
    case 'security_event':
      return <Shield className={iconClass} />;
    case 'user_registration':
      return <Users className={iconClass} />;
    case 'subscription_change':
      return <Settings className={iconClass} />;
    case 'document_ready':
      return <CheckCircle className={iconClass} />;
    default:
      return <AlertCircle className={iconClass} />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'border-l-destructive';
    case 'high':
      return 'border-l-orange-500';
    case 'medium':
      return 'border-l-primary';
    case 'low':
      return 'border-l-muted-foreground';
    default:
      return 'border-l-muted';
  }
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-l-2 transition-colors",
        !notification.read && "bg-primary/5",
        getPriorityColor(notification.priority)
      )}
      onClick={onClick}
    >
      <div className="mt-0.5">
        {getNotificationIcon(notification.type, notification.priority)}
      </div>
      
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm font-medium leading-5",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground leading-4 line-clamp-2">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          
          {notification.priority === 'critical' && (
            <span className="text-xs font-medium text-destructive uppercase tracking-wide">
              Critical
            </span>
          )}
          {notification.priority === 'high' && (
            <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
              High
            </span>
          )}
        </div>
      </div>
    </div>
  );
}