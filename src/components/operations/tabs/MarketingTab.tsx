import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer, 
  Eye, 
  Users,
  Mail,
  Share2
} from "lucide-react";

interface MarketingTabProps {
  metrics: any;
}

export function MarketingTab({ metrics }: MarketingTabProps) {
  return (
    <div className="space-y-6">
      {/* Marketing Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Eye className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Views</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">12.4K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Website Views</p>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <MousePointer className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">+4.2%</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">3.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Click-through Rate</p>
            <p className="text-xs text-muted-foreground">
              Average CTR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="secondary">New</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">847</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">New Leads</p>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Rate</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">24.7%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Email Open Rate</p>
            <p className="text-xs text-muted-foreground">
              Campaign average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Active Campaigns
          </CardTitle>
          <CardDescription>
            Current marketing campaigns and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Q4 Product Launch', type: 'Email', status: 'Active', performance: 'Excellent', metrics: '12.5% CTR' },
              { name: 'Social Media Drive', type: 'Social', status: 'Active', performance: 'Good', metrics: '847 leads' },
              { name: 'Content Marketing', type: 'Blog', status: 'Active', performance: 'Average', metrics: '2.3K views' },
              { name: 'PPC Campaign', type: 'Ads', status: 'Paused', performance: 'Poor', metrics: '1.2% CTR' },
            ].map((campaign) => (
              <div key={campaign.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{campaign.name}</span>
                    <Badge variant="outline">{campaign.type}</Badge>
                    <Badge 
                      variant={campaign.status === 'Active' ? 'default' : 'secondary'}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Performance: {campaign.performance}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{campaign.metrics}</p>
                  <p className="text-xs text-muted-foreground">Key metric</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lead Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>
            Where your leads are coming from this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { source: 'Organic Search', leads: 324, percentage: 38, color: 'bg-blue-500' },
              { source: 'Social Media', leads: 187, percentage: 22, color: 'bg-purple-500' },
              { source: 'Email Marketing', leads: 156, percentage: 18, color: 'bg-green-500' },
              { source: 'Paid Advertising', leads: 102, percentage: 12, color: 'bg-orange-500' },
              { source: 'Referrals', leads: 78, percentage: 10, color: 'bg-pink-500' },
            ].map((source) => (
              <div key={source.source} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${source.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{source.source}</span>
                    <span className="text-sm">{source.leads} leads</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`h-2 rounded-full ${source.color} opacity-20 flex-1 mr-2`}>
                      <div 
                        className={`h-2 rounded-full ${source.color}`}
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{source.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}