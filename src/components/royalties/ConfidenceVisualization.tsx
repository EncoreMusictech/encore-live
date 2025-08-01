import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, Brain, Info } from "lucide-react";

interface ConfidenceVisualizationProps {
  confidence: number;
  matchType: 'exact' | 'high' | 'medium' | 'low';
  factors?: {
    titleSimilarity: number;
    artistSimilarity: number;
    iswcMatch: boolean;
    akaMatch: boolean;
    writerMatch: boolean;
    aiSemanticScore?: number;
  };
  aiReasoning?: string;
  showDetails?: boolean;
}

export function ConfidenceVisualization({
  confidence,
  matchType,
  factors,
  aiReasoning,
  showDetails = false
}: ConfidenceVisualizationProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-600";
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.7) return "bg-blue-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    if (confidence >= 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'exact':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'high':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMatchTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'exact':
      case 'high':
        return "default";
      case 'medium':
        return "secondary";
      case 'low':
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Main confidence display */}
        <div className="flex items-center gap-2">
          {getMatchTypeIcon(matchType)}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {Math.round(confidence * 100)}% Confidence
              </span>
              <Badge variant={getMatchTypeVariant(matchType)} className="text-xs capitalize">
                {matchType} Match
              </Badge>
            </div>
            <Progress 
              value={confidence * 100} 
              className="h-2 w-full"
              // Apply custom color through CSS variable
              style={{
                "--progress-background": getConfidenceColor(confidence)
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* AI reasoning if available */}
        {aiReasoning && (
          <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
            <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">AI Analysis:</span> {aiReasoning}
            </div>
          </div>
        )}

        {/* Detailed factors breakdown */}
        {showDetails && factors && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-md">
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-xs">
                    <span>Title Similarity</span>
                    <span className="font-mono">{Math.round(factors.titleSimilarity * 100)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>How similar the song title is to the work title</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-xs">
                    <span>Artist/Writer</span>
                    <span className="font-mono">{Math.round(factors.artistSimilarity * 100)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>How well the artist matches the copyright writers</p>
                </TooltipContent>
              </Tooltip>

              {factors.aiSemanticScore !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        AI Score
                      </span>
                      <span className="font-mono">{Math.round(factors.aiSemanticScore * 100)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI semantic analysis confidence score</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>ISWC Match</span>
                <Badge variant={factors.iswcMatch ? "default" : "outline"} className="text-xs h-4">
                  {factors.iswcMatch ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span>AKA Match</span>
                <Badge variant={factors.akaMatch ? "default" : "outline"} className="text-xs h-4">
                  {factors.akaMatch ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span>Writer Match</span>
                <Badge variant={factors.writerMatch ? "default" : "outline"} className="text-xs h-4">
                  {factors.writerMatch ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}