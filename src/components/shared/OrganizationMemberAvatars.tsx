import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  avatar_url?: string;
  user?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface OrganizationMemberAvatarsProps {
  members: Member[];
}

export function OrganizationMemberAvatars({ members }: OrganizationMemberAvatarsProps) {
  if (!members || members.length === 0) return null;
  
  const displayMembers = members.slice(0, 4);
  const remainingCount = members.length > 4 ? members.length - 4 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-1">
        {displayMembers.map((member) => (
          <Avatar 
            key={member.id} 
            className="w-12 h-12 border-3 border-[var(--card-bg)] avatar-border"
          >
            {member.avatar_url ? (
              <AvatarImage src={member.avatar_url} alt="Avatar" />
            ) : (
              <AvatarFallback className="text-base font-semibold">
                {member.user?.full_name
                  ? member.user.full_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : member.user?.first_name && member.user?.last_name
                    ? (member.user.first_name[0] + member.user.last_name[0]).toUpperCase()
                    : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        ))}
      </div>
      {remainingCount > 0 && (
        <div className="text-lg font-semibold text-muted-foreground">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}