import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, Info, XCircle, Play, Check, Pause, X, Calendar, Award, TrendingUp, TrendingDown, Scale } from 'lucide-react'
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
  | 'organization-founder'
  | 'capital-over'
  | 'capital-under'
  | 'capital-equal'
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
  'organization-founder': 'var(--plan-teams)',
  'capital-over': 'var(--capital-badge-over)',
  'capital-under': 'var(--capital-badge-under)',
  'capital-equal': 'var(--capital-badge-equal)',
}
/**
 * Mapping of variants to their fixed icons
 * Each variant always displays its associated icon
 * Use null for variants that should NOT display an icon
 */
const variantIcons: Record<BadgeVariant, React.ReactNode | null> = {
  success: <CheckCircle2 className="w-3.5 h-3.5" />,
  error: <XCircle className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  pending: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
  neutral: null,
  'plan-pro': <CheckCircle2 className="w-3.5 h-3.5" />,
  'plan-free': <CheckCircle2 className="w-3.5 h-3.5" />,
  'plan-teams': <CheckCircle2 className="w-3.5 h-3.5" />,
  'plan-enterprise': <CheckCircle2 className="w-3.5 h-3.5" />,
  'status-active': <Play className="w-3.5 h-3.5" />,
  'status-completed': <Check className="w-3.5 h-3.5" />,
  'status-paused': <Pause className="w-3.5 h-3.5" />,
  'status-cancelled': <X className="w-3.5 h-3.5" />,
  'status-planning': <Calendar className="w-3.5 h-3.5" />,
  'organization-founder': <Award className="w-3.5 h-3.5" />,
  'capital-over': <TrendingUp className="w-3.5 h-3.5" />,
  'capital-under': <TrendingDown className="w-3.5 h-3.5" />,
  'capital-equal': <Scale className="w-3.5 h-3.5" />,
}
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
  {
    variants: {
      variant: {
        success: "",
        error: "",
        warning: "",
        pending: "",
        info: "",
        neutral: "",
        "plan-pro": "",
        "plan-free": "",
        "plan-teams": "",
        "plan-enterprise": "",
        "status-active": "",
        "status-completed": "",
        "status-paused": "",
        "status-cancelled": "",
        "status-planning": "",
        "organization-founder": "",
        "capital-over": "",
        "capital-under": "",
        "capital-equal": "",
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
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
  'organization-founder': {
    borderColor: 'var(--plan-teams)',
    backgroundColor: 'color-mix(in srgb, var(--plan-teams) 10%, transparent)',
    color: 'var(--plan-teams)',
  },
  'capital-over': {
    borderColor: 'var(--capital-badge-over)',
    backgroundColor: 'color-mix(in srgb, var(--capital-badge-over) 10%, transparent)',
    color: 'var(--capital-badge-over)',
  },
  'capital-under': {
    borderColor: 'var(--capital-badge-under)',
    backgroundColor: 'color-mix(in srgb, var(--capital-badge-under) 10%, transparent)',
    color: 'var(--capital-badge-under)',
  },
  'capital-equal': {
    borderColor: 'var(--capital-badge-equal)',
    backgroundColor: 'color-mix(in srgb, var(--capital-badge-equal) 10%, transparent)',
    color: 'var(--capital-badge-equal)',
  },
}
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  variant?: BadgeVariant;
}
function Badge({ className, variant = 'neutral', children, style, ...props }: BadgeProps) {
  const variantStyle = variantStyles[variant as BadgeVariant] || variantStyles.neutral
  const icon = variantIcons[variant as BadgeVariant]
  
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
