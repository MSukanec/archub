import React from 'react';
import { useSwipe } from '@/hooks/use-swipe';

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeContainer({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className = '' 
}: SwipeContainerProps) {
  const swipeRef = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance: 60,
    maxVerticalDistance: 80
  });

  return (
    <div 
      ref={swipeRef}
      className={className}
    >
      {children}
    </div>
  );
}