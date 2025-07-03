// CustomModalBody.tsx
import { cn } from "@/lib/utils";

interface CustomModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  columns?: 1 | 2;
}

export function CustomModalBody({
  children,
  className,
  padding = "md",
  columns = 2,
}: CustomModalBodyProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-3",
    lg: "p-3",
  };

  const gridCols = columns === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto w-full min-h-0",
        paddingClasses[padding],
        className,
      )}
    >
      <div className={cn("grid gap-4", gridCols)}>
        {children}
      </div>
    </div>
  );
}

export default CustomModalBody; // 👈 opcional, solo si lo importás como default
