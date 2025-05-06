import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Building, Settings } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function OrganizationPage() {
  const { user } = useAuth();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organización</h1>
            <p className="text-gray-500 mt-1">Administra tu organización y sus miembros</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Nueva Organización
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Mi Organización</CardTitle>
              <CardDescription>Información sobre tu organización actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Construcciones XYZ</h3>
                  <p className="text-gray-500 text-sm">Creada el 01/01/2025</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Proyectos</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Miembros</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Configurar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Miembros del Equipo</CardTitle>
              <CardDescription>Visualiza y gestiona los miembros de tu organización</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Invita a otros usuarios a colaborar en tu organización. Podrán acceder a los proyectos, crear presupuestos y más.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                  <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{user?.fullName || user?.username || "Usuario Actual"}</h4>
                    <p className="text-sm text-gray-500">{user?.email || "email@ejemplo.com"}</p>
                  </div>
                  <Badge className="bg-primary hover:bg-primary/90">Administrador</Badge>
                </div>
                
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No hay más miembros en tu organización</p>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Invitar Miembro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}