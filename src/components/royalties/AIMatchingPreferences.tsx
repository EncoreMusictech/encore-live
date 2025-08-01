import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings, Brain, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIMatchingPreferencesProps {
  onPreferencesChange: (preferences: AIMatchingPreferences) => void;
  initialPreferences?: Partial<AIMatchingPreferences>;
}

export interface AIMatchingPreferences {
  enableAI: boolean;
  autoMatchThreshold: number;
  batchSize: number;
  conservativeMode: boolean;
  includeSemanticAnalysis: boolean;
  maxProcessingTime: number;
}

const defaultPreferences: AIMatchingPreferences = {
  enableAI: true,
  autoMatchThreshold: 0.8,
  batchSize: 5,
  conservativeMode: true,
  includeSemanticAnalysis: true,
  maxProcessingTime: 30,
};

export function AIMatchingPreferences({ onPreferencesChange, initialPreferences }: AIMatchingPreferencesProps) {
  const [preferences, setPreferences] = useState<AIMatchingPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });

  useEffect(() => {
    onPreferencesChange(preferences);
  }, [preferences, onPreferencesChange]);

  const updatePreference = <K extends keyof AIMatchingPreferences>(
    key: K,
    value: AIMatchingPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getThresholdDescription = (threshold: number) => {
    if (threshold >= 0.9) return "Very Conservative - Only exact matches";
    if (threshold >= 0.8) return "Conservative - High confidence only";
    if (threshold >= 0.7) return "Balanced - Good confidence";
    if (threshold >= 0.6) return "Aggressive - Medium confidence";
    return "Very Aggressive - Low confidence accepted";
  };

  const getThresholdColor = (threshold: number) => {
    if (threshold >= 0.8) return "bg-green-500";
    if (threshold >= 0.7) return "bg-blue-500";
    if (threshold >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Matching Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enable-ai" className="text-sm font-medium">
                Enable AI-Enhanced Matching
              </Label>
              <p className="text-xs text-muted-foreground">
                Use AI to improve song matching accuracy with semantic analysis
              </p>
            </div>
            <Switch
              id="enable-ai"
              checked={preferences.enableAI}
              onCheckedChange={(checked) => updatePreference('enableAI', checked)}
            />
          </div>

          {preferences.enableAI && (
            <>
              {/* Auto-Match Threshold */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Auto-Match Confidence Threshold</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Songs with confidence above this threshold will be automatically matched</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[preferences.autoMatchThreshold]}
                    onValueChange={(value) => updatePreference('autoMatchThreshold', value[0])}
                    min={0.5}
                    max={0.95}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {Math.round(preferences.autoMatchThreshold * 100)}%
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getThresholdColor(preferences.autoMatchThreshold)} text-white border-none`}
                    >
                      {getThresholdDescription(preferences.autoMatchThreshold)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Batch Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Processing Batch Size</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of songs to process simultaneously. Lower values are more reliable.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[preferences.batchSize]}
                    onValueChange={(value) => updatePreference('batchSize', value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {preferences.batchSize} songs per batch
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {preferences.batchSize <= 3 ? "Conservative" : 
                       preferences.batchSize <= 6 ? "Balanced" : "Fast"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Conservative Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="conservative-mode" className="text-sm font-medium">
                    Conservative Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Prefer precision over recall - only match when very confident
                  </p>
                </div>
                <Switch
                  id="conservative-mode"
                  checked={preferences.conservativeMode}
                  onCheckedChange={(checked) => updatePreference('conservativeMode', checked)}
                />
              </div>

              {/* Semantic Analysis */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="semantic-analysis" className="text-sm font-medium">
                    Include Semantic Analysis
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use advanced AI to understand meaning beyond exact text matching
                  </p>
                </div>
                <Switch
                  id="semantic-analysis"
                  checked={preferences.includeSemanticAnalysis}
                  onCheckedChange={(checked) => updatePreference('includeSemanticAnalysis', checked)}
                />
              </div>

              {/* Max Processing Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Maximum Processing Time</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop AI processing after this many seconds to prevent timeouts</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[preferences.maxProcessingTime]}
                    onValueChange={(value) => updatePreference('maxProcessingTime', value[0])}
                    min={10}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {preferences.maxProcessingTime} seconds
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {preferences.maxProcessingTime <= 20 ? "Fast" : 
                       preferences.maxProcessingTime <= 40 ? "Balanced" : "Thorough"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary Info */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Current Configuration</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Will auto-match songs with {Math.round(preferences.autoMatchThreshold * 100)}%+ confidence</p>
                  <p>• Processing {preferences.batchSize} songs per batch</p>
                  <p>• {preferences.conservativeMode ? 'Conservative' : 'Aggressive'} matching approach</p>
                  <p>• {preferences.includeSemanticAnalysis ? 'Including' : 'Excluding'} semantic analysis</p>
                  <p>• Maximum {preferences.maxProcessingTime}s processing time</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}