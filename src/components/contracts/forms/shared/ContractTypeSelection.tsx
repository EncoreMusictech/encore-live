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
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Select Agreement Type</h2>
        <p className="text-gray-400">
          Demo data is pre-loaded. The recommended type is highlighted, but you can select any type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractTypes.map((type) => {
          const isSelected = data[selectedField] === type.id;
          const IconComponent = type.icon;

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 bg-gray-900 border-gray-700 hover:border-gray-600 ${
                isSelected
                  ? "border-purple-500 border-2 shadow-lg shadow-purple-500/20"
                  : "border-gray-700"
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-xl text-white">{type.title}</CardTitle>
                      <CardDescription className="text-gray-400 text-base">
                        {type.description}
                      </CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}