
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
      "flex",
      orientation === 'horizontal' ? "flex-row" : "flex-col",
      className
    )}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center",
            orientation === 'horizontal' ? "flex-row" : "flex-col",
            index !== steps.length - 1 && (orientation === 'horizontal' ? "flex-1" : "")
          )}
        >
          {/* Step Box */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center text-sm font-medium border-2 relative",
                step.status === 'completed'
                  ? "bg-green-100 border-green-500 text-green-700"
                  : step.status === 'current'
                  ? "bg-purple-100 border-purple-500 text-purple-700"
                  : "bg-gray-100 border-gray-300 text-gray-500"
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
            <div className="mt-2 text-center">
              <div className={cn(
                "text-sm font-medium",
                step.status === 'completed' ? "text-green-700" :
                step.status === 'current' ? "text-blue-700" :
                "text-gray-600"
              )}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-gray-500 mt-1 max-w-24">
                  {step.description}
                </div>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index !== steps.length - 1 && (
            <div
              className={cn(
                orientation === 'horizontal' ? "flex-1 h-0.5 mx-6 mt-8" : "w-0.5 h-8 my-2 ml-8",
                steps[index + 1]?.status === 'completed' || step.status === 'completed' 
                  ? "bg-green-300" 
                  : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
