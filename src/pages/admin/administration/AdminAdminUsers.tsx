import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Building, Users } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminUserRow from '@/components/ui/data-row/rows/AdminUserRow'

interface User {
  id: string
  auth_id: string
  full_name: string
  email: string
  avatar_url: string
  created_at: string
  is_active: boolean
  user_data?: {
    first_name: string
    last_name: string
    country: string
  }
  organizations_count: number
  last_seen_at: string | null
}

// Componente para mostrar la última actividad
function LastActivityCell({ lastSeen }: { lastSeen: string | null }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { label, isOnline, tooltip } = useMemo(() => {
    if (!lastSeen) return { label: '—', isOnline: false, tooltip: 'Sin registro' };
    
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = Date.now();
    const diffMs = now - lastSeenTime;
    
    // Activo si está dentro de 90 segundos
    if (diffMs <= 90_000) {
      return { label: 'Activo ahora', isOnline: true, tooltip: format(new Date(lastSeen), 'dd/MM/yyyy HH:mm:ss', { locale: es }) };
    }
    
    // Tiempo relativo
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    let relativeLabel = '';
    if (diffDays >= 1) {
      relativeLabel = `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHr >= 1) {
      relativeLabel = `hace ${diffHr} h`;
    } else if (diffMin >= 1) {
      relativeLabel = `hace ${diffMin} min`;
    } else {
      relativeLabel = `hace ${diffSec} s`;
    }
    
    return { 
      label: relativeLabel, 
      isOnline: false, 
      tooltip: format(new Date(lastSeen), 'dd/MM/yyyy HH:mm:ss', { locale: es })
    };
  }, [lastSeen, tick]);

  return (
    <div className="flex items-center gap-2" title={tooltip}>
      {isOnline ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--plan-free-bg)]" />
          <Badge 
            variant="default"
            className="bg-[var(--plan-free-bg)] text-white hover:bg-[var(--plan-free-bg)]/90"
          >
            {label}
          </Badge>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

const AdminAdminUsers = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  // Fetch users with statistics from backend API (bypasses RLS)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchValue, sortBy, statusFilter, showActiveOnly],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchValue) params.append('search', searchValue)
      if (sortBy) params.append('sortBy', sortBy)
      if (statusFilter !== 'all') params.append('statusFilter', statusFilter)
      
      // Call backend API endpoint with admin authentication
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      
      return response.json()
    }
  })

  // Delete user mutation (uses backend API to bypass RLS)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      
      // Call backend API endpoint with admin authentication
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: false })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate user')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
      toast({
        title: 'Usuario desactivado',
        description: 'El usuario ha sido desactivado exitosamente.',
      })
      setDeletingUser(null)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el usuario.',
        variant: 'destructive',
      })
    }
  })

  const handleEdit = (user: User) => {
    openModal('admin-user', { user, isEditing: true })
  }

  const handleDeleteDangerous = (user: User) => {
    openModal('delete-confirmation', {
      title: 'Desactivar Usuario',
      description: `¿Estás seguro de que deseas desactivar al usuario "${user.full_name || user.email}"? Esta acción cambiará su estado a inactivo.`,
      itemName: user.full_name || user.email,
      onConfirm: () => deleteUserMutation.mutate(user.id),
      dangerous: true
    })
  }

  const confirmDelete = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser.id)
    }
  }

  const columns = [
    {
      key: 'last_activity',
      label: 'Última Actividad',
      width: '20%',
      render: (user: User) => <LastActivityCell lastSeen={user.last_seen_at} />
    },
    {
      key: 'full_name',
      label: 'Usuario',
      width: '25%',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-xs">
              {user.full_name?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.full_name || 'Sin nombre'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'organizations_count',
      label: 'Organizaciones',
      width: '15%',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">{user.organizations_count}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Registro',
      width: '20%',
      render: (user: User) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(user.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <Table
        data={users}
        columns={columns}
        isLoading={isLoading}
        rowActions={(user) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(user)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDeleteDangerous(user),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(user) => (
          <AdminUserRow
            user={user}
            onClick={() => handleEdit(user)}
            density="normal"
          />
        )}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron usuarios</p>
            <p className="text-xs">No hay usuarios que coincidan con los filtros aplicados.</p>
          </div>
        }
      />

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al usuario "{deletingUser?.full_name || deletingUser?.email}". 
              El usuario no podrá acceder al sistema, pero sus datos se conservarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminAdminUsers;