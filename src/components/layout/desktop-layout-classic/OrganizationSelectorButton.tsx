import { useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { cn } from "@/lib/utils";

export function OrganizationSelectorButton() {
  const { data: userData } = useCurrentUser();
  const organizations = userData?.organizations || [];
  const memberships = userData?.memberships || [];
  const { currentOrganizationId, setCurrentOrganization } = useProjectContext();
  const [open, setOpen] = useState(false);

  const currentOrg = organizations.find(o => o.id === currentOrganizationId);
  const currentOrgName = currentOrg?.name || "Seleccionar organización";

  // Ordenar organizaciones por última actividad (last_active_at de memberships)
  const sortedOrganizations = [...organizations].sort((a, b) => {
    const membershipA = memberships.find(m => m.organization_id === a.id);
    const membershipB = memberships.find(m => m.organization_id === b.id);
    
    const dateA = membershipA?.last_active_at ? new Date(membershipA.last_active_at).getTime() : 0;
    const dateB = membershipB?.last_active_at ? new Date(membershipB.last_active_at).getTime() : 0;
    
    return dateB - dateA; // Más reciente primero
  });

  const handleOrgChange = (orgId: string) => {
    setCurrentOrganization(orgId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs gap-2"
        >
          <Building2 className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-medium" style={{ color: 'var(--main-sidebar-fg)' }}>{currentOrgName}</span>
          <ChevronDown className="h-3 w-3 opacity-60" style={{ color: 'var(--main-sidebar-fg)' }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="space-y-1">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Organizaciones</p>
          </div>
          {organizations.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">No hay organizaciones disponibles</p>
            </div>
          ) : (
            sortedOrganizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrgChange(org.id)}
                className={cn(
                  "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                  org.id === currentOrganizationId
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/5"
                )}
              >
                {org.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
