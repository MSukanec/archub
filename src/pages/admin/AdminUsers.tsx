import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, MoreHorizontal, Edit, Trash2, Crown, Users, UserCheck, UserX, Building } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'


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
  last_activity_at: string
}

export default function AdminUsers() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  // Fetch users with statistics
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchValue, sortBy, statusFilter, showActiveOnly],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      let query = supabase
        .from('users')
        .select(`
          *,
          user_data (
            first_name,
            last_name,
            country
          )
        `)
      
      // Apply filters
      if (searchValue) {
        query = query.or(`full_name.ilike.%${searchValue}%,email.ilike.%${searchValue}%`)
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }
      
      // Apply sorting
      if (sortBy === 'name') {
        query = query.order('full_name', { ascending: true })
      } else if (sortBy === 'email') {
        query = query.order('email', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // Get organization counts for each user
      const usersWithCounts = await Promise.all(
        data.map(async (user) => {
          const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true)
          
          return {
            ...user,
            organizations_count: count || 0,
            last_activity_at: user.updated_at || user.created_at
          }
        })
      )
      
      console.log('Users with counts:', usersWithCounts)
      return usersWithCounts
    }
  })

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const [totalResult, activeResult, inactiveResult, withOrgsResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.rpc('get_users_with_organizations_count')
      ])
      
      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
        withOrganizations: withOrgsResult.data || 0
      }
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
      
      if (error) throw error
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

  const handleDelete = (user: User) => {
    setDeletingUser(user)
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

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setStatusFilter('all')
    setShowActiveOnly(false)
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Registro',
      width: '16.66%',
      render: (user: User) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(user.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'last_activity_at',
      label: 'Última Actividad',
      width: '16.66%',
      render: (user: User) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(user.last_activity_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'full_name',
      label: 'Usuario',
      width: '16.66%',
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
      width: '16.66%',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">{user.organizations_count}</span>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Estado',
      width: '16.66%',
      render: (user: User) => (
        <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
          {user.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '16.66%',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEdit(user)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteDangerous(user)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const customFilters = (
    <div className="space-y-3 w-72">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-medium">Estado</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Usuarios',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actionButton: {
      label: "Nuevo Usuario",
      icon: Plus,
      onClick: () => openModal('admin-user')
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Usuarios</p>
                <p className="text-lg font-semibold">{stats?.total || 0}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Usuarios Activos</p>
                <p className="text-lg font-semibold">{stats?.active || 0}</p>
              </div>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Usuarios Inactivos</p>
                <p className="text-lg font-semibold">{stats?.inactive || 0}</p>
              </div>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Con Organizaciones</p>
                <p className="text-lg font-semibold">{stats?.withOrganizations || 0}</p>
              </div>
              <Building className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Table
          data={users}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay usuarios</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay usuarios que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>



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
    </Layout>
  )
}