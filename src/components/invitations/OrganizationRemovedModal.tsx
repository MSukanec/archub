import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';

export function OrganizationRemovedModal() {
  const { data: userData, isLoading } = useCurrentUser();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuthStore();

  // Check if user is in an invalid organization
  const currentOrgId = userData?.preferences?.last_organization_id;
  const availableOrgs = userData?.organizations || [];
  
  const isInvalidOrg = currentOrgId && !availableOrgs.some((org: any) => org.id === currentOrgId);

  // Auto-select first available org
  useEffect(() => {
    if (isInvalidOrg && availableOrgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(availableOrgs[0].id);
    }
  }, [isInvalidOrg, availableOrgs, selectedOrgId]);

  const handleSwitchOrganization = async () => {
    if (!selectedOrgId || !userData?.user?.id) return;

    setIsSwitching(true);
    try {
      const response = await apiRequest('POST', '/api/user/select-organization', {
        organization_id: selectedOrgId,
      });

      if (!response.ok) {
        throw new Error('Failed to switch organization');
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.refetchQueries({ queryKey: ['current-user'] });

      toast({
        title: 'Organización cambiada',
        description: 'Has sido redirigido a otra organización',
      });

      // Force page reload to refresh all data
      window.location.href = '/home';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar de organización',
        variant: 'destructive',
      });
      setIsSwitching(false);
    }
  };

  // Don't show modal if loading or if organization is valid
  if (isLoading || !isInvalidOrg) {
    return null;
  }

  // Handle case where user has no organizations left
  if (availableOrgs.length === 0) {
    return (
      <Dialog open={true} onOpenChange={() => {/* Cannot close */}}>
        <DialogContent 
          className="sm:max-w-[500px]" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Ya no perteneces a ninguna organización</DialogTitle>
            <DialogDescription>Has sido removido de todas las organizaciones</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            {/* Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Ya no perteneces a ninguna organización</h2>
              <p className="text-muted-foreground">
                Has sido removido de todas las organizaciones. Por favor, contacta a un administrador o crea una nueva organización.
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={async () => {
                // Sign out the user using auth store
                await logout();
              }}
              className="w-full mt-4"
              size="lg"
              data-testid="button-sign-out"
            >
              Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => {/* Cannot close */}}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Ya no perteneces a esta organización</DialogTitle>
          <DialogDescription>Selecciona otra organización para continuar</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Ya no perteneces a esta organización</h2>
            <p className="text-muted-foreground">
              Un administrador te ha removido de la organización. Por favor, selecciona otra organización para continuar.
            </p>
          </div>

          {/* Organization Selector */}
          <div className="w-full space-y-3 pt-4">
            <p className="text-sm font-medium text-left">Selecciona una organización:</p>
            <div className="space-y-2">
              {availableOrgs.map((org: any) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  data-testid={`organization-option-${org.id}`}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${selectedOrgId === org.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'border-border hover:border-[var(--accent)]/50 hover:bg-accent/5'
                    }
                  `}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={org.logo_url || undefined} />
                    <AvatarFallback>
                      <Building2 className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.plan?.name || 'Plan Free'}
                    </p>
                  </div>
                  {selectedOrgId === org.id && (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSwitchOrganization}
            disabled={!selectedOrgId || isSwitching}
            className="w-full mt-4"
            size="lg"
            data-testid="button-switch-organization"
          >
            {isSwitching ? 'Cambiando...' : 'Continuar con esta organización'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
