import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ModulePricingCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  monthlyPrice: number;
  annualPrice: number;
  isAnnual: boolean;
  onPurchase: () => void;
  isSelected?: boolean;
  onToggle?: () => void;
}

const ModulePricingCard = ({ 
  title, 
  description, 
  icon: Icon, 
  features, 
  monthlyPrice,
  annualPrice,
  isAnnual,
  onPurchase,
  isSelected = false,
  onToggle 
}: ModulePricingCardProps) => {
  const price = isAnnual ? annualPrice : monthlyPrice;
  const isFree = price === 0;

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-elegant ${
        isSelected ? 'ring-2 ring-music-purple shadow-glow' : ''
      } ${onToggle ? 'cursor-pointer' : ''}`}
      onClick={onToggle}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-gradient-primary rounded-lg p-3">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {isFree ? 'Free' : `$${price}`}
            </div>
            {!isFree && (
              <div className="text-sm text-muted-foreground">
                /{isAnnual ? 'year' : 'month'}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <CardTitle className="text-xl mb-2">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-start space-x-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-music-purple mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
          {features.length > 4 && (
            <li className="text-xs text-muted-foreground">
              +{features.length - 4} more features
            </li>
          )}
        </ul>

        {!onToggle && (
          <Button 
            onClick={onPurchase}
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isFree ? 'Get Started' : 'Purchase Module'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ModulePricingCard;