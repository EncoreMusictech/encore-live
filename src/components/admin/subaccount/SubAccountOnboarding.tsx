import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Stepper } from '@/components/ui/stepper';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { ONBOARDING_PHASES, getPhaseIndex } from '@/constants/onboardingPhases';
import {
  Building2, Settings, Users, FileText, Shield, Globe, Rocket,
  ArrowRight, AlertCircle, Calendar, CheckSquare, Clock
} from 'lucide-react';

const PHASE_ICONS: Record<string, React.ComponentType<any>> = {
  account_setup: Building2,
  module_config: Settings,
  user_onboarding: Users,
  data_ingestion: FileText,
  data_validation: Shield,
  portal_setup: Globe,
  go_live: Rocket,
};

interface Props {
  companyId: string;
  companyName: string;
}

export function SubAccountOnboarding({ companyId, companyName }: Props) {
  const {
    progress,
    isLoading,
    isInitialized,
    initialize,
    toggleChecklistItem,
    advancePhase,
    isItemCompleted,
    getPhaseCompletion,
    getPhaseRequiredComplete,
    getOverallProgress,
  } = useOnboardingProgress(companyId);

  // Auto-initialize on first visit
  useEffect(() => {
    if (!isLoading && !isInitialized) {
      initialize();
    }
  }, [isLoading, isInitialized, initialize]);

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">
            {isLoading ? 'Loading onboarding data...' : 'Initializing onboarding...'}
          </p>
        </div>
      </div>
    );
  }

  const currentPhaseId = progress!.current_phase;
  const currentPhaseIdx = getPhaseIndex(currentPhaseId);
  const currentPhase = ONBOARDING_PHASES[currentPhaseIdx];
  const overallProgress = getOverallProgress();
  const isCompleted = progress!.status === 'completed';

  const stepperSteps = ONBOARDING_PHASES.map((phase, idx) => ({
    title: `P${phase.order}`,
    description: phase.name.replace(`Phase ${phase.order}: `, ''),
    status: (isCompleted || idx < currentPhaseIdx
      ? 'completed'
      : idx === currentPhaseIdx
        ? 'current'
        : 'pending') as 'completed' | 'current' | 'pending',
    icon: PHASE_ICONS[phase.id],
  }));

  const riskColor = progress!.risk_level === 'high'
    ? 'text-red-600 bg-red-50 border-red-200'
    : progress!.risk_level === 'medium'
      ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
      : 'text-green-600 bg-green-50 border-green-200';

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(progress!.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysToGoLive = Math.floor(
    (new Date(progress!.target_go_live).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Rocket className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">
              🎉 {companyName} has completed onboarding and is live!
            </span>
          </CardContent>
        </Card>
      )}

      {/* Timeline & Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Started</div>
            <div className="font-semibold">{new Date(progress!.start_date).toLocaleDateString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Week</div>
            <div className="font-semibold">{progress!.week_number} of 7</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Target Go-Live</div>
            <div className="font-semibold">
              {new Date(progress!.target_go_live).toLocaleDateString()}
              <span className="text-xs text-muted-foreground ml-1">({daysToGoLive}d)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Risk Level</div>
            <Badge variant="outline" className={riskColor}>
              {progress!.risk_level}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Implementation Progress</span>
            <span className="text-sm font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          {progress!.assigned_csm && (
            <p className="text-sm text-muted-foreground">CSM: {progress!.assigned_csm}</p>
          )}
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card>
        <CardContent className="p-6 overflow-x-auto">
          <Stepper steps={stepperSteps} orientation="horizontal" />
        </CardContent>
      </Card>

      {/* Current Phase Checklist */}
      {!isCompleted && currentPhase && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{currentPhase.name}</CardTitle>
                  <CardDescription>{currentPhase.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentPhase.timeline}</Badge>
                <Badge variant="outline">{currentPhase.owner}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Phase Completion</span>
              <span className="font-medium">{getPhaseCompletion(currentPhaseId)}%</span>
            </div>
            <Progress value={getPhaseCompletion(currentPhaseId)} className="h-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {currentPhase.checklist.map(item => {
                const checked = isItemCompleted(currentPhaseId, item.id);
                return (
                  <div key={item.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) =>
                        toggleChecklistItem({
                          phaseId: currentPhaseId,
                          itemId: item.id,
                          completed: !!val,
                        })
                      }
                    />
                    <span className={`text-sm ${checked ? 'line-through text-muted-foreground' : ''}`}>
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => advancePhase()}
                disabled={!getPhaseRequiredComplete(currentPhaseId)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {currentPhaseIdx === ONBOARDING_PHASES.length - 1 ? 'Complete Onboarding' : 'Advance to Next Phase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Phases Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Phases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ONBOARDING_PHASES.map((phase, idx) => {
            const completion = getPhaseCompletion(phase.id);
            const isCurrent = phase.id === currentPhaseId && !isCompleted;
            const isDone = isCompleted || idx < currentPhaseIdx;
            return (
              <div key={phase.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-green-100 text-green-700' : isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? '✓' : phase.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{phase.name}</div>
                  <div className="text-xs text-muted-foreground">{phase.timeline} · {phase.owner}</div>
                </div>
                <div className="w-24">
                  <Progress value={isDone ? 100 : completion} className="h-1.5" />
                </div>
                <span className="text-xs font-medium w-10 text-right">{isDone ? 100 : completion}%</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
