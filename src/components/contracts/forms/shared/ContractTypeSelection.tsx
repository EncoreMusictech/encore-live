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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Choose Agreement Type</h3>
        <p className="text-muted-foreground">
          Select the type of agreement you want to create
        </p>
      </div>

      <div className="grid gap-4">
        {contractTypes.map((type) => {
          const isSelected = data[selectedField] === type.id;
          const IconComponent = type.icon;

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        {type.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {type.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Key Features:</div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}