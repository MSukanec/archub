import { useState, useCallback, createContext, useContext } from 'react';

interface SlideNavigationContextType {
  activeView: string;
  navigateTo: (viewId: string) => void;
  canGoBack: boolean;
  goBack: () => void;
  history: string[];
}

const SlideNavigationContext = createContext<SlideNavigationContextType | null>(null);

export function useSlideNavigation() {
  const context = useContext(SlideNavigationContext);
  if (!context) {
    throw new Error('useSlideNavigation must be used within a SlideModal');
  }
  return context;
}

export function useSlideNavigationState(initialView: string = 'main') {
  const [history, setHistory] = useState<string[]>([initialView]);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeView = history[history.length - 1];
  const canGoBack = history.length > 1;

  const navigateTo = useCallback((viewId: string) => {
    if (isAnimating || viewId === activeView) return;
    
    setIsAnimating(true);
    setHistory(prev => [...prev, viewId]);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  }, [activeView, isAnimating]);

  const goBack = useCallback(() => {
    if (isAnimating || !canGoBack) return;
    
    setIsAnimating(true);
    setHistory(prev => prev.slice(0, -1));
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  }, [canGoBack, isAnimating]);

  return {
    activeView,
    navigateTo,
    canGoBack,
    goBack,
    history,
    isAnimating,
    SlideNavigationContext
  };
}