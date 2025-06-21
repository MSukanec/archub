import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
import { CustomPageHeader } from "@/components/ui-custom/CustomPageHeader";
import { CustomSearchButton } from "@/components/ui-custom/CustomSearchButton";
import { CustomTable } from "@/components/ui-custom/CustomTable";
import { CustomModalLayout } from "@/components/ui-custom/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/CustomModalFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  role: string;
  organization?: {
    id: string;
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
}

const userSchema = z.object({
  full_name: z.string().min(1, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.enum(["admin", "user"]),
  organization_id: z.string().optional(),
  is_active: z.boolean()
});

type UserFormData = z.infer<typeof userSchema>;

export function AdminUsers() {
  const [searchValue, setSearchValue] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_data (
            id
          ),
          organization_members!inner (
            organization_id,
            role_id,
            is_active,
            organizations (
              id,
              name
            ),
            roles (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
        is_active: user.organization_members?.[0]?.is_active || false,
        role: user.organization_members?.[0]?.roles?.name || 'user',
        organization: user.organization_members?.[0]?.organizations ? {
          id: user.organization_members[0].organizations.id,
          name: user.organization_members[0].organizations.name
        } : undefined
      })) || [];
    }
  });

  // Fetch organizations for dropdown
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "user",
      organization_id: "",
      is_active: true
    }
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: async (formData: UserFormData) => {
      if (!supabase) throw new Error('Supabase no disponible');

      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            email: formData.email
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        // Update organization membership if changed
        if (formData.organization_id) {
          const { error: memberError } = await supabase
            .from('organization_members')
            .update({
              is_active: formData.is_active
            })
            .eq('user_id', editingUser.id);

          if (memberError) throw memberError;
        }
      } else {
        // Create user - This would typically be done through Supabase Auth
        throw new Error('La creación de usuarios debe realizarse a través del sistema de autenticación');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setOpenModal(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: editingUser ? "Usuario actualizado" : "Usuario creado",
        description: editingUser ? "El usuario ha sido actualizado exitosamente." : "El usuario ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      // Deactivate user instead of deleting
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al desactivar el usuario.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role as "admin" | "user",
      organization_id: user.organization?.id || "",
      is_active: user.is_active
    });
    setOpenModal(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    form.reset();
  };

  const onSubmit = (data: UserFormData) => {
    userMutation.mutate(data);
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.email.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.organization?.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      key: 'full_name' as keyof User,
      header: 'Nombre Completo',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium">{user.full_name}</span>
        </div>
      )
    },
    {
      key: 'email' as keyof User,
      header: 'Email',
      render: (user: User) => <span className="text-gray-600">{user.email}</span>
    },
    {
      key: 'role' as keyof User,
      header: 'Rol',
      render: (user: User) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
        </Badge>
      )
    },
    {
      key: 'is_active' as keyof User,
      header: 'Estado',
      render: (user: User) => (
        <Badge variant={user.is_active ? 'default' : 'destructive'}>
          {user.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'organization' as keyof User,
      header: 'Organización',
      render: (user: User) => (
        <span className="text-gray-600">
          {user.organization?.name || 'Sin asignar'}
        </span>
      )
    },
    {
      key: 'created_at' as keyof User,
      header: 'Fecha de Registro',
      render: (user: User) => (
        <span className="text-gray-600">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions' as keyof User,
      header: 'Acciones',
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(user)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Desactivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <CustomPageLayout isWide={true}>
      <CustomPageHeader
        icon={User}
        title="Gestión de Usuarios"
        actions={[
          <CustomSearchButton
            key="search"
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Buscar usuarios..."
          />,
          <Button key="new" onClick={() => setOpenModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        ]}
      />

      <Card className="p-0">
        <CustomTable
          data={filteredUsers}
          columns={columns}
          loading={isLoading}
          emptyMessage="No se encontraron usuarios"
        />
      </Card>

      <CustomModalLayout open={openModal} onClose={handleCloseModal}>
        {{
          header: (
            <CustomModalHeader
              title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              description={editingUser ? "Modifica la información del usuario" : "Crea un nuevo usuario en el sistema"}
              onClose={handleCloseModal}
            />
          ),
          body: (
            <CustomModalBody>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    {...form.register("full_name")}
                    placeholder="Ingresa el nombre completo"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="usuario@ejemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {!editingUser && (
                  <div className="col-span-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register("password")}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {form.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={form.watch("role")}
                    onValueChange={(value) => form.setValue("role", value as "admin" | "user")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organization_id">Organización</Label>
                  <Select
                    value={form.watch("organization_id")}
                    onValueChange={(value) => form.setValue("organization_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una organización" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.watch("is_active")}
                    onCheckedChange={(checked) => form.setValue("is_active", checked)}
                  />
                  <Label htmlFor="is_active">Usuario activo</Label>
                </div>
              </form>
            </CustomModalBody>
          ),
          footer: (
            <CustomModalFooter
              onCancel={handleCloseModal}
              onSave={form.handleSubmit(onSubmit)}
              saveText={editingUser ? "Actualizar" : "Crear"}
              isLoading={userMutation.isPending}
            />
          )
        }}
      </CustomModalLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al usuario "{userToDelete?.full_name}". 
              El usuario no podrá acceder al sistema pero sus datos se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomPageLayout>
  );
}