// CustomModalBody.tsx
import { cn } from "@/lib/utils";

interface CustomModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function CustomModalBody({
  children,
  className,
  padding = "md",
}: CustomModalBodyProps) {
  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-2",
    lg: "p-2",
  };

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto w-full",
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export default CustomModalBody; // 👈 opcional, solo si lo importás como default
