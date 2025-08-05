// src/components/modal/form/FormModalBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormModalBodyProps {
  children: ReactNode;
  columns?: number;
  className?: string;
  paddingX?: string; // Padding horizontal (left/right)
  paddingY?: string; // Padding vertical (top/bottom)
}

export default function FormModalBody({ 
  children, 
  columns = 2, 
  className,
  paddingX = "px-6",
  paddingY = "py-4"
}: FormModalBodyProps) {
  // Determine padding classes
  const paddingClasses = className?.includes("p-0") ? "" : `${paddingX} ${paddingY}`;
  
  return (
    <div className="flex-1 overflow-y-auto relative z-10">
      <div className={cn(
        "gap-6 text-sm",
        paddingClasses,
        columns === 1 ? "flex flex-col space-y-6" : "grid grid-cols-1 lg:grid-cols-2",
        className
      )}>
        {children}
      </div>
    </div>
  );
}