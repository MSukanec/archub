import { createContext, useContext, useState } from "react";

interface SlideNavigationContextType {
  activeView: string;
  direction: "forward" | "backward";
  setActiveView: (viewId: string) => void;
  setDirection: (dir: "forward" | "backward") => void;
  navigateTo: (viewId: string) => void;
  goBack: () => void;
}

const SlideNavigationContext = createContext<SlideNavigationContextType | undefined>(undefined);

export const SlideNavigationProvider = ({
  children,
  initialView = "main",
}: {
  children: React.ReactNode;
  initialView?: string;
}) => {
  const [activeView, setActiveViewInternal] = useState(initialView);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const setActiveView = (newView: string) => {
    setDirection("forward");
    setActiveViewInternal(newView);
  };

  const navigateTo = (viewId: string) => {
    setDirection("forward");
    setActiveViewInternal(viewId);
  };

  const goBack = () => {
    setDirection("backward");
    // En un caso real, podrías mantener un historial de vistas
    // Por ahora, solo cambiamos la dirección
  };

  return (
    <SlideNavigationContext.Provider
      value={{ activeView, setActiveView, direction, setDirection, navigateTo, goBack }}
    >
      {children}
    </SlideNavigationContext.Provider>
  );
};

export const useSlideNavigation = () => {
  const context = useContext(SlideNavigationContext);
  if (!context) {
    throw new Error("useSlideNavigation must be used within a SlideModal");
  }
  return context;
};