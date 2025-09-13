import { cn } from '@/lib/utils';

interface SidebarAvatarButtonProps {
  /** Avatar URL (optional) */
  avatarUrl?: string;
  /** Background color for avatar */
  backgroundColor: string;
  /** Border color */
  borderColor?: string;
  /** Letter/text to show in avatar */
  letter: string;
  /** Primary text (name) */
  primaryText?: string;
  /** Secondary text (subtitle) */
  secondaryText?: string;
  /** Whether the sidebar is expanded */
  isExpanded: boolean;
  /** Whether this button is active/selected */
  isActive?: boolean;
  /** Shape of the avatar: 'circular' for projects, 'rounded' for organization */
  shape?: 'circular' | 'rounded';
  /** Click handler */
  onClick?: () => void;
  /** Test ID */
  testId?: string;
}

export function SidebarAvatarButton({
  avatarUrl,
  backgroundColor,
  borderColor,
  letter,
  primaryText,
  secondaryText,
  isExpanded,
  isActive = false,
  shape = 'circular',
  onClick,
  testId
}: SidebarAvatarButtonProps) {
  return (
    <div
      className={cn(
        "flex items-center cursor-pointer rounded-lg p-2 justify-start",
        "hover:bg-white/10 transition-colors duration-200"
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {/* Avatar */}
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar"
            className={cn(
              "w-8 h-8 border-2 object-cover",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive && shape === 'circular' ? "border-white" : "border-white/30"
            )}
            style={{ 
              borderColor: isActive && shape === 'circular' ? 'white' : borderColor,
              transform: 'translateZ(0)'
            }}
          />
        ) : (
          <div 
            className={cn(
              "w-8 h-8 flex items-center justify-center text-white font-semibold border-2 text-sm leading-none",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive && shape === 'circular' ? "border-white" : "border-transparent"
            )}
            style={{ 
              backgroundColor,
              borderColor: isActive && shape === 'circular' ? 'white' : (shape === 'rounded' ? borderColor : 'transparent'),
              transform: 'translateZ(0)'
            }}
          >
            {letter}
          </div>
        )}
      </div>
      
      {/* Text - always rendered but animated */}
      <div className={cn(
        "ml-3 flex-1 min-w-0 leading-tight overflow-hidden transition-[max-width,opacity,transform] duration-300",
        isExpanded ? "max-w-[220px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-1"
      )}>
        {(primaryText || secondaryText) && (
          <>
            {primaryText && (
              <p className="text-sm font-semibold text-white/90 truncate leading-tight whitespace-nowrap">
                {primaryText}
              </p>
            )}
            {secondaryText && (
              <p className="text-xs text-white/60 truncate leading-tight mt-0.5 whitespace-nowrap">
                {secondaryText}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}