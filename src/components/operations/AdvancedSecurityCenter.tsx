import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Globe,
  FileText,
  Settings
} from "lucide-react";

export function AdvancedSecurityCenter() {
  const [activeTab, setActiveTab] = useState("overview");

  const securityMetrics = {
    overallScore: 87,
    threats: {
      blocked: 247,
      active: 3,
      resolved: 1156
    },
    compliance: {
      gdpr: 94,
      sox: 89,
      iso27001: 92
    },
    vulnerabilities: {
      critical: 0,
      high: 2,
      medium: 8,
      low: 15
    }
  };

  const securityEvents = [
    {
      id: '1',
      type: 'Failed Login Attempt',
      severity: 'high',
      source: '192.168.1.100',
      timestamp: '2 minutes ago',
      status: 'investigating'
    },
    {
      id: '2', 
      type: 'Suspicious API Access',
      severity: 'medium',
      source: 'API Gateway',
      timestamp: '15 minutes ago',
      status: 'blocked'
    },
    {
      id: '3',
      type: 'Privilege Escalation',
      severity: 'critical',
      source: 'Internal System',
      timestamp: '1 hour ago',
      status: 'resolved'
    }
  ];

  const complianceChecks = [
    {
      name: 'Data Encryption',
      status: 'compliant',
      coverage: 100,
      lastCheck: '2 hours ago'
    },
    {
      name: 'Access Controls',
      status: 'compliant', 
      coverage: 96,
      lastCheck: '4 hours ago'
    },
    {
      name: 'Audit Logging',
      status: 'non-compliant',
      coverage: 78,
      lastCheck: '1 day ago'
    },
    {
      name: 'Data Retention',
      status: 'compliant',
      coverage: 92,
      lastCheck: '6 hours ago'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'non-compliant': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Advanced Security & Compliance Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="audits">Audits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Security Score */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Security Posture Score</h3>
                <Badge variant={securityMetrics.overallScore >= 85 ? "default" : "destructive"}>
                  {securityMetrics.overallScore >= 85 ? "Secure" : "At Risk"}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{securityMetrics.overallScore}/100</span>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Last assessment: Today</div>
                    <div>Next review: Tomorrow</div>
                  </div>
                </div>
                <Progress value={securityMetrics.overallScore} className="h-3" />
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-6 w-6 text-success" />
                  <h4 className="font-semibold">Threats Blocked</h4>
                </div>
                <div className="text-2xl font-bold text-success">
                  {securityMetrics.threats.blocked}
                </div>
                <div className="text-sm text-muted-foreground">This month</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <h4 className="font-semibold">Active Incidents</h4>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {securityMetrics.threats.active}
                </div>
                <div className="text-sm text-muted-foreground">Require attention</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <h4 className="font-semibold">Compliance Rate</h4>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round((securityMetrics.compliance.gdpr + securityMetrics.compliance.sox + securityMetrics.compliance.iso27001) / 3)}%
                </div>
                <div className="text-sm text-muted-foreground">Across standards</div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="threats" className="space-y-4">
            {/* Vulnerability Summary */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Vulnerability Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {securityMetrics.vulnerabilities.critical}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {securityMetrics.vulnerabilities.high}
                  </div>
                  <div className="text-sm text-muted-foreground">High</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {securityMetrics.vulnerabilities.medium}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium</div>
                </div>
                <div className="text-center p-3 bg-gray-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {securityMetrics.vulnerabilities.low}
                  </div>
                  <div className="text-sm text-muted-foreground">Low</div>
                </div>
              </div>
            </Card>

            {/* Recent Security Events */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${
                        event.severity === 'critical' ? 'text-destructive' :
                        event.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-sm">{event.type}</h4>
                        <p className="text-xs text-muted-foreground">
                          {event.source} • {event.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline">
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {/* Compliance Standards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">GDPR Compliance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-2xl font-bold">{securityMetrics.compliance.gdpr}%</span>
                    <Badge variant={securityMetrics.compliance.gdpr >= 90 ? "default" : "secondary"}>
                      {securityMetrics.compliance.gdpr >= 90 ? "Compliant" : "Review Required"}
                    </Badge>
                  </div>
                  <Progress value={securityMetrics.compliance.gdpr} />
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">SOX Compliance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-2xl font-bold">{securityMetrics.compliance.sox}%</span>
                    <Badge variant={securityMetrics.compliance.sox >= 90 ? "default" : "secondary"}>
                      {securityMetrics.compliance.sox >= 90 ? "Compliant" : "Review Required"}
                    </Badge>
                  </div>
                  <Progress value={securityMetrics.compliance.sox} />
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">ISO 27001</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-2xl font-bold">{securityMetrics.compliance.iso27001}%</span>
                    <Badge variant={securityMetrics.compliance.iso27001 >= 90 ? "default" : "secondary"}>
                      {securityMetrics.compliance.iso27001 >= 90 ? "Compliant" : "Review Required"}
                    </Badge>
                  </div>
                  <Progress value={securityMetrics.compliance.iso27001} />
                </div>
              </Card>
            </div>

            {/* Compliance Checks */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
              <div className="space-y-3">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h4 className="font-semibold text-sm">{check.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {check.coverage}% coverage • Last check: {check.lastCheck}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={check.coverage} className="w-20 h-2" />
                      <Badge variant={check.status === 'compliant' ? "default" : "destructive"}>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audits" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Security audit functionality coming soon</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}