import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

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
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      caption: "Centralized contract repository with smart tagging and organization"
    },
    {
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop",
      caption: "Automated deadline tracking with renewal alerts and notifications"
    }
  ],
  "copyright-management": [
    {
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop",
      caption: "Complete metadata management with ISRC/ISWC tracking and PRO registration"
    },
    {
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop",
      caption: "Advanced split management with writer and publisher royalty allocation"
    }
  ],
  "sync-licensing": [
    {
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop",
      caption: "Comprehensive sync deal pipeline with pitch tracking and status management"
    },
    {
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop",
      caption: "Automated deal memo generation with territory and term management"
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
              onClick={() => {
                if (module.title === "Catalog Valuation") {
                  window.location.href = "/catalog-valuation";
                } else {
                  window.location.href = "/pricing";
                }
              }}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleFeatureModal;