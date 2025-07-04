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
        // Fondo difuminado estilo Gmail
        "bg-gradient-to-l from-background via-background/95 to-background/80 backdrop-blur-sm",
        "px-3 py-1 rounded-md shadow-sm border border-border/50",
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
              "text-primary/70 hover:text-primary hover:bg-primary/10"
            ],
            action.variant === "muted" && [
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            ],
            // Estado default
            !action.variant && [
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            ],
            // Estado activo para favoritos
            action.isActive && action.variant === "primary" && [
              "text-primary bg-primary/15"
            ],
            action.isActive && action.variant === "muted" && [
              "text-yellow-600 bg-yellow-100/50"
            ]
          )}
        >
          {action.icon}
        </button>
      ))}
    </div>
  )
}