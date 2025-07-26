import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export interface ContractType {
  id: string;
  title: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ComponentType<any>;
  demoId?: string;
}

interface ContractTypeSelectionProps {
  data: any;
  onChange: (data: any) => void;
  contractTypes: ContractType[];
  selectedField: string;
  onDemoDataLoad?: (demoId: string) => void;
}

export function ContractTypeSelection({
  data,
  onChange,
  contractTypes,
  selectedField,
  onDemoDataLoad
}: ContractTypeSelectionProps) {
  const handleTypeSelect = (typeId: string) => {
    const selectedType = contractTypes.find(type => type.id === typeId);
    
    // Update the selected type
    onChange({ [selectedField]: typeId });
    
    // Load demo data if available
    if (selectedType?.demoId && onDemoDataLoad) {
      onDemoDataLoad(selectedType.demoId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight">Choose Agreement Type</h3>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
          Select the type of music industry agreement you want to create. Each type includes specific terms and clauses tailored for different business relationships.
        </p>
      </div>

      <div className="grid gap-4 max-w-4xl mx-auto">
        {contractTypes.map((type) => {
          const isSelected = data[selectedField] === type.id;
          const IconComponent = type.icon;

          return (
            <Card
              key={type.id}
              className={`
                cursor-pointer transition-all duration-300 group
                ${isSelected
                  ? "border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:shadow-md hover:bg-muted/30"
                }
              `}
              onClick={() => handleTypeSelect(type.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTypeSelect(type.id);
                }
              }}
              aria-pressed={isSelected}
              aria-label={`Select ${type.title}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                      p-3 rounded-xl transition-all duration-200
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'
                      }
                    `}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{type.title}</CardTitle>
                        {type.popular && (
                          <Badge variant="default" className="text-xs bg-gradient-primary text-primary-foreground">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm leading-relaxed">
                        {type.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Key Features:</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`
                          h-2 w-2 rounded-full flex-shrink-0 mt-1.5 transition-colors
                          ${isSelected ? 'bg-primary' : 'bg-muted-foreground group-hover:bg-primary'}
                        `} />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Need help choosing? Each agreement type includes industry-standard terms and can be customized to your specific needs.
        </p>
      </div>
    </div>
  );
}