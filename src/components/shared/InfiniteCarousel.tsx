import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface CarouselItem {
  id: string;
  src: string;
  alt?: string;
}

export interface InfiniteCarouselProps {
  items: CarouselItem[];
  direction?: 'left' | 'right';
  speed?: number;
  height?: number | string;
  visibleItems?: number;
  gap?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteCarousel({
  items,
  direction = 'left',
  speed = 30,
  height = 700,
  visibleItems = 4,
  gap = 8,
  pauseOnHover = true,
  className
}: InfiniteCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const itemWidth = useCallback(() => {
    if (!containerRef.current) return 300;
    return (containerRef.current.offsetWidth - (gap * (visibleItems - 1))) / visibleItems;
  }, [gap, visibleItems]);

  const totalWidth = useCallback(() => {
    return items.length * (itemWidth() + gap);
  }, [items.length, itemWidth, gap]);

  useEffect(() => {
    if (items.length === 0) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        const pixelsPerFrame = (speed * delta) / 1000;
        
        setPosition(prev => {
          let newPos = direction === 'left' 
            ? prev - pixelsPerFrame 
            : prev + pixelsPerFrame;
          
          const total = totalWidth();
          if (direction === 'left' && newPos <= -total) {
            newPos = newPos + total;
          } else if (direction === 'right' && newPos >= 0) {
            newPos = newPos - total;
          }
          
          return newPos;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items.length, isPaused, direction, speed, totalWidth]);

  useEffect(() => {
    if (direction === 'right') {
      setPosition(-totalWidth());
    }
  }, [direction, totalWidth]);

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  if (items.length === 0) {
    return null;
  }

  const duplicatedItems = [...items, ...items, ...items];
  const calculatedItemWidth = itemWidth();

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden", className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="infinite-carousel"
    >
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          transform: `translateX(${position}px)`,
          gap: `${gap}px`,
          willChange: 'transform',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 h-full"
          >
            <img
              src={item.src}
              alt={item.alt || ''}
              className="h-full w-auto object-contain"
              loading="lazy"
              data-testid={`carousel-item-${item.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
