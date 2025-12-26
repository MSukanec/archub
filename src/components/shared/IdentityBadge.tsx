import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
interface IdentityBadgeBadge {
  label: string;
  variant?: 'success'| 'error'| 'warning'| 'pending'| 'info'| 'neutral';
}
interface IdentityBadgeProps {
  /** Name of the person (user, contact, partner, etc.) */
  name: string | null | undefined;
  /** Avatar image URL */
  avatarUrl?: string | null;
  /** Linked user object with avatar_url property (for automatic avatar extraction) */
  linkedUser?: { avatar_url?: string | null } | { avatar_url?: string | null }[] | null;
  /** Size variant */
  size?: 'xs'| 'sm'| 'md'| 'lg';
  /** Layout direction */
  layout?: 'row'| 'column';
  /** Whether to show the name text */
  showName?: boolean;
  /** Optional label below the name (e.g., email, organization) */
  subLabel?: string | null;
  /** Semantic badges for roles/types (e.g., Cliente, Proveedor) */
  badges?: IdentityBadgeBadge[];
  /** Whether to apply interactive styles (hover, cursor pointer) */
  interactive?: boolean;
  /** Additional CSS classes */
  className?: string;
}
/**
 * Universal identity badge component for displaying people (users, contacts, partners, etc.)
 *
 * Features:
 * - Automatic initials generation from name
 * - Fallback to placeholder when no name
 * - Flexible sizing and layout options
 * - Professional SaaS-style appearance
 * - Accessible markup with tooltip support
 * - Visible accent border for visual identification during migration
 * - Optional semantic badges for roles/types
 * - Secondary text for disambiguation (email, organization, etc.)
 */
export function IdentityBadge({
  name,
  avatarUrl,
  linkedUser,
  size = 'md',
  layout = 'row',
  showName = true,
  subLabel,
  badges,
  interactive = false,
  className,
}: IdentityBadgeProps) {
  // Resolve avatar URL: prefer explicit avatarUrl, then linkedUser.avatar_url
  const resolveAvatarUrl = (): string | null | undefined => {
    if (avatarUrl) return avatarUrl;
    
    if (!linkedUser) return null;
    
    if (Array.isArray(linkedUser)) {
      return linkedUser[0]?.avatar_url || null;
    }
    
    return linkedUser.avatar_url || null;
  };
  const finalAvatarUrl = resolveAvatarUrl();
  // Generate initials from name
  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName || fullName.trim() === '') return '?';
    const words = fullName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0]?.[0] + words[1]?.[0]).toUpperCase();
    }
    return fullName.trim().slice(0, 2).toUpperCase();
  };
  // Check if text is truncated
  const isTruncated = (text: string | null | undefined): boolean => {
    return !!text && text.length > 30;
  };
  // Avatar size mapping
  const avatarSizeMap = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  // Text size mapping
  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };
  // Fallback size for initials
  const fallbackSizeMap = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  // Sub-label size mapping
  const subLabelSizeMap = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };
  // Badge size mapping
  const badgeSizeMap = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2 py-1 text-sm',
  };
  const initials = getInitials(name);
  const nameTruncated = isTruncated(name);
  const subLabelTruncated = isTruncated(subLabel);
  const container = cn(
    'flex gap-2',
    layout === 'column'&& 'flex-col items-center text-center',
    layout === 'row'&& 'items-center',
    interactive && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );
  const textContent = (
    <div className="flex-1 min-w-0">
      {showName && name && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className={cn('font-medium truncate', textSizeMap[size])}>
                {name}
              </div>
            </TooltipTrigger>
            {nameTruncated && (
              <TooltipContent side="top" className="text-sm">
                {name}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      {subLabel && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className={cn('text-muted-foreground truncate', subLabelSizeMap[size])}>
                {subLabel}
              </div>
            </TooltipTrigger>
            {subLabelTruncated && (
              <TooltipContent side="top" className="text-sm">
                {subLabel}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {badges.map((badge, idx) => (
            <Badge
              key={idx}
              variant={badge.variant || 'neutral'}
              className={badgeSizeMap[size]}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div className={container}>
      <Avatar
        className={cn(
          avatarSizeMap[size],
          'flex-shrink-0',
          // Visible accent border for migration tracking
          'ring-2 ring-offset-0'
        )}
        style={{
          '--tw-ring-color': 'var(--accent)',
        } as React.CSSProperties}
      >
        {finalAvatarUrl && <AvatarImage src={finalAvatarUrl} alt={name || 'User'} />}
        <AvatarFallback className={cn('font-semibold', fallbackSizeMap[size])}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && textContent}
    </div>
  );
}
export type { IdentityBadgeProps, IdentityBadgeBadge };
