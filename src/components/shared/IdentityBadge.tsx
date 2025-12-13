import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IdentityBadgeProps {
  /** Name of the person (user, contact, partner, etc.) */
  name: string | null | undefined;
  /** Avatar image URL */
  avatarUrl?: string | null;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Layout direction */
  layout?: 'row' | 'column';
  /** Whether to show the name text */
  showName?: boolean;
  /** Optional label below the name */
  subLabel?: string | null;
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
 * - Accessible markup
 * - Visible accent border for visual identification during migration
 */
export function IdentityBadge({
  name,
  avatarUrl,
  size = 'md',
  layout = 'row',
  showName = true,
  subLabel,
  interactive = false,
  className,
}: IdentityBadgeProps) {
  // Generate initials from name
  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const words = fullName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0]?.[0] + words[1]?.[0]).toUpperCase();
    }
    return fullName.trim().slice(0, 2).toUpperCase();
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

  const initials = getInitials(name);

  const container = cn(
    'flex gap-2',
    layout === 'column' && 'flex-col items-center text-center',
    layout === 'row' && 'items-center',
    interactive && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  const textContent = (
    <div className="flex-1 min-w-0">
      {showName && name && (
        <div className={cn('font-medium truncate', textSizeMap[size])}>
          {name}
        </div>
      )}
      {subLabel && (
        <div className={cn('text-muted-foreground truncate', subLabelSizeMap[size])}>
          {subLabel}
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
          'ring-2 ring-offset-0 ring-primary/60'
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name || 'User'} />}
        <AvatarFallback className={cn('font-semibold', fallbackSizeMap[size])}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {showName && textContent}
    </div>
  );
}

export type { IdentityBadgeProps };
