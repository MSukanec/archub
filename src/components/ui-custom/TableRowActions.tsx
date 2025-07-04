import { cn } from "@/lib/utils"

interface TableRowAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "primary" | "muted"
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
        "absolute top-1/2 -translate-y-1/2 right-2 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition z-10",
        className
      )}
    >
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          title={action.label}
          className={cn(
            "w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition",
            action.variant === "destructive" && "text-destructive hover:text-red-600",
            action.variant === "primary" && "text-primary hover:text-blue-600"
          )}
        >
          {action.icon}
        </button>
      ))}
    </div>
  )
}