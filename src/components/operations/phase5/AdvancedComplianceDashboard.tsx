import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Lock,
  Eye,
  Download,
  Settings,
  Calendar,
  Building
} from "lucide-react";

export function AdvancedComplianceDashboard() {
  const complianceMetrics = {
    overallScore: 96.7,
    activeFrameworks: 8,
    completedAudits: 24,
    pendingActions: 7,
    riskScore: 12,
    certificationStatus: 98.3
  };

  const complianceFrameworks = [
    {
      name: 'SOC 2 Type II',
      status: 'certified',
      score: 98,
      lastAudit: '2024-01-15',
      nextAudit: '2024-12-15',
      requirements: 127,
      compliant: 124,
      risk: 'low'
    },
    {
      name: 'ISO 27001',
      status: 'certified',
      score: 95,
      lastAudit: '2024-02-20',
      nextAudit: '2025-02-20',
      requirements: 114,
      compliant: 108,
      risk: 'low'
    },
    {
      name: 'GDPR',
      status: 'compliant',
      score: 97,
      lastAudit: '2024-03-10',
      nextAudit: '2024-09-10',
      requirements: 89,
      compliant: 86,
      risk: 'medium'
    },
    {
      name: 'HIPAA',
      status: 'in_progress',
      score: 78,
      lastAudit: '2024-01-05',
      nextAudit: '2024-07-05',
      requirements: 164,
      compliant: 128,
      risk: 'high'
    }
  ];

  const auditActivities = [
    {
      type: 'audit_completed',
      framework: 'SOC 2',
      description: 'Annual SOC 2 Type II audit completed successfully',
      timestamp: '2 days ago',
      status: 'success',
      impact: 'certification_renewed'
    },
    {
      type: 'control_updated',
      framework: 'ISO 27001',
      description: 'Access control policies updated per new requirements',
      timestamp: '5 days ago',
      status: 'success',
      impact: 'compliance_improved'
    },
    {
      type: 'risk_identified',
      framework: 'GDPR',
      description: 'Data retention policy needs update for new regulations',
      timestamp: '1 week ago',
      status: 'pending',
      impact: 'action_required'
    },
    {
      type: 'training_completed',
      framework: 'All',
      description: 'Security awareness training completed by 98% of staff',
      timestamp: '2 weeks ago',
      status: 'success',
      impact: 'compliance_maintained'
    }
  ];

  const riskAssessments = [
    {
      category: 'Data Privacy',
      riskLevel: 'low',
      score: 15,
      controls: 23,
      lastReview: '2024-03-01',
      issues: 1
    },
    {
      category: 'Access Management',
      riskLevel: 'medium',
      score: 35,
      controls: 18,
      lastReview: '2024-02-28',
      issues: 3
    },
    {
      category: 'Network Security',
      riskLevel: 'low',
      score: 8,
      controls: 31,
      lastReview: '2024-03-05',
      issues: 0
    },
    {
      category: 'Physical Security',
      riskLevel: 'low',
      score: 12,
      controls: 15,
      lastReview: '2024-02-25',
      issues: 1
    }
  ];

  const upcomingRequirements = [
    {
      framework: 'SOC 2',
      requirement: 'Quarterly risk assessment review',
      dueDate: '2024-06-30',
      priority: 'high',
      assignee: 'Security Team',
      progress: 60
    },
    {
      framework: 'GDPR',
      requirement: 'Data processing agreement updates',
      dueDate: '2024-07-15',
      priority: 'medium',
      assignee: 'Legal Team',
      progress: 30
    },
    {
      framework: 'ISO 27001',
      requirement: 'Annual security policy review',
      dueDate: '2024-08-01',
      priority: 'high',
      assignee: 'CISO Office',
      progress: 45
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'certified': return 'text-success';
      case 'compliant': return 'text-success';
      case 'in_progress': return 'text-orange-500';
      case 'non_compliant': return 'text-destructive';
      case 'low': return 'text-success';
      case 'medium': return 'text-orange-500';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'certified': return 'default';
      case 'compliant': return 'default';
      case 'in_progress': return 'secondary';
      case 'non_compliant': return 'destructive';
      case 'success': return 'default';
      case 'pending': return 'secondary';
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-6 w-6" />
          Advanced Compliance Dashboard
        </CardTitle>
        <CardDescription>
          Enterprise-grade compliance monitoring, risk management, and audit tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {complianceMetrics.overallScore}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {complianceMetrics.overallScore}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Overall Compliance Score</p>
              <Progress value={complianceMetrics.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <FileCheck className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{complianceMetrics.activeFrameworks}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {complianceMetrics.activeFrameworks}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Active Frameworks</p>
              <p className="text-xs text-muted-foreground">
                {complianceMetrics.completedAudits} audits completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <Badge variant={complianceMetrics.riskScore < 20 ? 'default' : 'destructive'}>
                  {complianceMetrics.riskScore < 20 ? 'Low' : 'High'} Risk
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {complianceMetrics.riskScore}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Risk Score</p>
              <p className="text-xs text-muted-foreground">
                {complianceMetrics.pendingActions} pending actions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Frameworks Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Compliance Frameworks Status
            </CardTitle>
            <CardDescription>
              Current status and progress across all compliance frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceFrameworks.map((framework, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{framework.name}</h4>
                      <Badge 
                        variant={getStatusVariant(framework.status)}
                        className={getStatusColor(framework.status)}
                      >
                        {framework.status.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={getStatusVariant(framework.risk)}
                        className={getStatusColor(framework.risk)}
                      >
                        {framework.risk} risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{framework.score}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Compliance Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={framework.score} className="flex-1 h-2" />
                        <span className="text-sm">{framework.score}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Requirements</p>
                      <p className="text-sm font-medium">
                        {framework.compliant}/{framework.requirements}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Audit</p>
                      <p className="text-sm font-medium">{framework.lastAudit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Audit</p>
                      <p className="text-sm font-medium">{framework.nextAudit}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Risk Assessment Matrix
            </CardTitle>
            <CardDescription>
              Security risk assessment across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskAssessments.map((assessment, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{assessment.category}</h4>
                    <Badge 
                      variant={getStatusVariant(assessment.riskLevel)}
                      className={getStatusColor(assessment.riskLevel)}
                    >
                      {assessment.riskLevel} risk
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Score:</span>
                      <span className="font-medium">{assessment.score}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Controls:</span>
                      <span className="font-medium">{assessment.controls}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Open Issues:</span>
                      <span className="font-medium text-destructive">{assessment.issues}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Review:</span>
                      <span className="font-medium">{assessment.lastReview}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Compliance Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Compliance Requirements
            </CardTitle>
            <CardDescription>
              Scheduled compliance activities and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRequirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{req.requirement}</p>
                      <Badge variant="outline">{req.framework}</Badge>
                      <Badge variant={getPriorityVariant(req.priority)}>
                        {req.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Assigned to: {req.assignee} • Due: {req.dueDate}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={req.progress} className="flex-1 h-2" />
                      <span className="text-xs">{req.progress}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Audit Activities
            </CardTitle>
            <CardDescription>
              Latest compliance and audit activities across all frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{activity.framework}</Badge>
                      <Badge variant={getStatusVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm">{activity.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Report
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <FileCheck className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Generate Report</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Risk Assessment</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Settings className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Configure Policies</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}