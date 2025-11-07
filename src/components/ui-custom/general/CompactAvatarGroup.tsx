import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  avatar_url?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

interface CompactAvatarGroupProps {
  members: Member[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function CompactAvatarGroup({ 
  members, 
  maxDisplay = 4,
  size = 'md' 
}: CompactAvatarGroupProps) {
  if (!members || members.length === 0) return null;
  
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length > maxDisplay ? members.length - maxDisplay : 0;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = (member: Member) => {
    if (member.full_name) {
      return member.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (member.first_name && member.last_name) {
      return (member.first_name[0] + member.last_name[0]).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex items-center -space-x-2">
      {displayMembers.map((member) => (
        <Avatar 
          key={member.id} 
          className={`${sizeClasses[size]} border-2 border-background`}
        >
          {member.avatar_url ? (
            <AvatarImage src={member.avatar_url} alt={member.full_name || 'Avatar'} />
          ) : (
            <AvatarFallback className="font-semibold">
              {getInitials(member)}
            </AvatarFallback>
          )}
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div 
          className={`${sizeClasses[size]} rounded-full border-2 border-background bg-muted flex items-center justify-center font-semibold text-muted-foreground`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
