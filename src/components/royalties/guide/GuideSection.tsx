import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuideSection as GuideSectionType } from "@/data/royalties-guide-content";
import { GuideImageGallery } from "./GuideImageGallery";

interface GuideSectionProps {
  section: GuideSectionType;
  isActive?: boolean;
  onToggle?: () => void;
}

export const GuideSection = ({ section, isActive = false, onToggle }: GuideSectionProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {section.overview}
        </p>
      </div>

      {/* Screenshots if available */}
      {section.screenshots && section.screenshots.length > 0 && (
        <GuideImageGallery images={section.screenshots} />
      )}

      {/* Steps */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Step-by-Step Guide
        </h4>
        <div className="space-y-2">
          {section.steps.map((step, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <button
                onClick={() => toggleStep(index)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm">{step.title}</h5>
                  {!expandedSteps.has(index) && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {step.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-muted-foreground">
                  {expandedSteps.has(index) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {expandedSteps.has(index) && (
                <div className="px-4 pb-4 pt-0 ml-10">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="text-xs font-medium">Tips</span>
                      </div>
                      <ul className="space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips */}
      {section.proTips && section.proTips.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Lightbulb className="h-5 w-5" />
            <h4 className="font-semibold text-sm">Pro Tips</h4>
          </div>
          <ul className="space-y-2">
            {section.proTips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
