import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Pause, Star, Eye } from "lucide-react";

interface SupportTicket {
  id: string;
  customer_user_id: string;
  ticket_subject: string;
  ticket_category: string;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_time_hours: number | null;
  first_response_time_hours: number | null;
  customer_satisfaction_score: number | null;
  created_at: string;
  resolved_at: string | null;
}

interface SupportTicketsTableProps {
  tickets: SupportTicket[];
}

export function SupportTicketsTable({ tickets }: SupportTicketsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive' as const;
      case 'in_progress':
        return 'secondary' as const;
      case 'resolved':
      case 'closed':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive' as const;
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const formatResolutionTime = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const renderSatisfactionScore = (score: number | null) => {
    if (!score) return <span className="text-muted-foreground">-</span>;
    
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{score}</span>
      </div>
    );
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No support tickets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-sm line-clamp-1">
                    {ticket.ticket_subject}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ticket.ticket_category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {formatTimeAgo(ticket.created_at)}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <Badge variant={getStatusBadgeVariant(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant={getPriorityBadgeVariant(ticket.priority_level)}
                  className={getPriorityColor(ticket.priority_level)}
                >
                  {ticket.priority_level}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {ticket.resolution_time_hours && (
                    <div className="text-sm">
                      Resolved: {formatResolutionTime(ticket.resolution_time_hours)}
                    </div>
                  )}
                  {ticket.first_response_time_hours && (
                    <div className="text-xs text-muted-foreground">
                      Response: {formatResolutionTime(ticket.first_response_time_hours)}
                    </div>
                  )}
                  {!ticket.resolution_time_hours && !ticket.first_response_time_hours && (
                    <div className="text-sm text-muted-foreground">
                      Pending
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {renderSatisfactionScore(ticket.customer_satisfaction_score)}
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}