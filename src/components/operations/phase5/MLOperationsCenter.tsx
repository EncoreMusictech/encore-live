import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Cpu, 
  Database, 
  TrendingUp,
  Bot,
  Zap,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

export function MLOperationsCenter() {
  const mlMetrics = {
    modelsDeployed: 47,
    activeModels: 32,
    totalPredictions: 1284930,
    averageAccuracy: 94.7,
    computeUtilization: 78,
    inferenceLatency: 23,
    modelDrift: 2.3,
    dataQuality: 96.2
  };

  const modelPerformance = [
    { name: 'Customer Churn Prediction', accuracy: 96.4, status: 'healthy', predictions: 45821 },
    { name: 'Revenue Forecasting', accuracy: 92.1, status: 'healthy', predictions: 12405 },
    { name: 'Risk Assessment', accuracy: 98.2, status: 'healthy', predictions: 8934 },
    { name: 'Demand Planning', accuracy: 89.7, status: 'drift', predictions: 23106 },
    { name: 'Price Optimization', accuracy: 94.8, status: 'healthy', predictions: 15672 },
  ];

  const trainingJobs = [
    { id: 1, model: 'Customer Segmentation v2.1', status: 'running', progress: 67, eta: '45 min' },
    { id: 2, model: 'Fraud Detection v1.3', status: 'queued', progress: 0, eta: '2h 15m' },
    { id: 3, model: 'Recommendation Engine v3.0', status: 'completed', progress: 100, eta: 'Done' },
  ];

  const automatedActions = [
    { action: 'Auto-scaling triggered for inference cluster', timestamp: '5 min ago', type: 'system' },
    { action: 'Model drift detected - retraining scheduled', timestamp: '12 min ago', type: 'alert' },
    { action: 'New data batch processed successfully', timestamp: '18 min ago', type: 'success' },
    { action: 'Feature store updated with latest metrics', timestamp: '25 min ago', type: 'system' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'drift': return 'text-orange-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'drift': return 'secondary';
      case 'critical': return 'destructive';
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'queued': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-6 w-6" />
          ML Operations Center
        </CardTitle>
        <CardDescription>
          Machine learning model monitoring, training, and deployment management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ML System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Bot className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{mlMetrics.activeModels}/{mlMetrics.modelsDeployed}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {mlMetrics.activeModels}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Active Models</p>
              <p className="text-xs text-muted-foreground">
                {mlMetrics.modelsDeployed} total deployed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {mlMetrics.averageAccuracy}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {mlMetrics.averageAccuracy}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Avg Model Accuracy</p>
              <Progress value={mlMetrics.averageAccuracy} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Zap className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{mlMetrics.inferenceLatency}ms</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {mlMetrics.inferenceLatency}ms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Inference Latency</p>
              <p className="text-xs text-muted-foreground">
                P95 response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-primary" />
                <Badge variant="secondary">
                  {mlMetrics.totalPredictions.toLocaleString()}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {(mlMetrics.totalPredictions / 1000000).toFixed(1)}M
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Total Predictions</p>
              <p className="text-xs text-muted-foreground">
                Today's inference count
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Utilization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{mlMetrics.computeUtilization}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Compute Utilization</p>
              <Progress value={mlMetrics.computeUtilization} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{mlMetrics.dataQuality}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Data Quality Score</p>
              <Progress value={mlMetrics.dataQuality} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{mlMetrics.modelDrift}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Model Drift Index</p>
              <Progress value={mlMetrics.modelDrift * 10} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Model Performance Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Model Performance Dashboard
            </CardTitle>
            <CardDescription>
              Real-time monitoring of deployed ML models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelPerformance.map((model, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{model.name}</p>
                      <Badge 
                        variant={getStatusVariant(model.status)}
                        className={getStatusColor(model.status)}
                      >
                        {model.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {model.predictions.toLocaleString()} predictions today
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{model.accuracy}%</p>
                      <Progress value={model.accuracy} className="w-16 h-2" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Training Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5" />
              Training Pipeline
            </CardTitle>
            <CardDescription>
              Active and scheduled model training jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{job.model}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={job.progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-16">{job.progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">ETA: {job.eta}</p>
                    </div>
                    <div className="flex gap-1">
                      {job.status === 'running' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automated Actions Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              Automated Actions
            </CardTitle>
            <CardDescription>
              Recent automated ML operations and responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automatedActions.map((action, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm">{action.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{action.timestamp}</p>
                  </div>
                  <Badge variant={action.type === 'alert' ? 'destructive' : 'secondary'}>
                    {action.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}