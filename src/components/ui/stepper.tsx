
import * as React from "react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: Array<{
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'pending';
    icon?: React.ComponentType<any>;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({ steps, orientation = 'horizontal', className }: StepperProps) {
  return (
    <div className={cn(
      "flex items-center justify-center",
      orientation === 'horizontal' ? "flex-row" : "flex-col",
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step Container */}
          <div className="flex flex-col items-center relative">
            {/* Step Box */}
            <div
              className={cn(
                "w-20 h-20 rounded-lg flex items-center justify-center text-sm font-medium border-2 relative z-10",
                step.status === 'completed'
                  ? "bg-green-50 border-green-500 text-green-700"
                  : step.status === 'current'
                  ? "bg-purple-50 border-purple-500 text-purple-700"
                  : "bg-gray-50 border-gray-300 text-gray-500"
              )}
            >
              {step.status === 'completed' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : step.icon ? (
                <step.icon className="w-6 h-6" />
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step Labels */}
            <div className="mt-3 text-center max-w-[120px]">
              <div className={cn(
                "text-sm font-semibold",
                step.status === 'completed' ? "text-green-700" :
                step.status === 'current' ? "text-purple-700" :
                "text-gray-600"
              )}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index !== steps.length - 1 && (
            <div className="flex items-center">
              <div
                className={cn(
                  "h-0.5 w-16 mx-4 transition-colors duration-200",
                  step.status === 'completed'
                    ? "bg-green-500"
                    : "bg-gray-300"
                )}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
