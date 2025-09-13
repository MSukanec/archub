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
        "flex items-center cursor-pointer transition-all duration-200 rounded-lg p-2",
        "hover:bg-white/10",
        isExpanded ? "justify-start" : "justify-center"
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 flex justify-center">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar"
            className={cn(
              "w-8 h-8 border-2 text-sm",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive && shape === 'circular' ? "border-white" : "border-white/30"
            )}
            style={{ borderColor: isActive && shape === 'circular' ? 'white' : borderColor }}
          />
        ) : (
          <div 
            className={cn(
              "w-8 h-8 flex items-center justify-center text-white font-semibold border-2 text-sm",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive && shape === 'circular' ? "border-white" : "border-transparent"
            )}
            style={{ 
              backgroundColor,
              borderColor: isActive && shape === 'circular' ? 'white' : (shape === 'rounded' ? borderColor : 'transparent')
            }}
          >
            {letter}
          </div>
        )}
      </div>
      
      {/* Text - only when expanded */}
      {isExpanded && (primaryText || secondaryText) && (
        <div className="ml-3 flex-1 min-w-0 leading-tight">
          {primaryText && (
            <p className="text-sm font-semibold text-white/90 truncate leading-tight">
              {primaryText}
            </p>
          )}
          {secondaryText && (
            <p className="text-xs text-white/60 truncate leading-tight -mt-0.5">
              {secondaryText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}