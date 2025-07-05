import React, { createContext, useContext, useState } from "react";

interface SlideNavigationContextType {
  activeView: string;
  direction: "forward" | "backward";
  setActiveView: (viewId: string) => void;
  setDirection: (dir: "forward" | "backward") => void;
  navigateTo: (viewId: string) => void;
  goBack: () => void;
}

const SlideNavigationContext = createContext<SlideNavigationContextType | undefined>(undefined);

interface SlideNavigationProviderProps {
  children: React.ReactNode;
  initialView?: string;
}

export const SlideNavigationProvider: React.FC<SlideNavigationProviderProps> = ({
  children,
  initialView = "main",
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
  };

  const value = {
    activeView,
    setActiveView,
    direction,
    setDirection,
    navigateTo,
    goBack,
  };

  return (
    <SlideNavigationContext.Provider value={value}>
      {children}
    </SlideNavigationContext.Provider>
  );
};

export const useSlideNavigation = (): SlideNavigationContextType => {
  const context = useContext(SlideNavigationContext);
  if (!context) {
    throw new Error("useSlideNavigation must be used within a SlideNavigationProvider");
  }
  return context;
};