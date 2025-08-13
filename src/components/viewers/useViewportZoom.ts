import { useState, useCallback, useRef, useEffect } from 'react';

export interface ViewportZoomState {
  scale: number;
  setScale: (scale: number) => void;
  reset: () => void;
  fitToWidth: (baseWidth: number, containerWidth: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onWheel: (e: WheelEvent) => void;
}

export function useViewportZoom(initialScale: number = 1): ViewportZoomState {
  const [scale, setScale] = useState(initialScale);
  const minScale = 0.1;
  const maxScale = 3;

  const reset = useCallback(() => {
    setScale(1);
  }, []);

  const fitToWidth = useCallback((baseWidth: number, containerWidth: number) => {
    if (baseWidth > 0 && containerWidth > 0) {
      const newScale = Math.min(containerWidth / baseWidth, 1);
      setScale(Math.max(minScale, Math.min(maxScale, newScale)));
    }
  }, []);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(maxScale, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(minScale, prev / 1.2));
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(minScale, Math.min(maxScale, prev * delta)));
    }
  }, []);

  return {
    scale,
    setScale: (newScale: number) => setScale(Math.max(minScale, Math.min(maxScale, newScale))),
    reset,
    fitToWidth,
    zoomIn,
    zoomOut,
    onWheel
  };
}