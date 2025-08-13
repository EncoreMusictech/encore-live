import { useContext } from "react";
import { TourContext } from "@/components/tour/TourProvider";

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
};
