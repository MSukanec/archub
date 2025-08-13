import { useEffect, useRef, useState } from 'react';

export function useResizeObserver<T extends HTMLElement>(): [React.RefObject<T>, { width: number; height: number }] {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    // Set initial dimensions
    const { width, height } = element.getBoundingClientRect();
    setDimensions({ width, height });

    return () => resizeObserver.disconnect();
  }, []);

  return [ref, dimensions];
}