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
  isActive = false,
  shape = 'circular',
  onClick,
  testId
}: SidebarAvatarButtonProps) {
  return (
    <div
      className="flex items-center justify-center cursor-pointer p-2"
      onClick={onClick}
      data-testid={testId}
    >
      {/* Avatar - Static, no expansion */}
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar"
            className={cn(
              "w-8 h-8 border-2 object-cover",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive ? "border-white" : "border-transparent"
            )}
            style={{ 
              borderColor: isActive ? 'white' : 'transparent',
              transform: 'translateZ(0)'
            }}
          />
        ) : (
          <div 
            className={cn(
              "w-8 h-8 flex items-center justify-center text-white font-semibold border-2 text-sm leading-none",
              shape === 'circular' ? "rounded-full" : "rounded-lg",
              isActive ? "border-white" : "border-transparent"
            )}
            style={{ 
              backgroundColor,
              borderColor: isActive ? 'white' : 'transparent',
              transform: 'translateZ(0)'
            }}
          >
            {letter}
          </div>
        )}
      </div>
    </div>
  );
}