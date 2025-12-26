import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/shared/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Building, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal'
import AdminUserRow from '@/features/users/components/AdminUserRow'
// Helper to format user acquisition origin
function formatAcquisitionOrigin(acquisition: { source?: string; medium?: string; campaign?: string } | null): string {
  if (!acquisition || !acquisition.source) return 'Desconocido';
  
  const { source, medium, campaign } = acquisition;
  
  if (source === 'direct') return 'Directo';
  if (source === 'unknown') return 'Desconocido';
  
  const formattedSource = source.charAt(0).toUpperCase() + source.slice(1);
  const parts = [formattedSource];
  if (campaign) parts.push(`· ${campaign}`);
  
  return parts.join('');
}
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
  acquisition?: {
    source: string
    medium?: string
    campaign?: string
  } | null
}
// Componente para mostrar la última actividad
function LastActivityCell({ lastSeen }: { lastSeen: string | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);
  const { label, isOnline, tooltip } = useMemo(() => {
    if (!lastSeen) return { label: '—', isOnline: false, tooltip: 'Sin registro'};
    
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
      relativeLabel = `hace ${diffDays} día${diffDays > 1 ? 's': ''}`;
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
    <div title={tooltip}>
      {isOnline ? (
        <Badge variant="default">
          {label}
        </Badge>
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
      console.error('Error deleting user:', error)
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
      label: 'Activo',
      type: 'status'as const,
      render: (user: User) => <LastActivityCell lastSeen={user.last_seen_at} />
    },
    {
      key: 'full_name',
      label: 'Usuario',
      type: 'long-text'as const,
      render: (user: User) => (
        <IdentityBadge
          name={user.full_name || 'Sin nombre'}
          avatarUrl={user.avatar_url}
          subLabel={user.email}
          size="sm"
        />
      )
    },
    {
      key: 'organizations_count',
      label: 'Orgs',
      type: 'number'as const,
      render: (user: User) => (
        <span className="text-sm">{user.organizations_count}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Registro',
      type: 'date'as const,
      render: (user: User) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'acquisition',
      label: 'Origen',
      type: 'status'as const,
      render: (user: User) => (
        <span className="text-sm text-muted-foreground">
          {formatAcquisitionOrigin(user.acquisition || null)}
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
            variant: 'destructive'as const
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
            <p className="text-sm">No hay usuarios que coincidan con los filtros aplicados.</p>
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