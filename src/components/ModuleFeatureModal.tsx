import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ModuleFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    features: string[];
    tier: "Free" | "Pro" | "Enterprise";
  } | null;
}

const moduleScreenshots: Record<string, { image: string; caption: string }[]> = {
  "royalties-processing": [
    {
      image: "/lovable-uploads/df93d50a-c213-4852-ba45-07700634740f.png",
      caption: "Complete royalties management dashboard with reconciliation, allocation, and payout modules"
    },
    {
      image: "/lovable-uploads/dc0df084-a407-4ecb-ba14-98ff89d28851.png", 
      caption: "Advanced statement import system with automatic source detection and processing status tracking"
    }
  ],
  "catalog-valuation": [
    {
      image: "/lovable-uploads/25790dd9-ce17-4e16-8c7a-cdc320f3985c.png",
      caption: "Advanced catalog valuation dashboard with DCF modeling, risk adjustment, and comprehensive analytics"
    },
    {
      image: "/lovable-uploads/3fdbaaf3-a629-4a56-b1c8-0edc554d9f7b.png",
      caption: "Detailed discounted cash flow analysis with 5-year projections and present value calculations"
    },
    {
      image: "/lovable-uploads/40512a6b-8881-4f09-bc65-cf98759d37e2.png",
      caption: "Professional valuation forecasts with scenario modeling (Pessimistic, Base Case, Optimistic)"
    }
  ],
  "contract-management": [
    {
      image: "/lovable-uploads/f4301905-51b8-4306-a9aa-59df345eeb10.png",
      caption: "Flexible contract creation options: build from scratch, use templates, or upload existing contracts"
    },
    {
      image: "/lovable-uploads/c6f80b04-ccf2-47b3-ac01-558e77b82c72.png",
      caption: "Comprehensive template library with industry-standard agreements for all deal types"
    },
    {
      image: "/lovable-uploads/a2796f57-7c02-41c6-9c14-4d5fe11bf140.png",
      caption: "Advanced import capabilities with DocuSign integration and intelligent PDF extraction"
    }
  ],
  "copyright-management": [
    {
      image: "/lovable-uploads/a5f76abb-e694-45da-ba43-2c6aed105518.png",
      caption: "Comprehensive copyright catalog with work ID tracking, writer splits, and registration status management"
    },
    {
      image: "/lovable-uploads/5721d322-d79d-43bc-a219-8d605cfe826f.png",
      caption: "Streamlined bulk upload system with CSV/Excel import and downloadable templates for efficient data entry"
    },
    {
      image: "/lovable-uploads/18afcfb2-776d-4595-9d91-c2da988e2bb3.png",
      caption: "Advanced metadata management with ISRC/ISWC tracking, writer agreements, and multi-PRO registration"
    }
  ],
  "sync-licensing": [
    {
      image: "/lovable-uploads/cceb73e7-dbf5-4458-a105-44e022585506.png",
      caption: "Comprehensive sync request creation with project details, media type, source tracking, and sync agent management"
    },
    {
      image: "/lovable-uploads/6cc3f248-6a49-4430-843e-d85eaae4d355.png",
      caption: "Advanced terms management with territory licensing, music usage rights, time codes, and licensing period tracking"
    },
    {
      image: "/lovable-uploads/46335fc7-00f3-45fd-97cb-21f2b426bffd.png",
      caption: "Complete status workflow tracking from inquiry to licensed with payment and invoice status management"
    }
  ],
  "client-portal": [
    {
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop",
      caption: "Secure artist dashboard with earnings analytics and performance insights"
    },
    {
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      caption: "Manager oversight portal with comprehensive deal and royalty visibility"
    }
  ]
};

const ModuleFeatureModal = ({ isOpen, onClose, module }: ModuleFeatureModalProps) => {
  if (!module) return null;

  const screenshots = moduleScreenshots[module.id] || [];
  const Icon = module.icon;
  const { canAccess, incrementUsage, showUpgradeModalForModule } = useDemoAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDemoClick = () => {
    const moduleMapping: Record<string, string> = {
      "catalog-valuation": "catalogValuation",
      "contract-management": "contractManagement", 
      "copyright-management": "copyrightManagement",
      "sync-licensing": "syncLicensing",
      "royalties-processing": "royaltiesProcessing"
    };

    const demoModule = moduleMapping[module.id];
    
    if (demoModule && canAccess(demoModule)) {
      incrementUsage(demoModule);
      toast({
        title: "Demo Access Granted",
        description: `You now have demo access to ${module.title}. Welcome to the demo!`,
      });
      
      // Navigate to the appropriate module path
      const modulePathMapping: Record<string, string> = {
        "catalog-valuation": "/catalog-valuation",
        "contract-management": "/contract-management",
        "copyright-management": "/copyright-management", 
        "sync-licensing": "/sync-licensing",
        "royalties-processing": "/reconciliation"
      };
      
      const path = modulePathMapping[module.id];
      if (path) {
        onClose();
        navigate(path);
      }
    } else if (demoModule) {
      showUpgradeModalForModule(demoModule);
    } else {
      toast({
        title: "Demo Not Available",
        description: "Demo access is not available for this module.",
        variant: "destructive"
      });
    }
  };

  const tierColors = {
    Free: "bg-secondary text-secondary-foreground",
    Pro: "bg-music-purple text-primary-foreground", 
    Enterprise: "bg-music-gold text-accent-foreground"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-primary rounded-lg p-3">
              <Icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{module.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={tierColors[module.tier]}>
                  {module.tier}
                </Badge>
                <p className="text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Screenshots */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Powerful Features in Action</h3>
            <div className="grid gap-6">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative overflow-hidden rounded-lg border bg-muted">
                    <img 
                      src={screenshot.image}
                      alt={screenshot.caption}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {screenshot.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Features</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {module.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-music-purple mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="outline"
              onClick={handleDemoClick}
              className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground"
            >
              Demo
            </Button>
            <Button 
              onClick={() => {
                window.location.href = "/pricing";
              }}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              Get Free Trial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleFeatureModal;