import React, { Suspense, lazy } from 'react';
import { CatalogValuationSkeleton, DealSimulatorSkeleton, TrackSelectorSkeleton } from '@/components/LoadingStates';

// Lazy load heavy components
const LazyCatalogValuation = lazy(() => import('@/components/CatalogValuation'));
const LazyDealSimulator = lazy(() => import('@/components/DealSimulator'));
const LazyTrackSelector = lazy(() => import('@/components/TrackSelector'));

// Lazy load chart components
const LazyLineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));
const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));

// Wrapper components with suspense
export const CatalogValuationWithSuspense = (props: any) => (
  <Suspense fallback={<CatalogValuationSkeleton />}>
    <LazyCatalogValuation {...props} />
  </Suspense>
);

export const DealSimulatorWithSuspense = (props: any) => (
  <Suspense fallback={<DealSimulatorSkeleton />}>
    <LazyDealSimulator {...props} />
  </Suspense>
);

export const TrackSelectorWithSuspense = (props: any) => (
  <Suspense fallback={<TrackSelectorSkeleton />}>
    <LazyTrackSelector {...props} />
  </Suspense>
);

// Chart components with suspense
export const LineChartWithSuspense = (props: any) => (
  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const BarChartWithSuspense = (props: any) => (
  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const PieChartWithSuspense = (props: any) => (
  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
    <LazyPieChart {...props} />
  </Suspense>
);

export {
  LazyCatalogValuation,
  LazyDealSimulator,
  LazyTrackSelector,
  LazyLineChart,
  LazyBarChart,
  LazyPieChart,
};