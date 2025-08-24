import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";

interface CustomerHealthMetrics {
  id: string;
  customer_user_id: string;
  health_score: number;
  feature_adoption_rate: number;
  login_frequency: number;
  last_activity_date: string;
  modules_used: string[];
  contracts_created: number;
  royalties_processed: number;
  support_tickets_count: number;
  subscription_status: string;
  days_since_signup: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

interface CustomerHealthTableProps {
  customers: CustomerHealthMetrics[];
}

export function CustomerHealthTable({ customers }: CustomerHealthTableProps) {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive' as const;
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-destructive';
  };

  const formatLastActivity = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No customer health data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Health Score</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Modules Used</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer, index) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">Customer #{index + 1}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.contracts_created} contracts • ${customer.royalties_processed.toFixed(0)} royalties
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.days_since_signup} days since signup
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getHealthScoreColor(customer.health_score)}`}>
                      {(customer.health_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={customer.health_score * 100} className="w-20 h-2" />
                  <div className="text-xs text-muted-foreground">
                    {(customer.feature_adoption_rate * 100).toFixed(0)}% adoption
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRiskIcon(customer.risk_level)}
                  <Badge variant={getRiskBadgeVariant(customer.risk_level)}>
                    {customer.risk_level}
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    {formatLastActivity(customer.last_activity_date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.login_frequency}x this month
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">
                    {customer.modules_used?.length || 0} modules
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {customer.modules_used?.slice(0, 3).map((module) => (
                      <Badge key={module} variant="outline" className="text-xs">
                        {module.replace('-', ' ')}
                      </Badge>
                    ))}
                    {(customer.modules_used?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(customer.modules_used?.length || 0) - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}