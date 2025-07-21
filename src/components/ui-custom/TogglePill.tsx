import { cn } from "@/lib/utils"

interface TogglePillProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function TogglePill({ 
  checked, 
  onCheckedChange, 
  children, 
  disabled = false,
  className 
}: TogglePillProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium",
        "transition-all duration-200 ease-in-out",
        "border border-border",
        "cursor-pointer select-none",
        
        // States
        checked 
          ? "bg-[hsl(var(--accent))] text-accent-foreground border-[hsl(var(--accent))]" 
          : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed",
        
        // Focus styles
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        
        className
      )}
    >
      {children}
    </button>
  )
}