import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Plus, Mail, UserPlus } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function TeamPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Datos de ejemplo para la página
  const teamMembers = [
    {
      id: 1,
      name: "Administrador",
      email: "admin@example.com",
      role: "Administrador",
      avatar: null,
    },
    {
      id: 2,
      name: "Juan Pérez",
      email: "juan@example.com",
      role: "Arquitecto",
      avatar: null,
    },
    {
      id: 3,
      name: "María López",
      email: "maria@example.com",
      role: "Constructor",
      avatar: null,
    },
  ];
  
  // Filtrar miembros según búsqueda
  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipo</h1>
            <p className="text-gray-500 mt-1">Administra los miembros de tu equipo y sus roles</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar miembros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" /> Agregar Miembro
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Miembros del Equipo</CardTitle>
            <CardDescription>Visualiza y gestiona los miembros de tu equipo</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron miembros</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron miembros que coincidan con tu búsqueda.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <Avatar>
                        <AvatarImage src={member.avatar || undefined} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.role === "Administrador" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}