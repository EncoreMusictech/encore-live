
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/ui/stepper";
import { CheckCircle, Circle, ArrowRight, Upload, Link, FileCheck, DollarSign } from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ComponentType<any>;
  action?: () => void;
  actionLabel?: string;
}

interface ReconciliationWorkflowProps {
  batchId?: string;
  onStepComplete?: (stepId: string) => void;
}

export function ReconciliationWorkflow({ batchId, onStepComplete }: ReconciliationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'import-batch',
      title: 'Import Reconciliation Batch',
      description: 'Upload and process the royalty statement from your source',
      status: batchId ? 'completed' : 'current',
      icon: Upload,
      actionLabel: 'Import Statement',
      action: () => {
        // Handle batch import
        console.log('Import batch');
      }
    },
    {
      id: 'review-batch',
      title: 'Review Batch Details',
      description: 'Verify batch information and total amounts',
      status: batchId ? 'current' : 'pending',
      icon: FileCheck,
      actionLabel: 'Review Batch',
      action: () => {
        // Handle batch review
        console.log('Review batch');
      }
    },
    {
      id: 'link-allocations',
      title: 'Link to Royalty Allocations',
      description: 'Connect individual royalty records to this batch',
      status: 'pending',
      icon: Link,
      actionLabel: 'Link Allocations',
      action: () => {
        // Handle allocation linking
        console.log('Link allocations');
        onStepComplete?.('link-allocations');
      }
    },
    {
      id: 'verify-reconciliation',
      title: 'Verify Reconciliation',
      description: 'Ensure all amounts match and resolve any discrepancies',
      status: 'pending',
      icon: CheckCircle,
      actionLabel: 'Verify & Complete',
      action: () => {
        // Handle reconciliation verification
        console.log('Verify reconciliation');
        onStepComplete?.('verify-reconciliation');
      }
    }
  ];

  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
  const totalSteps = workflowSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const handleStepAction = (step: WorkflowStep, index: number) => {
    step.action?.();
    setCurrentStep(index + 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Reconciliation Workflow</CardTitle>
            <CardDescription>
              Follow these steps to complete the reconciliation process
            </CardDescription>
          </div>
          <Badge variant="outline">
            {completedSteps} of {totalSteps} steps completed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  isCurrent ? 'border-blue-200 bg-blue-50' : 
                  isCompleted ? 'border-green-200 bg-green-50' : 
                  'border-gray-200'
                }`}
              >
                {/* Step Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isCurrent ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${
                        isCompleted ? 'text-green-900' :
                        isCurrent ? 'text-blue-900' :
                        'text-gray-900'
                      }`}>
                        {step.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isCompleted ? 'text-green-700' :
                        isCurrent ? 'text-blue-700' :
                        'text-gray-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>

                    {/* Step Action */}
                    {step.actionLabel && (isCurrent || (!isCompleted && index === currentStep)) && (
                      <Button
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStepAction(step, index)}
                        className="ml-4"
                      >
                        {step.actionLabel}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}

                    {/* Completed Indicator */}
                    {isCompleted && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import New Batch
            </Button>
            <Button variant="outline" size="sm">
              <Link className="h-4 w-4 mr-1" />
              Bulk Link Allocations
            </Button>
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-1" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">💡 Reconciliation Tips</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure all batch amounts match your original statements</li>
            <li>• Link allocations promptly to maintain accurate tracking</li>
            <li>• Review discrepancies before marking as complete</li>
            <li>• Use filters to find unlinked allocations quickly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
