// src/components/modal/form/FormModalBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormModalBodyProps {
  children: ReactNode;
  columns?: number;
  className?: string;
}

export default function FormModalBody({ children, columns = 2, className }: FormModalBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={cn(
        "gap-6 text-sm",
        className?.includes("p-0") ? "" : "p-2",
        columns === 1 ? "flex flex-col space-y-6" : "grid grid-cols-1 lg:grid-cols-2",
        className
      )}>
        {children}
      </div>
    </div>
  );
}