import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Music, Globe, Truck, Crown, Star } from "lucide-react";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormSelectTypeProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

const agreementTypes = [
  {
    id: "indie",
    title: "Indie Artist Agreement",
    description: "Standard recording deal for independent artists",
    features: [
      "Recording Commitment",
      "Royalty Rates", 
      "Creative Control",
      "Revenue Splits"
    ]
  },
  {
    id: "360",
    title: "360 Deal",
    description: "Comprehensive deal covering all revenue streams",
    features: [
      "Recording Rights",
      "Publishing Share",
      "Touring Revenue",
      "Merchandising",
      "Brand Partnerships"
    ],
    recommended: true
  },
  {
    id: "distribution",
    title: "Distribution Deal w/ Advances",
    description: "Distribution with upfront financial support",
    features: [
      "Distribution Rights",
      "Advance Payment",
      "Marketing Support",
      "Recoupment Terms"
    ]
  }
];

export const ArtistAgreementFormSelectType: React.FC<ArtistAgreementFormSelectTypeProps> = ({
  data,
  onChange
}) => {
  const handleTypeSelect = (typeId: string) => {
    onChange({ agreementType: typeId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Select Agreement Type</h3>
        <p className="text-muted-foreground">
          Demo data is pre-loaded. The recommended type is highlighted, but you can select any type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agreementTypes.map((type) => {
          const isSelected = data.agreementType === type.id;
          const isRecommended = type.recommended;
          
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : isRecommended
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-border hover:border-muted-foreground/50"
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      {isRecommended && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                          <Star className="w-3 h-3 mr-1" />
                          Demo
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {type.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.agreementType && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {agreementTypes.find(t => t.id === data.agreementType)?.title} selected
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!data.agreementType && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                Please select an agreement type to continue
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};