import { useState, useEffect } from 'react';
import { AlertCircle, Building2 } from 'lucide-react';
import { FormModalHeader } from '../modal/form/FormModalHeader';
import { FormModalFooter } from '../modal/form/FormModalFooter';
import { FormModalLayout } from '../modal/form/FormModalLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function OrganizationRemovedModal() {
  const { data: userData, isLoading } = useCurrentUser();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuthStore();

  // Check if user is in an invalid organization
  const currentOrgId = userData?.preferences?.last_organization_id;
  const availableOrgs = userData?.organizations || [];
  const isInvalidOrg = currentOrgId && !availableOrgs.some(org => org.id === currentOrgId);

  // Auto-select first organization
  useEffect(() => {
    if (isInvalidOrg && availableOrgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(availableOrgs[0].id);
    }
  }, [isInvalidOrg, availableOrgs, selectedOrgId]);

  const handleSwitch = async () => {
    if (!selectedOrgId) return;
    
    setIsSwitching(true);
    try {
      await apiRequest('POST', '/api/user/select-organization', {
        organization_id: selectedOrgId,
      });
      
      // Force a full page reload to load the new organization
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar de organización. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Don't show modal if loading or if organization is valid
  if (isLoading || !isInvalidOrg) {
    return null;
  }

  // CASE 1: User has no organizations left - Force logout
  if (availableOrgs.length === 0) {
    const editPanel = (
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-semibold">Ya no perteneces a ninguna organización</h3>
          <p className="text-sm text-muted-foreground">
            Has sido removido de todas las organizaciones. Por favor, contacta a un administrador para que te agregue nuevamente o crea una nueva organización.
          </p>
        </div>
      </div>
    );

    const headerContent = (
      <FormModalHeader 
        title="Acceso Removido"
        description="Tu membresía ha sido desactivada en todas las organizaciones"
        icon={AlertCircle}
      />
    );

    const footerContent = (
      <FormModalFooter
        onSubmit={handleLogout}
        submitText="Cerrar sesión"
        submitVariant="destructive"
      />
    );

    return (
      <FormModalLayout
        columns={1}
        viewPanel={<div></div>}
        editPanel={editPanel}
        headerContent={headerContent}
        footerContent={footerContent}
        onClose={() => {/* Cannot close */}}
        isEditing={true}
        preventEscapeClose={true}
        preventClickOutsideClose={true}
      />
    );
  }

  // CASE 2: User has other organizations available - Show selector
  const editPanel = (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b">
        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Ya no perteneces a esta organización</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Tu membresía ha sido desactivada. Selecciona otra organización para continuar.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Organizaciones disponibles</Label>
        <RadioGroup value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
          <div className="space-y-2">
            {availableOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedOrgId(org.id)}
              >
                <RadioGroupItem value={org.id} id={org.id} />
                <Label 
                  htmlFor={org.id} 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={org.logo_url || undefined} 
                      alt={org.name}
                    />
                    <AvatarFallback>
                      <Building2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{org.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {org.members_count} {org.members_count === 1 ? 'miembro' : 'miembros'}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary"
                    className="ml-auto"
                  >
                    {org.plan?.name === 'free' ? 'Gratis' : org.plan?.name === 'pro' ? 'Pro' : 'Teams'}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Cambiar de Organización"
      description="Selecciona una organización activa para continuar usando Archub"
      icon={Building2}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar sesión"
      onLeftClick={handleLogout}
      rightLabel={isSwitching ? 'Cambiando...' : 'Cambiar organización'}
      onRightClick={handleSwitch}
      submitDisabled={!selectedOrgId || isSwitching}
      showLoadingSpinner={isSwitching}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={() => {/* Cannot close */}}
      isEditing={true}
      preventEscapeClose={true}
      preventClickOutsideClose={true}
    />
  );
}
