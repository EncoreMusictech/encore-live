import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Workflow, 
  Play, 
  Pause, 
  SkipForward,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  BarChart3
} from "lucide-react";

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  dependencies?: string[];
}

interface WorkflowExecution {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  steps: WorkflowStep[];
}

export function AdvancedWorkflowOrchestrator() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('customer-onboarding');

  const workflows: WorkflowExecution[] = [
    {
      id: 'customer-onboarding',
      name: 'Customer Onboarding Automation',
      status: 'running',
      progress: 67,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000),
      steps: [
        { id: '1', name: 'Account Creation', type: 'system', status: 'completed' },
        { id: '2', name: 'Send Welcome Email', type: 'notification', status: 'completed' },
        { id: '3', name: 'Setup Demo Data', type: 'data', status: 'running' },
        { id: '4', name: 'Schedule Onboarding Call', type: 'integration', status: 'pending', dependencies: ['3'] },
        { id: '5', name: 'Assign Success Manager', type: 'manual', status: 'pending', dependencies: ['4'] }
      ]
    },
    {
      id: 'incident-response',
      name: 'Security Incident Response',
      status: 'completed',
      progress: 100,
      startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      steps: [
        { id: '1', name: 'Detect Anomaly', type: 'system', status: 'completed' },
        { id: '2', name: 'Isolate Affected Systems', type: 'system', status: 'completed' },
        { id: '3', name: 'Notify Security Team', type: 'notification', status: 'completed' },
        { id: '4', name: 'Investigate Root Cause', type: 'manual', status: 'completed' },
        { id: '5', name: 'Apply Security Patch', type: 'system', status: 'completed' }
      ]
    },
    {
      id: 'monthly-reporting',
      name: 'Monthly Executive Reporting',
      status: 'paused',
      progress: 45,
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      steps: [
        { id: '1', name: 'Gather Revenue Data', type: 'data', status: 'completed' },
        { id: '2', name: 'Generate Analytics', type: 'system', status: 'completed' },
        { id: '3', name: 'Create Visualizations', type: 'system', status: 'running' },
        { id: '4', name: 'Executive Review', type: 'manual', status: 'pending', dependencies: ['3'] },
        { id: '5', name: 'Distribute Reports', type: 'notification', status: 'pending', dependencies: ['4'] }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'running': return <Play className="h-4 w-4 text-primary animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'paused': return 'outline';
      default: return 'secondary';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'running': return 'bg-primary animate-pulse';
      case 'failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const currentWorkflow = workflows.find(w => w.id === selectedWorkflow);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Advanced Workflow Orchestrator
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Selection */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Active Workflow:</label>
          <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workflow Overview */}
        {currentWorkflow && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{currentWorkflow.name}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentWorkflow.status)}
                  <Badge variant={getStatusColor(currentWorkflow.status)}>
                    {currentWorkflow.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm font-medium">{currentWorkflow.progress}%</span>
                </div>
                <Progress value={currentWorkflow.progress} />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Started:</span>
                    <span className="ml-2 font-medium">
                      {currentWorkflow.startTime.toLocaleString()}
                    </span>
                  </div>
                  {currentWorkflow.estimatedCompletion && (
                    <div>
                      <span className="text-muted-foreground">Est. Completion:</span>
                      <span className="ml-2 font-medium">
                        {currentWorkflow.estimatedCompletion.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow Controls */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
                <Button variant="outline" size="sm">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="outline" size="sm">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Step
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </Card>

            {/* Workflow Steps */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Workflow Steps</h3>
              <div className="space-y-3">
                {currentWorkflow.steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {/* Connection Line */}
                    {index < currentWorkflow.steps.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-6 bg-border"></div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      {/* Step Indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatusColor(step.status)}`}>
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-white" />}
                        {step.status === 'running' && <Play className="h-4 w-4 text-white" />}
                        {step.status === 'failed' && <AlertCircle className="h-4 w-4 text-white" />}
                        {step.status === 'pending' && <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{step.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {step.type}
                          </Badge>
                          {step.status === 'completed' && step.duration && (
                            <Badge variant="secondary" className="text-xs">
                              {step.duration}s
                            </Badge>
                          )}
                        </div>
                        {step.dependencies && (
                          <p className="text-xs text-muted-foreground">
                            Depends on: Step {step.dependencies.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Step Actions */}
                      <div className="flex gap-1">
                        {step.status === 'running' && (
                          <Button variant="ghost" size="sm">
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {step.status === 'failed' && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Workflow Analytics */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Workflow Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {workflows.filter(w => w.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {workflows.filter(w => w.status === 'running').length}
              </div>
              <div className="text-sm text-muted-foreground">Currently Running</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(workflows.reduce((acc, w) => acc + w.progress, 0) / workflows.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Progress</div>
            </div>
          </div>
          
          <Button className="w-full mt-4" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Detailed Analytics
          </Button>
        </Card>
      </CardContent>
    </Card>
  );
}