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
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border"
)

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    borderColor: 'var(--success)',
    backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)',
    color: 'var(--success)',
  },
  error: {
    borderColor: 'var(--error)',
    backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
    color: 'var(--error)',
  },
  warning: {
    borderColor: 'var(--warning)',
    backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
    color: 'var(--warning)',
  },
  pending: {
    borderColor: 'var(--pending)',
    backgroundColor: 'color-mix(in srgb, var(--pending) 10%, transparent)',
    color: 'var(--pending)',
  },
  info: {
    borderColor: 'var(--info)',
    backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)',
    color: 'var(--info)',
  },
  neutral: {
    borderColor: 'var(--neutral)',
    backgroundColor: 'color-mix(in srgb, var(--neutral) 10%, transparent)',
    color: 'var(--neutral)',
  },
  'plan-pro': {
    borderColor: 'var(--plan-pro)',
    backgroundColor: 'color-mix(in srgb, var(--plan-pro) 10%, transparent)',
    color: 'var(--plan-pro)',
  },
  'plan-free': {
    borderColor: 'var(--plan-free)',
    backgroundColor: 'color-mix(in srgb, var(--plan-free) 10%, transparent)',
    color: 'var(--plan-free)',
  },
  'plan-teams': {
    borderColor: 'var(--plan-teams)',
    backgroundColor: 'color-mix(in srgb, var(--plan-teams) 10%, transparent)',
    color: 'var(--plan-teams)',
  },
  'plan-enterprise': {
    borderColor: 'var(--plan-enterprise)',
    backgroundColor: 'color-mix(in srgb, var(--plan-enterprise) 10%, transparent)',
    color: 'var(--plan-enterprise)',
  },
  'status-active': {
    borderColor: 'var(--status-active)',
    backgroundColor: 'color-mix(in srgb, var(--status-active) 10%, transparent)',
    color: 'var(--status-active)',
  },
  'status-completed': {
    borderColor: 'var(--status-completed)',
    backgroundColor: 'color-mix(in srgb, var(--status-completed) 10%, transparent)',
    color: 'var(--status-completed)',
  },
  'status-paused': {
    borderColor: 'var(--status-paused)',
    backgroundColor: 'color-mix(in srgb, var(--status-paused) 10%, transparent)',
    color: 'var(--status-paused)',
  },
  'status-cancelled': {
    borderColor: 'var(--status-cancelled)',
    backgroundColor: 'color-mix(in srgb, var(--status-cancelled) 10%, transparent)',
    color: 'var(--status-cancelled)',
  },
  'status-planning': {
    borderColor: 'var(--status-planning)',
    backgroundColor: 'color-mix(in srgb, var(--status-planning) 10%, transparent)',
    color: 'var(--status-planning)',
  },
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant = 'neutral', icon, children, style, ...props }: BadgeProps) {
  const variantStyle = variantStyles[variant as BadgeVariant] || variantStyles.neutral
  
  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants, BADGE_VARIANT_MAP }
