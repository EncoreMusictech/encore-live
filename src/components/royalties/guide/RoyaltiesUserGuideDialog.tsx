import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FolderPlus,
  Upload,
  PenLine,
  Users,
  Receipt,
  PlayCircle,
  Wallet,
  Download,
  ChevronRight,
  BookOpen,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { royaltiesGuideContent, GuideSection as GuideSectionType } from "@/data/royalties-guide-content";
import { GuideSection } from "./GuideSection";
import {
  StatementImportWorkflow,
  BatchProcessingWorkflow,
  PayoutStatusWorkflow,
  RecoupmentWorkflow
} from "./WorkflowDiagram";

interface RoyaltiesUserGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap: Record<string, React.ElementType> = {
  BarChart3,
  FolderPlus,
  Upload,
  PenLine,
  Users,
  Receipt,
  PlayCircle,
  Wallet,
  Download
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || BookOpen;
};

export const RoyaltiesUserGuideDialog = ({
  open,
  onOpenChange
}: RoyaltiesUserGuideDialogProps) => {
  const [activeSection, setActiveSection] = useState<string>(royaltiesGuideContent[0]?.id || "analytics");

  const currentSection = royaltiesGuideContent.find(s => s.id === activeSection);

  // Get workflow diagram for current section
  const getWorkflowDiagram = (sectionId: string) => {
    switch (sectionId) {
      case "statements":
        return <StatementImportWorkflow />;
      case "processing":
        return <BatchProcessingWorkflow />;
      case "payouts":
        return <PayoutStatusWorkflow />;
      case "expenses":
        return <RecoupmentWorkflow />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Royalties Module User Guide</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Complete tutorial for managing royalty processing
                </p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              {royaltiesGuideContent.length} Sections
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-muted/20 flex-shrink-0 hidden md:block">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Table of Contents
                </p>
                {royaltiesGuideContent.map((section, index) => {
                  const IconComponent = getIconComponent(section.icon);
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium",
                        isActive ? "bg-primary-foreground/20" : "bg-muted"
                      )}>
                        {index + 1}
                      </div>
                      <span className="flex-1 truncate">{section.title}</span>
                      {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-b p-2 overflow-x-auto flex gap-2">
            {royaltiesGuideContent.map((section, index) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setActiveSection(section.id)}
              >
                {index + 1}. {section.title.split(" ")[0]}
              </Button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl">
                {currentSection && (
                  <>
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        {(() => {
                          const IconComponent = getIconComponent(currentSection.icon);
                          return <IconComponent className="h-6 w-6 text-primary" />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{currentSection.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          Section {royaltiesGuideContent.findIndex(s => s.id === activeSection) + 1} of {royaltiesGuideContent.length}
                        </p>
                      </div>
                    </div>

                    {/* Workflow Diagram if applicable */}
                    {getWorkflowDiagram(activeSection) && (
                      <div className="mb-6">
                        {getWorkflowDiagram(activeSection)}
                      </div>
                    )}

                    {/* Section Content */}
                    <GuideSection section={currentSection} />

                    {/* Navigation Footer */}
                    <Separator className="my-8" />
                    
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentIndex = royaltiesGuideContent.findIndex(s => s.id === activeSection);
                          if (currentIndex > 0) {
                            setActiveSection(royaltiesGuideContent[currentIndex - 1].id);
                          }
                        }}
                        disabled={royaltiesGuideContent.findIndex(s => s.id === activeSection) === 0}
                      >
                        Previous Section
                      </Button>
                      
                      <div className="flex gap-1">
                        {royaltiesGuideContent.map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              royaltiesGuideContent.findIndex(s => s.id === activeSection) === index
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => {
                          const currentIndex = royaltiesGuideContent.findIndex(s => s.id === activeSection);
                          if (currentIndex < royaltiesGuideContent.length - 1) {
                            setActiveSection(royaltiesGuideContent[currentIndex + 1].id);
                          }
                        }}
                        disabled={royaltiesGuideContent.findIndex(s => s.id === activeSection) === royaltiesGuideContent.length - 1}
                      >
                        Next Section
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
