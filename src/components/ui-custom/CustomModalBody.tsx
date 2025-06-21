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
    sm: "p-3",
    md: "p-3",
    lg: "p-3",
  };

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        paddingClasses[padding],
        className,
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export default CustomModalBody; // 👈 opcional, solo si lo importás como default
