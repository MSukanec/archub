import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberCardProps {
  member: {
    id: string;
    users?: {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    };
    roles?: {
      name?: string;
    };
  };
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getRoleBadgeVariant(roleName: string) {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'default'; // Will be styled with --accent background
  if (role.includes('manager') || role.includes('editor')) return 'secondary';
  if (role.includes('viewer') || role.includes('guest')) return 'outline';
  return 'outline';
}

function getRoleBadgeClassName(roleName: string) {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  return (
    <div 
      onClick={onClick}
    >
          <AvatarImage src={member.users?.avatar_url} />
          <AvatarFallback>
            {getInitials(member.users?.full_name || member.users?.email || 'U')}
          </AvatarFallback>
        </Avatar>
        
            {member.users?.full_name || 'Sin nombre'}
          </h4>
            {member.users?.email}
          </p>
        </div>
      </div>

        <Badge 
          variant={getRoleBadgeVariant(member.roles?.name || '')}
          className={getRoleBadgeClassName(member.roles?.name || '')}
        >
          {member.roles?.name || 'Sin rol'}
        </Badge>
      </div>
    </div>
  );
}