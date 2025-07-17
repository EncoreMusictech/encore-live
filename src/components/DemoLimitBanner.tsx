import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Crown } from "lucide-react";
import { useDemoAccess } from "@/hooks/useDemoAccess";

interface DemoLimitBannerProps {
  module: string;
  className?: string;
}

const DemoLimitBanner = ({ module, className = "" }: DemoLimitBannerProps) => {
  const { isDemo, isAdmin, getRemainingUsage, canAccess } = useDemoAccess();

  // Don't show banner for admin users or authenticated users
  if (isAdmin || !isDemo) return null;

  const remaining = getRemainingUsage(module);
  const hasAccess = canAccess(module);

  const getModuleName = (moduleId: string) => {
    switch (moduleId) {
      case 'catalogValuation':
        return 'Catalog Valuation';
      case 'contractManagement':
        return 'Contract Management';
      case 'copyrightManagement':
        return 'Copyright Management';
      case 'royaltiesProcessing':
        return 'Royalties Processing';
      default:
        return moduleId;
    }
  };

  const getModuleAction = (moduleId: string) => {
    switch (moduleId) {
      case 'catalogValuation':
        return 'artist search';
      case 'contractManagement':
        return 'contract';
      case 'copyrightManagement':
        return 'copyright registration';
      case 'royaltiesProcessing':
        return 'statement import';
      default:
        return 'action';
    }
  };

  if (!hasAccess) {
    return (
      <Alert className={`border-destructive bg-destructive/10 ${className}`}>
        <Crown className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Demo limit reached!</strong> You've completed your free {getModuleName(module)} demo.
          </div>
          <Button 
            size="sm" 
            className="ml-4 bg-gradient-primary text-primary-foreground"
            onClick={() => window.location.href = "/auth"}
          >
            Sign Up to Continue
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-music-purple bg-music-purple/10 ${className}`}>
      <Info className="h-4 w-4 text-music-purple" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-music-purple/20 text-music-purple">
            Demo Mode
          </Badge>
          <span>
            You have <strong>{remaining}</strong> free {getModuleAction(module)} remaining
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          className="ml-4 border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground"
          onClick={() => window.location.href = "/auth"}
        >
          Sign Up for Full Access
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DemoLimitBanner;