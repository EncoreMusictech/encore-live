import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const CatalogValuationSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
    
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  </div>
);

export const TrackSelectorSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-24" />
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const DealSimulatorSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

interface AsyncLoadingProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  retry?: () => void;
}

export const AsyncLoading: React.FC<AsyncLoadingProps> = ({ 
  isLoading, 
  error, 
  children, 
  skeleton,
  retry 
}) => {
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-destructive">Error: {error}</div>
            {retry && (
              <button onClick={retry} className="text-primary hover:underline">
                Try again
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return skeleton || (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};