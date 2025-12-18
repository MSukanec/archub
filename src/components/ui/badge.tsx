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
  | 'plan_pro'
  | 'plan_free'
  | 'status_active'
  | 'status_completed'
  | 'status_paused'
  | 'status_cancelled'
  | 'status_planning'

/**
 * Mapping of variants to their semantic color variables
 * Single color per variant - badge handles opacity internally
 */
const BADGE_VARIANT_MAP: Record<BadgeVariant, string> = {
  success: 'var(--semantic-badge-success)',
  error: 'var(--semantic-badge-error)',
  warning: 'var(--semantic-badge-warning)',
  pending: 'var(--semantic-badge-pending)',
  info: 'var(--semantic-badge-info)',
  neutral: 'var(--semantic-badge-neutral)',
  plan_pro: 'var(--semantic-badge-plan-pro)',
  plan_free: 'var(--semantic-badge-plan-free)',
  status_active: 'var(--semantic-badge-status-active)',
  status_completed: 'var(--semantic-badge-status-completed)',
  status_paused: 'var(--semantic-badge-status-paused)',
  status_cancelled: 'var(--semantic-badge-status-cancelled)',
  status_planning: 'var(--semantic-badge-status-planning)',
}

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "border border-[color:var(--semantic-badge-success)] bg-[color:var(--semantic-badge-success)]/10 text-[color:var(--semantic-badge-success)] hover:bg-[color:var(--semantic-badge-success)]/15",
        error: "border border-[color:var(--semantic-badge-error)] bg-[color:var(--semantic-badge-error)]/10 text-[color:var(--semantic-badge-error)] hover:bg-[color:var(--semantic-badge-error)]/15",
        warning: "border border-[color:var(--semantic-badge-warning)] bg-[color:var(--semantic-badge-warning)]/10 text-[color:var(--semantic-badge-warning)] hover:bg-[color:var(--semantic-badge-warning)]/15",
        pending: "border border-[color:var(--semantic-badge-pending)] bg-[color:var(--semantic-badge-pending)]/10 text-[color:var(--semantic-badge-pending)] hover:bg-[color:var(--semantic-badge-pending)]/15",
        info: "border border-[color:var(--semantic-badge-info)] bg-[color:var(--semantic-badge-info)]/10 text-[color:var(--semantic-badge-info)] hover:bg-[color:var(--semantic-badge-info)]/15",
        neutral: "border border-[color:var(--semantic-badge-neutral)] bg-[color:var(--semantic-badge-neutral)]/10 text-[color:var(--semantic-badge-neutral)] hover:bg-[color:var(--semantic-badge-neutral)]/15",
        plan_pro: "border border-[color:var(--semantic-badge-plan-pro)] bg-[color:var(--semantic-badge-plan-pro)]/10 text-[color:var(--semantic-badge-plan-pro)] hover:bg-[color:var(--semantic-badge-plan-pro)]/15",
        plan_free: "border border-[color:var(--semantic-badge-plan-free)] bg-[color:var(--semantic-badge-plan-free)]/10 text-[color:var(--semantic-badge-plan-free)] hover:bg-[color:var(--semantic-badge-plan-free)]/15",
        status_active: "border border-[color:var(--semantic-badge-status-active)] bg-[color:var(--semantic-badge-status-active)]/10 text-[color:var(--semantic-badge-status-active)] hover:bg-[color:var(--semantic-badge-status-active)]/15",
        status_completed: "border border-[color:var(--semantic-badge-status-completed)] bg-[color:var(--semantic-badge-status-completed)]/10 text-[color:var(--semantic-badge-status-completed)] hover:bg-[color:var(--semantic-badge-status-completed)]/15",
        status_paused: "border border-[color:var(--semantic-badge-status-paused)] bg-[color:var(--semantic-badge-status-paused)]/10 text-[color:var(--semantic-badge-status-paused)] hover:bg-[color:var(--semantic-badge-status-paused)]/15",
        status_cancelled: "border border-[color:var(--semantic-badge-status-cancelled)] bg-[color:var(--semantic-badge-status-cancelled)]/10 text-[color:var(--semantic-badge-status-cancelled)] hover:bg-[color:var(--semantic-badge-status-cancelled)]/15",
        status_planning: "border border-[color:var(--semantic-badge-status-planning)] bg-[color:var(--semantic-badge-status-planning)]/10 text-[color:var(--semantic-badge-status-planning)] hover:bg-[color:var(--semantic-badge-status-planning)]/15",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants, BADGE_VARIANT_MAP }
