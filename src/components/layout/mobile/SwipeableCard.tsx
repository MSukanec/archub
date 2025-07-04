import React, { useState, useEffect, ReactNode } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, Edit, Trash2 } from 'lucide-react';

interface SwipeAction {
  label: string;
  icon: ReactNode;
  variant?: "destructive" | "default";
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  actions?: SwipeAction[];
  onFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SwipeableCard({ 
  children, 
  actions,
  onFavorite,
  onEdit,
  onDelete
}: SwipeableCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const actionWidth = 80; // Width per action button
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default actions if none provided
  const defaultActions: SwipeAction[] = [
    {
      label: "Favorito",
      icon: <Star className="w-4 h-4" />,
      onClick: onFavorite || (() => {})
    },
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: onEdit || (() => {})
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive" as const,
      onClick: onDelete || (() => {})
    }
  ];

  const finalActions = actions || defaultActions;
  const totalActionWidth = finalActions.length * actionWidth;

  // Transform for revealing actions
  const actionOpacity = useTransform(x, [-totalActionWidth, 0], [1, 0]);
  const actionScale = useTransform(x, [-totalActionWidth, 0], [1, 0.8]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!isMobile) return;
    
    const swipeThreshold = -50;
    
    if (info.offset.x < swipeThreshold) {
      // Reveal actions
      x.set(-totalActionWidth);
      setIsRevealed(true);
    } else {
      // Hide actions
      x.set(0);
      setIsRevealed(false);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    // Hide actions after click
    x.set(0);
    setIsRevealed(false);
  };

  // Close swipe when clicking outside or on card content
  const handleCardClick = () => {
    if (isRevealed) {
      x.set(0);
      setIsRevealed(false);
    }
  };

  // If not mobile, render children directly without swipe functionality
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons background */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ 
          opacity: actionOpacity,
          scale: actionScale
        }}
      >
        {finalActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant === "destructive" ? "destructive" : "secondary"}
            size="sm"
            className={`
              h-full rounded-none border-0 flex-col gap-1 px-4
              ${action.variant === "destructive" 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'bg-muted hover:bg-muted/80'
              }
            `}
            style={{ width: `${actionWidth}px` }}
            onClick={() => handleActionClick(action)}
          >
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </motion.div>

      {/* Main card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleCardClick}
        className="relative bg-background z-10"
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
}