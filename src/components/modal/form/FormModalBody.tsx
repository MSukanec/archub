// src/components/modal/form/FormModalBody.tsx

import { ReactNode } from "react";

interface FormModalBodyProps {
  children: ReactNode;
}

export default function FormModalBody({ children }: FormModalBodyProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto text-sm">
      {children}
    </div>
  );
}