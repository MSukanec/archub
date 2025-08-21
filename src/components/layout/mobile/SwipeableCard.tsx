import React, { useState, useEffect, ReactNode } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Edit, Trash2 } from "lucide-react";

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
  onDelete,
}: SwipeableCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const actionWidth = 80;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const defaultActions: SwipeAction[] = [
    {
      label: "Favorito",
      icon: <Star className="w-2 h-2" />,
      onClick: onFavorite || (() => {}),
    },
    {
      label: "Editar",
      icon: <Edit className="w-2 h-2" />,
      onClick: onEdit || (() => {}),
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="w-2 h-2" />,
      variant: "destructive",
      onClick: onDelete || (() => {}),
    },
  ];

  const finalActions = actions || defaultActions;
  const totalActionWidth = finalActions.length * actionWidth;

  const actionOpacity = useTransform(x, [-totalActionWidth, 0], [1, 0]);
  const actionScale = useTransform(x, [-totalActionWidth, 0], [1, 0.8]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isMobile) return;

    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Más sensible: solo requiere 25% del ancho o velocidad moderada
    const swipeToOpen = offset < -totalActionWidth * 0.25 || velocity < -300;

    if (swipeToOpen) {
      x.set(-totalActionWidth);
      setIsRevealed(true);
    } else {
      x.set(0);
      setIsRevealed(false);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    x.set(0);
    setIsRevealed(false);
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Acciones detrás del contenido */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ opacity: actionOpacity, scale: actionScale }}
      >
        {finalActions.map((action, index) => (
          <Button
            key={index}
            variant={
              action.variant === "destructive" ? "destructive" : "secondary"
            }
            size="icon-sm"
            className={`
              h-full rounded-none border-0 flex-col gap-1 px-4
              ${
                action.variant === "destructive"
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-muted hover:bg-muted/80"
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

      {/* Contenido principal (sin onClick externo) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionWidth, right: 0 }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-background z-10"
        transition={{ type: "spring", damping: 30, stiffness: 600, duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
