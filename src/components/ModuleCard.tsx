import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  tier: "Free" | "Pro" | "Enterprise";
  isPopular?: boolean;
  onGetStarted: () => void;
}

const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  features, 
  tier, 
  isPopular = false,
  onGetStarted 
}: ModuleCardProps) => {
  const tierColors = {
    Free: "bg-secondary text-secondary-foreground",
    Pro: "bg-music-purple text-primary-foreground",
    Enterprise: "bg-music-gold text-accent-foreground"
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-elegant hover:scale-105 ${
      isPopular ? 'ring-2 ring-music-purple shadow-glow' : ''
    }`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Most Popular
        </div>
      )}
      
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-gradient-primary rounded-lg p-3">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <Badge className={tierColors[tier]}>
            {tier}
          </Badge>
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
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-music-purple mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          onClick={() => onGetStarted()}
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;