import React, { useState } from 'react';
import { InteractiveWorkflowGuide } from '@/components/tour/InteractiveWorkflowGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stepDetails: Record<string, {
  title: string;
  description: string;
  actionItems: string[];
  tips: string[];
}> = {
  '1': {
    title: 'Artist Discovery',
    description: 'Search and analyze target artists using Spotify data',
    actionItems: [
      'Click "Deal Analysis" tab',
      'Click "Search Artist" sub-tab',
      'Enter artist name (e.g., "Billie Eilish")',
      'Review artist information and popularity scores'
    ],
    tips: [
      'Try major artists for best data quality',
      'Popularity scores range from 0-100',
      'Look for artists with consistent catalog performance'
    ]
  },
  '2': {
    title: 'Asset Selection',
    description: 'Choose specific albums and singles for your deal portfolio',
    actionItems: [
      'Click "Select Assets" tab',
      'Review complete discography',
      'Check boxes for desired albums/singles',
      'Monitor estimated streams calculation'
    ],
    tips: [
      'Albums: Higher risk/reward with multiple tracks',
      'Singles: More predictable returns',
      'Mixed portfolios balance risk effectively'
    ]
  },
  '3': {
    title: 'Deal Configuration',
    description: 'Set financial terms and deal structure parameters',
    actionItems: [
      'Click "Deal Terms" tab',
      'Select deal type (Acquisition/Licensing/Co-Publishing)',
      'Set upfront advance amount',
      'Configure recoupment rate (50-100%)',
      'Define catalog ownership percentage'
    ],
    tips: [
      'Acquisition = 100% ownership, highest investment',
      'Recoupment rate affects cash flow timing',
      'Higher ownership = higher returns but more risk'
    ]
  },
  '4': {
    title: 'Financial Projections',
    description: 'Run 5-year financial models with decay curves and risk factors',
    actionItems: [
      'Click "Calculate Projections" button',
      'Review ROI percentage and payback period',
      'Analyze year-by-year cash flows',
      'Assess risk-adjusted valuations'
    ],
    tips: [
      'Shorter payback = lower risk',
      'ROI includes advance recoupment',
      'Projections use exponential decay models'
    ]
  },
  '5': {
    title: 'Scenario Management',
    description: 'Save, compare, and manage multiple deal scenarios',
    actionItems: [
      'Click "Save Scenario" button',
      'Enter descriptive scenario name',
      'Navigate to "Saved Scenarios" tab',
      'Compare multiple deals side-by-side'
    ],
    tips: [
      'Save multiple scenarios for comparison',
      'Use descriptive names for easy identification',
      'Export reports for stakeholder presentations'
    ]
  }
};

export default function InteractiveWorkflowDemo() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('1');

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const currentStepData = stepDetails[currentStep];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/catalog-valuation')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog Valuation
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Interactive Workflow Guide</h1>
            <p className="text-muted-foreground">Alternative tour implementation using React Flow</p>
          </div>
        </div>

        {/* Interactive Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InteractiveWorkflowGuide 
              onStepClick={handleStepClick}
              currentStep={currentStep}
            />
          </div>

          {/* Step Details Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-500">
                    Step {currentStep}
                  </Badge>
                  <CardTitle className="text-lg">{currentStepData?.title}</CardTitle>
                </div>
                <CardDescription>
                  {currentStepData?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Action Items:</h4>
                  <ul className="space-y-1">
                    {currentStepData?.actionItems.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Pro Tips:
                  </h4>
                  <ul className="space-y-1">
                    {currentStepData?.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Benefits of This Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Visual workflow representation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Interactive step navigation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Clear progress tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    No overlapping UI elements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Self-contained experience
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}