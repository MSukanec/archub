import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Building, Settings } from "lucide-react";
import { Link } from "wouter";

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="card">
            <CardHeader className="pb-4 card-header">
              <CardTitle className="text-xl">Mi Organización</CardTitle>
              <CardDescription>Información sobre tu organización actual</CardDescription>
            </CardHeader>
            <CardContent className="card-content">
              <div className="flex items-center gap-4 mb-4 md:mb-6">
                <div className="bg-primary/10 p-2 md:p-3 rounded-full">
                  <Building className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base md:text-lg">Construcciones XYZ</h3>
                  <p className="text-gray-500 text-xs md:text-sm">Creada el 01/01/2025</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-gray-500 text-xs md:text-sm">Proyectos</p>
                  <p className="text-xl md:text-2xl font-bold">2</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-gray-500 text-xs md:text-sm">Miembros</p>
                  <p className="text-xl md:text-2xl font-bold">3</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/organization/settings">
                    <Settings className="mr-2 h-4 w-4" /> Configurar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 card">
            <CardHeader className="pb-3 md:pb-4 card-header">
              <CardTitle className="text-xl">Miembros del Equipo</CardTitle>
              <CardDescription>Visualiza y gestiona los miembros de tu organización</CardDescription>
            </CardHeader>
            <CardContent className="card-content">
              <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                Invita a otros usuarios a colaborar en tu organización. Podrán acceder a los proyectos, crear presupuestos y más.
              </p>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 pb-2 md:pb-3 border-b">
                  <div className="bg-gray-200 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base truncate">{user?.fullName || user?.username || "Usuario Actual"}</h4>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{user?.email || "email@ejemplo.com"}</p>
                  </div>
                  <Badge className="bg-primary hover:bg-primary/90 text-xs whitespace-nowrap">Admin</Badge>
                </div>
                
                <div className="text-center py-4 md:py-6">
                  <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">No hay más miembros en tu organización</p>
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