import React, { createContext, useCallback, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

export type TourContextType = {
  startTour: (steps: Step[]) => void;
  stopTour: () => void;
  setSteps: (steps: Step[]) => void;
  running: boolean;
};

export const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [steps, setStepsState] = useState<Step[]>([]);
  const [run, setRun] = useState(false);

  const setSteps = useCallback((s: Step[]) => setStepsState(s), []);

  const startTour = useCallback((s: Step[]) => {
    if (Array.isArray(s) && s.length > 0) {
      setStepsState(s);
      setRun(true);
    }
  }, []);

  const stopTour = useCallback(() => setRun(false), []);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
    }
  }, []);

  const value = useMemo(
    () => ({ startTour, stopTour, setSteps, running: run }),
    [startTour, stopTour, setSteps, run]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        scrollToFirstStep
        disableOverlayClose
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
        callback={handleCallback}
      />
    </TourContext.Provider>
  );
};
