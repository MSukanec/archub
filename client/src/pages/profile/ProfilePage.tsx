import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>Ver y editar información de tu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || user?.username} />
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{user?.fullName || user?.username}</h3>
                {user?.email && <p className="text-gray-500">{user.email}</p>}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Nombre de usuario</h4>
                  <p className="text-sm">{user?.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Nombre completo</h4>
                  <p className="text-sm">{user?.fullName || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Correo electrónico</h4>
                  <p className="text-sm">{user?.email || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-2">Información de la Cuenta</h3>
                <p className="text-sm text-gray-500">
                  Esta sección mostrará información como roles del usuario, fecha de registro, etc.
                  <br />
                  La edición de perfil estará disponible próximamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Función auxiliar para obtener las iniciales del usuario
function getUserInitials(user: any): string {
  if (!user) return '?';
  
  if (user.fullName) {
    return user.fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name[0])
      .join('')
      .toUpperCase();
  }
  
  return user.username.substring(0, 2).toUpperCase();
}