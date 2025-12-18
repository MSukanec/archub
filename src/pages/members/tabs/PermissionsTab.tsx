import { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, ShieldAlert, Loader2, Save, AlertTriangle, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

function getPermissionLabel(key: string): string {
  const parts = key.split('.');
  const action = parts[parts.length - 1];
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function PermissionsTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const canManageRoles = userData?.role?.permissions?.some(
    (p: { key: string }) => p.key === 'roles.manage'
  ) || userData?.role?.name?.toLowerCase().includes('admin');
  
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery<RolesPermissionsData>({
    queryKey: [`/api/organizations/${organizationId}/roles-permissions`],
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

  const filteredCategories = data?.permissionsByCategory 
    ? Object.entries(data.permissionsByCategory).reduce((acc, [category, permissions]) => {
        if (!searchQuery) {
          acc[category] = permissions;
          return acc;
        }
        const filtered = permissions.filter(p => 
          p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getCategoryLabel(category).toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, Permission[]>)
    : {};

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
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

  return (
    <div className="space-y-4" data-testid="permissions-tab">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar permiso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-permissions"
          />
        </div>
        
        {hasChanges && canManageRoles && (
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
        )}
      </div>

      {!canManageRoles && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para modificar los roles. Los cambios están deshabilitados.
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden">
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
                {Object.entries(filteredCategories).map(([category, permissions]) => {
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
                      
                      {isExpanded && permissions.map((permission) => (
                        <tr 
                          key={permission.id}
                          className="border-b hover:bg-muted/20 transition-colors"
                          data-testid={`permission-row-${permission.id}`}
                        >
                          <td className="p-3 pl-10 sticky left-0 bg-background z-10">
                            <span className="text-sm text-muted-foreground">
                              {getPermissionLabel(permission.key)}
                            </span>
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
                      ))}
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
  );
}
