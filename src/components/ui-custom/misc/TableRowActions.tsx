import { cn } from "@/lib/utils"

interface TableRowAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "primary" | "muted"
  isActive?: boolean
}

export function TableRowActions({
  actions,
  className,
}: {
  actions: TableRowAction[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 right-2 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20",
        // Fondo usando las mismas variables CSS que Cards
        "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm backdrop-blur-sm",
        "px-3 py-1 rounded-md",
        className
      )}
    >
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          title={action.label}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-sm transition-all duration-150",
            // Estados base por variante
            action.variant === "destructive" && [
              "text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            ],
            action.variant === "primary" && [
              "text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/10"
            ],
            action.variant === "muted" && [
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            ],
            // Estado default
            !action.variant && [
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            ],
            // Estado activo para favoritos (corazón rojo)
            action.isActive && action.variant === "muted" && [
              "text-red-500 hover:text-red-600"
            ]
          )}
        >
          {action.icon}
        </button>
      ))}
    </div>
  )
}