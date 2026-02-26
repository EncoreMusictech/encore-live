import { create } from 'zustand';

// We'll use a simple event-based approach instead of zustand since it's not installed
// Using React context-free singleton pattern

type FailureDetails = {
  title: string;
  source: string;
  errorMessage: string;
  details?: Record<string, any>;
  timestamp: string;
};

type Listener = (failure: FailureDetails | null) => void;

let currentFailure: FailureDetails | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l(currentFailure));
}

export function showUploadFailure(failure: Omit<FailureDetails, 'timestamp'>) {
  currentFailure = { ...failure, timestamp: new Date().toISOString() };
  notify();
}

export function clearUploadFailure() {
  currentFailure = null;
  notify();
}

export function subscribeUploadFailure(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
