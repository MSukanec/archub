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
      className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={member.users?.avatar_url} />
          <AvatarFallback>
            {getInitials(member.users?.full_name || member.users?.email || 'U')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {member.users?.full_name || 'Sin nombre'}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {member.users?.email}
          </p>
        </div>
      </div>

      <div className="shrink-0 ml-3">
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