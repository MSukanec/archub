import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, ShieldAlert, Loader2, Save, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiRequest } from '@/lib/queryClient';
import { organizationKeys } from '@/core/query-keys';
import { useOptimisticMutation } from '@/core/save-engine';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

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
  'project': 'Proyectos',
  'members': 'Miembros',
  'member': 'Miembros',
  'finances': 'Finanzas',
  'finance': 'Finanzas',
  'financial': 'Finanzas',
  'clients': 'Clientes',
  'client': 'Clientes',
  'contacts': 'Contactos',
  'contact': 'Contactos',
  'materials': 'Materiales',
  'material': 'Materiales',
  'personnel': 'Personal',
  'subcontracts': 'Subcontratos',
  'subcontract': 'Subcontratos',
  'sitelog': 'Bitácora',
  'site_log': 'Bitácora',
  'site-log': 'Bitácora',
  'media': 'Media',
  'settings': 'Configuración',
  'setting': 'Configuración',
  'organization': 'Organización',
  'organizations': 'Organización',
  'org': 'Organización',
  'roles': 'Roles',
  'role': 'Roles',
  'capital': 'Capital',
  'budgets': 'Presupuestos',
  'budget': 'Presupuestos',
  'analysis': 'Análisis',
  'analytics': 'Análisis',
  'general': 'General',
  'admin': 'Administración',
  'administration': 'Administración',
  'learning': 'Capacitaciones',
  'courses': 'Cursos',
  'payments': 'Pagos',
  'payment': 'Pagos',
  'subscriptions': 'Suscripciones',
  'subscription': 'Suscripciones',
};

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  'projects.view': { label: 'Ver proyectos', description: 'Permite ver la lista de proyectos y sus detalles' },
  'projects.create': { label: 'Crear proyectos', description: 'Permite crear nuevos proyectos' },
  'projects.edit': { label: 'Editar proyectos', description: 'Permite modificar proyectos existentes' },
  'projects.delete': { label: 'Eliminar proyectos', description: 'Permite eliminar proyectos' },
  'projects.archive': { label: 'Archivar proyectos', description: 'Permite archivar y desarchivar proyectos' },
  'members.view': { label: 'Ver miembros', description: 'Permite ver la lista de miembros de la organización' },
  'members.invite': { label: 'Invitar miembros', description: 'Permite invitar nuevos miembros a la organización' },
  'members.edit': { label: 'Editar miembros', description: 'Permite modificar información de miembros' },
  'members.remove': { label: 'Eliminar miembros', description: 'Permite eliminar miembros de la organización' },
  'finances.view': { label: 'Ver finanzas', description: 'Permite ver información financiera' },
  'finances.create': { label: 'Crear movimientos', description: 'Permite crear movimientos financieros' },
  'finances.edit': { label: 'Editar movimientos', description: 'Permite editar movimientos financieros' },
  'finances.delete': { label: 'Eliminar movimientos', description: 'Permite eliminar movimientos financieros' },
  'finances.export': { label: 'Exportar finanzas', description: 'Permite exportar reportes financieros' },
  'clients.view': { label: 'Ver clientes', description: 'Permite ver la lista de clientes' },
  'clients.create': { label: 'Crear clientes', description: 'Permite crear nuevos clientes' },
  'clients.edit': { label: 'Editar clientes', description: 'Permite modificar clientes existentes' },
  'clients.delete': { label: 'Eliminar clientes', description: 'Permite eliminar clientes' },
  'contacts.view': { label: 'Ver contactos', description: 'Permite ver la lista de contactos' },
  'contacts.create': { label: 'Crear contactos', description: 'Permite crear nuevos contactos' },
  'contacts.edit': { label: 'Editar contactos', description: 'Permite modificar contactos existentes' },
  'contacts.delete': { label: 'Eliminar contactos', description: 'Permite eliminar contactos' },
  'materials.view': { label: 'Ver materiales', description: 'Permite ver la lista de materiales' },
  'materials.create': { label: 'Crear materiales', description: 'Permite crear nuevos materiales' },
  'materials.edit': { label: 'Editar materiales', description: 'Permite modificar materiales existentes' },
  'materials.delete': { label: 'Eliminar materiales', description: 'Permite eliminar materiales' },
  'personnel.view': { label: 'Ver personal', description: 'Permite ver la lista de personal' },
  'personnel.create': { label: 'Crear personal', description: 'Permite crear nuevos registros de personal' },
  'personnel.edit': { label: 'Editar personal', description: 'Permite modificar registros de personal' },
  'personnel.delete': { label: 'Eliminar personal', description: 'Permite eliminar registros de personal' },
  'subcontracts.view': { label: 'Ver subcontratos', description: 'Permite ver la lista de subcontratos' },
  'subcontracts.create': { label: 'Crear subcontratos', description: 'Permite crear nuevos subcontratos' },
  'subcontracts.edit': { label: 'Editar subcontratos', description: 'Permite modificar subcontratos existentes' },
  'subcontracts.delete': { label: 'Eliminar subcontratos', description: 'Permite eliminar subcontratos' },
  'sitelog.view': { label: 'Ver bitácora', description: 'Permite ver entradas de la bitácora' },
  'sitelog.create': { label: 'Crear entradas', description: 'Permite crear nuevas entradas en la bitácora' },
  'sitelog.edit': { label: 'Editar entradas', description: 'Permite modificar entradas de la bitácora' },
  'sitelog.delete': { label: 'Eliminar entradas', description: 'Permite eliminar entradas de la bitácora' },
  'media.view': { label: 'Ver media', description: 'Permite ver archivos multimedia' },
  'media.upload': { label: 'Subir archivos', description: 'Permite subir nuevos archivos' },
  'media.edit': { label: 'Editar media', description: 'Permite modificar archivos multimedia' },
  'media.delete': { label: 'Eliminar media', description: 'Permite eliminar archivos multimedia' },
  'settings.view': { label: 'Ver configuración', description: 'Permite ver la configuración' },
  'settings.edit': { label: 'Editar configuración', description: 'Permite modificar la configuración' },
  'organization.view': { label: 'Ver organización', description: 'Permite ver detalles de la organización' },
  'organization.edit': { label: 'Editar organización', description: 'Permite modificar la organización' },
  'roles.view': { label: 'Ver roles', description: 'Permite ver la lista de roles' },
  'roles.manage': { label: 'Gestionar roles', description: 'Permite crear, editar y eliminar roles' },
  'capital.view': { label: 'Ver capital', description: 'Permite ver información de capital' },
  'capital.manage': { label: 'Gestionar capital', description: 'Permite gestionar el capital' },
  'budgets.view': { label: 'Ver presupuestos', description: 'Permite ver presupuestos' },
  'budgets.create': { label: 'Crear presupuestos', description: 'Permite crear nuevos presupuestos' },
  'budgets.edit': { label: 'Editar presupuestos', description: 'Permite modificar presupuestos' },
  'budgets.delete': { label: 'Eliminar presupuestos', description: 'Permite eliminar presupuestos' },
  'analysis.view': { label: 'Ver análisis', description: 'Permite ver análisis y reportes' },
};

function getCategoryLabel(category: string): string {
  const normalized = category.toLowerCase().replace(/[-_]/g, '');
  if (CATEGORY_LABELS[category.toLowerCase()]) {
    return CATEGORY_LABELS[category.toLowerCase()];
  }
  if (CATEGORY_LABELS[normalized]) {
    return CATEGORY_LABELS[normalized];
  }
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ');
}

function isAdminRole(roleName: string): boolean {
  return roleName.toLowerCase().includes('admin');
}

function sortPermissions(permissions: Permission[]): Permission[] {
  return [...permissions].sort((a, b) => {
    const aIsView = a.key.endsWith('.view');
    const bIsView = b.key.endsWith('.view');
    const aIsManage = a.key.endsWith('.manage');
    const bIsManage = b.key.endsWith('.manage');
    
    if (aIsView && !bIsView) return -1;
    if (!aIsView && bIsView) return 1;
    if (aIsManage && !bIsManage) return -1;
    if (!aIsManage && bIsManage) return 1;
    
    return 0;
  });
}

function getPermissionInfo(key: string): { label: string; description: string } {
  if (PERMISSION_LABELS[key]) {
    return PERMISSION_LABELS[key];
  }
  const parts = key.split('.');
  const category = parts[0];
  const action = parts[parts.length - 1];
  const actionLabels: Record<string, string> = {
    'view': 'Ver',
    'create': 'Crear',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'manage': 'Gestionar',
    'invite': 'Invitar',
    'remove': 'Eliminar',
    'upload': 'Subir',
    'export': 'Exportar',
    'archive': 'Archivar',
  };
  const verb = actionLabels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const categoryLabel = getCategoryLabel(category);
  const label = `${verb} ${categoryLabel}`;
  return { label, description: '' };
}

export function OrganizationPermissionsView() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const canManageRoles = userData?.role?.permissions?.some(
    (p: { key: string }) => p.key === 'roles.manage'
  ) || userData?.role?.name?.toLowerCase().includes('admin');
  
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<RolesPermissionsData>({
    queryKey: organizationKeys.rolesPermissions(organizationId),
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/roles-permissions`);
      if (!response.ok) throw new Error('Failed to fetch roles-permissions');
      return response.json();
    },
    enabled: !!organizationId,
  });

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

  const updatePermissionsMutation = useOptimisticMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return apiRequest('PUT', `/api/roles/${roleId}/permissions`, { permissionIds, organizationId });
    },
    queryKey: organizationKeys.rolesPermissions(organizationId),
    optimisticUpdate: (oldData, { roleId, permissionIds }) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        roles: oldData.roles?.map((role: any) => 
          role.id === roleId 
            ? { ...role, permissionIds }
            : role
        ),
      };
    },
    onSuccessMessage: 'Permisos actualizados correctamente',
    onErrorMessage: 'No se pudieron guardar los cambios',
  });

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    const role = data?.roles.find(r => r.id === roleId);
    if (!role || isAdminRole(role.name) || !canManageRoles) return;

    setLocalPermissions(prev => {
      const current = prev[roleId] || [];
      const updated = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      
      return { ...prev, [roleId]: updated };
    });
    setHasChanges(true);
  };

  const handleCategoryToggle = (roleId: string, category: string, permissions: Permission[]) => {
    const role = data?.roles.find(r => r.id === roleId);
    if (!role || isAdminRole(role.name) || !canManageRoles) return;

    const permissionIdsInCategory = permissions.map(p => p.id);
    const currentPermissions = localPermissions[roleId] || [];
    const allSelected = permissionIdsInCategory.every(id => currentPermissions.includes(id));

    setLocalPermissions(prev => {
      const current = prev[roleId] || [];
      let updated: string[];

      if (allSelected) {
        updated = current.filter(id => !permissionIdsInCategory.includes(id));
      } else {
        updated = Array.from(new Set([...current, ...permissionIdsInCategory]));
      }

      return { ...prev, [roleId]: updated };
    });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!data?.roles) return;
    
    const rolesToUpdate = data.roles.filter(role => !isAdminRole(role.name));
    
    for (const role of rolesToUpdate) {
      const originalPerms = role.permissionIds.sort().join(',');
      const currentPerms = (localPermissions[role.id] || []).sort().join(',');
      
      if (originalPerms !== currentPerms) {
        await updatePermissionsMutation.mutateAsync({
          roleId: role.id,
          permissionIds: localPermissions[role.id] || [],
        });
      }
    }
    
    setHasChanges(false);
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
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
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

  const roles = data?.roles || [];
  const categories = data?.permissionsByCategory || {};

  return (
    <Card data-testid="permissions-tab">
      <CardContent className="p-0">
        <div className="space-y-4">
          {hasChanges && canManageRoles && (
            <div className="flex justify-end p-4 border-b">
              <Button
                onClick={handleSaveAll}
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
            </div>
          )}

          {!canManageRoles && (
            <div className="px-4 pt-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  No tienes permisos para modificar los roles. Los cambios están deshabilitados.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium text-sm text-muted-foreground w-[300px] sticky left-0 bg-muted/50 z-10">
                      Permiso
                    </th>
                    {roles.map((role) => (
                      <th 
                        key={role.id} 
                        className="text-center p-3 font-medium text-sm min-w-[120px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Rol
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isAdminRole(role.name) ? (
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={cn(
                              "text-sm",
                              isAdminRole(role.name) && "text-amber-600 dark:text-amber-400"
                            )}>
                              {role.name}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categories).map(([category, permissions]) => {
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <Fragment key={category}>
                        <tr
                          className="bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleCategory(category)}
                          data-testid={`category-row-${category}`}
                        >
                          <td className="p-3 sticky left-0 bg-muted/30 z-10">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm">
                                {getCategoryLabel(category)}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {permissions.length}
                              </span>
                            </div>
                          </td>
                          {roles.map((role) => {
                            const rolePerms = localPermissions[role.id] || [];
                            const categoryPermIds = permissions.map(p => p.id);
                            const selectedCount = categoryPermIds.filter(id => 
                              isAdminRole(role.name) || rolePerms.includes(id)
                            ).length;
                            const allSelected = selectedCount === permissions.length;
                            const someSelected = selectedCount > 0 && selectedCount < permissions.length;
                            const isAdmin = isAdminRole(role.name);

                            return (
                              <td 
                                key={role.id} 
                                className="text-center p-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={allSelected}
                                    disabled={isAdmin || !canManageRoles}
                                    onCheckedChange={() => handleCategoryToggle(role.id, category, permissions)}
                                    className={cn(
                                      someSelected && "opacity-50",
                                      isAdmin && "opacity-60"
                                    )}
                                    data-testid={`checkbox-category-${category}-role-${role.id}`}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        
                        {isExpanded && sortPermissions(permissions).map((permission) => {
                          const permInfo = getPermissionInfo(permission.key);
                          const description = permission.description || permInfo.description;
                          
                          return (
                            <tr 
                              key={permission.id}
                              className="border-b hover:bg-muted/20 transition-colors"
                              data-testid={`permission-row-${permission.id}`}
                            >
                              <td className="p-3 pl-10 sticky left-0 bg-background z-10">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {permInfo.label}
                                  </span>
                                  {description && (
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                      {description}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {roles.map((role) => {
                                const isAdmin = isAdminRole(role.name);
                                const rolePerms = localPermissions[role.id] || [];
                                const isChecked = isAdmin || rolePerms.includes(permission.id);

                                return (
                                  <td key={role.id} className="text-center p-3">
                                    <div className="flex justify-center">
                                      <Checkbox
                                        checked={isChecked}
                                        disabled={isAdmin || !canManageRoles}
                                        onCheckedChange={() => handlePermissionToggle(role.id, permission.id)}
                                        className={cn(isAdmin && "opacity-60")}
                                        data-testid={`checkbox-permission-${permission.id}-role-${role.id}`}
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
