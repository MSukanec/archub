import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Shield, ShieldAlert, Loader2, Save, AlertTriangle, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

interface Permission {
  id: string;
  key: string;
  description: string;
  category: string;
  is_system: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_system: boolean;
  permissionIds: string[];
}

interface RolesPermissionsData {
  roles: Role[];
  permissions: Permission[];
  permissionsByCategory: Record<string, Permission[]>;
}

const CATEGORY_LABELS: Record<string, string> = {
  'projects': 'Proyectos',
  'members': 'Miembros',
  'finances': 'Finanzas',
  'clients': 'Clientes',
  'contacts': 'Contactos',
  'materials': 'Materiales',
  'personnel': 'Personal',
  'subcontracts': 'Subcontratos',
  'sitelog': 'Bitácora',
  'media': 'Media',
  'settings': 'Configuración',
  'organization': 'Organización',
  'roles': 'Roles',
  'capital': 'Capital',
  'budgets': 'Presupuestos',
  'analysis': 'Análisis',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toLowerCase()] || category;
}

function isAdminRole(roleName: string): boolean {
  return roleName.toLowerCase().includes('admin');
}

export function PermissionsTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const canManageRoles = userData?.role?.permissions?.some(
    (p: { key: string }) => p.key === 'roles.manage'
  ) || userData?.role?.name?.toLowerCase().includes('admin');
  
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<RolesPermissionsData>({
    queryKey: [`/api/organizations/${organizationId}/roles-permissions`],
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (data?.roles && !selectedRoleId) {
      const nonAdminRole = data.roles.find(r => !isAdminRole(r.name));
      if (nonAdminRole) {
        setSelectedRoleId(nonAdminRole.id);
      } else if (data.roles.length > 0) {
        setSelectedRoleId(data.roles[0].id);
      }
    }
  }, [data?.roles, selectedRoleId]);

  useEffect(() => {
    if (data?.roles) {
      const permMap: Record<string, string[]> = {};
      for (const role of data.roles) {
        permMap[role.id] = [...role.permissionIds];
      }
      setLocalPermissions(permMap);
    }
  }, [data?.roles]);

  useEffect(() => {
    if (data?.permissionsByCategory) {
      setExpandedCategories(new Set(Object.keys(data.permissionsByCategory)));
    }
  }, [data?.permissionsByCategory]);

  const selectedRole = useMemo(() => {
    return data?.roles?.find(r => r.id === selectedRoleId) || null;
  }, [data?.roles, selectedRoleId]);

  const isAdmin = selectedRole ? isAdminRole(selectedRole.name) : false;

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return apiRequest('PUT', `/api/roles/${roleId}/permissions`, { permissionIds, organizationId });
    },
    onSuccess: () => {
      toast({
        title: 'Permisos actualizados',
        description: 'Los cambios se han guardado correctamente.',
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/roles-permissions`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    },
  });

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRoleId || isAdmin || !canManageRoles) return;

    setLocalPermissions(prev => {
      const current = prev[selectedRoleId] || [];
      const updated = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      
      return { ...prev, [selectedRoleId]: updated };
    });
    setHasChanges(true);
  };

  const handleCategoryToggle = (category: string, permissions: Permission[]) => {
    if (!selectedRoleId || isAdmin || !canManageRoles) return;

    const permissionIdsInCategory = permissions.map(p => p.id);
    const currentPermissions = localPermissions[selectedRoleId] || [];
    const allSelected = permissionIdsInCategory.every(id => currentPermissions.includes(id));

    setLocalPermissions(prev => {
      const current = prev[selectedRoleId] || [];
      let updated: string[];

      if (allSelected) {
        updated = current.filter(id => !permissionIdsInCategory.includes(id));
      } else {
        updated = Array.from(new Set([...current, ...permissionIdsInCategory]));
      }

      return { ...prev, [selectedRoleId]: updated };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: localPermissions[selectedRoleId] || [],
    });
  };

  const handleRoleSelect = (roleId: string) => {
    if (hasChanges) {
      const confirm = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?');
      if (!confirm) return;
    }
    setSelectedRoleId(roleId);
    setHasChanges(false);
    if (data?.roles) {
      const role = data.roles.find(r => r.id === roleId);
      if (role) {
        setLocalPermissions(prev => ({
          ...prev,
          [roleId]: [...role.permissionIds],
        }));
      }
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudieron cargar los roles y permisos.</AlertDescription>
      </Alert>
    );
  }

  const currentPermissions = selectedRoleId ? (localPermissions[selectedRoleId] || []) : [];

  return (
    <div className="space-y-6" data-testid="permissions-tab">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Gestión de permisos</AlertTitle>
        <AlertDescription>
          Los cambios de permisos afectan a todos los miembros con el rol seleccionado.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Roles</h3>
          {data?.roles?.map((role) => {
            const isSelected = role.id === selectedRoleId;
            const roleIsAdmin = isAdminRole(role.name);
            
            return (
              <Card
                key={role.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => handleRoleSelect(role.id)}
                data-testid={`role-card-${role.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      roleIsAdmin ? "bg-amber-500/10" : "bg-muted"
                    )}>
                      {roleIsAdmin ? (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selectedRole && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Permisos de {selectedRole.name}
                  </h3>
                  {isAdmin && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Lock className="h-3 w-3" />
                      Este rol tiene acceso total por defecto
                    </p>
                  )}
                </div>
                {!isAdmin && hasChanges && canManageRoles && (
                  <Button
                    onClick={handleSave}
                    disabled={updatePermissionsMutation.isPending}
                    data-testid="button-save-permissions"
                  >
                    {updatePermissionsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                )}
              </div>

              {isAdmin && (
                <Alert className="bg-amber-500/10 border-amber-500/20">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    El rol Administrador tiene todos los permisos habilitados y no se puede modificar.
                  </AlertDescription>
                </Alert>
              )}

              {!canManageRoles && !isAdmin && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    No tienes permisos para modificar los roles. Contacta a un administrador.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {Object.entries(data?.permissionsByCategory || {}).map(([category, permissions]) => {
                  const isExpanded = expandedCategories.has(category);
                  const selectedCount = permissions.filter(p => 
                    isAdmin || currentPermissions.includes(p.id)
                  ).length;
                  const allSelected = selectedCount === permissions.length;
                  const someSelected = selectedCount > 0 && selectedCount < permissions.length;

                  return (
                    <Card key={category} data-testid={`category-card-${category}`}>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 cursor-pointer flex-1">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <CardTitle className="text-sm font-medium">
                                  {getCategoryLabel(category)}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCount}/{permissions.length}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            {!isAdmin && canManageRoles && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={() => handleCategoryToggle(category, permissions)}
                                  className={cn(someSelected && "opacity-50")}
                                  data-testid={`checkbox-category-${category}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  Todos
                                </span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CollapsibleContent>
                          <Separator />
                          <CardContent className="py-3 px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {permissions.map((permission) => {
                                const isChecked = isAdmin || currentPermissions.includes(permission.id);
                                
                                return (
                                  <div
                                    key={permission.id}
                                    className={cn(
                                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                      (isAdmin || !canManageRoles) ? "opacity-60 bg-muted/30" : "hover:bg-muted/50",
                                      isChecked && !isAdmin && canManageRoles && "border-primary/30 bg-primary/5"
                                    )}
                                    data-testid={`permission-item-${permission.id}`}
                                  >
                                    <Checkbox
                                      id={permission.id}
                                      checked={isChecked}
                                      disabled={isAdmin || !canManageRoles}
                                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                                      className="mt-0.5"
                                      data-testid={`checkbox-permission-${permission.id}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label
                                        htmlFor={permission.id}
                                        className={cn(
                                          "text-sm font-medium cursor-pointer block",
                                          (isAdmin || !canManageRoles) && "cursor-default"
                                        )}
                                      >
                                        {permission.key.split('.').pop()?.replace(/_/g, ' ')}
                                      </label>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
