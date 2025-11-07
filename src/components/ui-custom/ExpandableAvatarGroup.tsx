import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { cn } from "@/lib/utils";

interface ExpandableAvatarGroupProps {
  organizationId?: string;
  maxCollapsed?: number;
  className?: string;
}

export function ExpandableAvatarGroup({ 
  organizationId,
  maxCollapsed = 4,
  className 
}: ExpandableAvatarGroupProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [, setLocation] = useLocation();
  const { data: members = [], isLoading } = useOrganizationMembers(organizationId);

  if (isLoading || !members.length) {
    return null;
  }

  const visibleMembers = members.slice(0, maxCollapsed);
  const remainingCount = Math.max(0, members.length - maxCollapsed);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapsed State */}
      <div 
        className={cn(
          "flex items-center transition-all duration-300",
          isHovered && "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center -space-x-2">
          {visibleMembers.map((member, index) => (
            <Avatar 
              key={member.id}
              className="h-8 w-8"
              style={{ zIndex: visibleMembers.length - index }}
            >
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
              <AvatarFallback className="text-xs bg-[var(--accent)] text-white">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <div 
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
              style={{ zIndex: 0 }}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </div>

      {/* Expanded State */}
      <div
        className={cn(
          "absolute right-0 top-0 bg-white dark:bg-[var(--main-sidebar-bg)] rounded-2xl shadow-xl border border-border p-4 transition-all duration-300 z-50",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{ minWidth: "280px" }}
      >
        <div className="grid grid-cols-4 gap-4 mb-4">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-1.5">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar_url} alt={member.full_name} />
                <AvatarFallback className="text-xs bg-[var(--accent)] text-white">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-center text-foreground truncate w-full px-1">
                {member.full_name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        
        <Button
          variant="default"
          size="sm"
          className="w-full bg-foreground hover:bg-foreground/90 text-background"
          onClick={() => setLocation("/organization/preferences?tab=miembros")}
          data-testid="button-view-members"
        >
          <Users className="h-4 w-4 mr-2" />
          Ver Miembros
        </Button>
      </div>
    </div>
  );
}
