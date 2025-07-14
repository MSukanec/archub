// src/components/modal/form/FormModalBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormModalBodyProps {
  children: ReactNode;
  columns?: number;
}

export default function FormModalBody({ children, columns = 2 }: FormModalBodyProps) {
  return (
    <div className={cn(
      "gap-2 p-2 overflow-y-auto text-sm",
      columns === 1 ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2"
    )}>
      {children}
    </div>
  );
}