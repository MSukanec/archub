import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * SEMANTIC BADGE VARIANTS
 * Each variant maps to a single color variable defined in index.css
 * Badge automatically applies 100% opacity to content and reduced opacity to background
 */
export type BadgeVariant = 
  | 'success'
  | 'error'
  | 'warning'
  | 'pending'
  | 'info'
  | 'neutral'
  | 'plan-pro'
  | 'plan-free'
  | 'plan-teams'
  | 'plan-enterprise'
  | 'status-active'
  | 'status-completed'
  | 'status-paused'
  | 'status-cancelled'
  | 'status-planning'

/**
 * Mapping of variants to their semantic color variables
 * Single color per variant - badge handles opacity internally
 */
const BADGE_VARIANT_MAP: Record<BadgeVariant, string> = {
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)',
  pending: 'var(--pending)',
  info: 'var(--info)',
  neutral: 'var(--neutral)',
  'plan-pro': 'var(--plan-pro)',
  'plan-free': 'var(--plan-free)',
  'plan-teams': 'var(--plan-teams)',
  'plan-enterprise': 'var(--plan-enterprise)',
  'status-active': 'var(--status-active)',
  'status-completed': 'var(--status-completed)',
  'status-paused': 'var(--status-paused)',
  'status-cancelled': 'var(--status-cancelled)',
  'status-planning': 'var(--status-planning)',
}

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "border border-[color:var(--success)] bg-[color:var(--success)]/10 text-[color:var(--success)] hover:bg-[color:var(--success)]/15",
        error: "border border-[color:var(--error)] bg-[color:var(--error)]/10 text-[color:var(--error)] hover:bg-[color:var(--error)]/15",
        warning: "border border-[color:var(--warning)] bg-[color:var(--warning)]/10 text-[color:var(--warning)] hover:bg-[color:var(--warning)]/15",
        pending: "border border-[color:var(--pending)] bg-[color:var(--pending)]/10 text-[color:var(--pending)] hover:bg-[color:var(--pending)]/15",
        info: "border border-[color:var(--info)] bg-[color:var(--info)]/10 text-[color:var(--info)] hover:bg-[color:var(--info)]/15",
        neutral: "border border-[color:var(--neutral)] bg-[color:var(--neutral)]/10 text-[color:var(--neutral)] hover:bg-[color:var(--neutral)]/15",
        "plan-pro": "border border-[color:var(--plan-pro)] bg-[color:var(--plan-pro)]/10 text-[color:var(--plan-pro)] hover:bg-[color:var(--plan-pro)]/15",
        "plan-free": "border border-[color:var(--plan-free)] bg-[color:var(--plan-free)]/10 text-[color:var(--plan-free)] hover:bg-[color:var(--plan-free)]/15",
        "plan-teams": "border border-[color:var(--plan-teams)] bg-[color:var(--plan-teams)]/10 text-[color:var(--plan-teams)] hover:bg-[color:var(--plan-teams)]/15",
        "plan-enterprise": "border border-[color:var(--plan-enterprise)] bg-[color:var(--plan-enterprise)]/10 text-[color:var(--plan-enterprise)] hover:bg-[color:var(--plan-enterprise)]/15",
        "status-active": "border border-[color:var(--status-active)] bg-[color:var(--status-active)]/10 text-[color:var(--status-active)] hover:bg-[color:var(--status-active)]/15",
        "status-completed": "border border-[color:var(--status-completed)] bg-[color:var(--status-completed)]/10 text-[color:var(--status-completed)] hover:bg-[color:var(--status-completed)]/15",
        "status-paused": "border border-[color:var(--status-paused)] bg-[color:var(--status-paused)]/10 text-[color:var(--status-paused)] hover:bg-[color:var(--status-paused)]/15",
        "status-cancelled": "border border-[color:var(--status-cancelled)] bg-[color:var(--status-cancelled)]/10 text-[color:var(--status-cancelled)] hover:bg-[color:var(--status-cancelled)]/15",
        "status-planning": "border border-[color:var(--status-planning)] bg-[color:var(--status-planning)]/10 text-[color:var(--status-planning)] hover:bg-[color:var(--status-planning)]/15",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants, BADGE_VARIANT_MAP }
