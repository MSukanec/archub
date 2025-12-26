import { ReactNode } from "react";
import { cn } from "@/lib/utils";
interface ModalBodyProps {
  children: ReactNode;
  columns?: number;
  className?: string;
  paddingX?: string;
  paddingY?: string;
}
export default function ModalBody({ 
  children, 
  columns = 1, 
  className,
  paddingX = "px-6",
  paddingY = "py-4"
}: ModalBodyProps) {
  const paddingClasses = className?.includes("p-0") ? "" : `${paddingX} ${paddingY}`;
  
  return (
    <div className="flex-1 overflow-y-auto relative z-[200000]">
      <div className={cn(
        "gap-6 text-sm",
        paddingClasses,
        columns === 1 ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-2",
        className
      )}>
        {children}
      </div>
    </div>
  );
}
export { ModalBody as FormModalBody };
