"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUserContextStore } from "@/stores/userContextStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/lib/queries/users";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  AvatarIcon,
  CalendarIcon,
  GlobeIcon,
  InfoIcon,
  MoonIcon,
  UserIcon,
} from "lucide-react";
import { countries } from "@/lib/data/countries";
import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";

export default function ProfilePage() {
  const { userProfile } = useUserContextStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    full_name: userProfile?.full_name || "",
    email: userProfile?.email || "",
    age: userProfile?.age || "",
    country: userProfile?.country || "",
    birthdate: userProfile?.birthdate || "",
    theme: userProfile?.theme || "light",
    sidebar_fixed: userProfile?.sidebar_fixed || false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const {
        first_name,
        last_name,
        age,
        country,
        birthdate,
        theme,
        sidebar_fixed,
      } = formData;
      return updateUserProfile({
        first_name,
        last_name,
        age,
        country,
        birthdate,
        theme,
        sidebar_fixed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "Perfil actualizado correctamente." });
    },
    onError: () => {
      toast({ title: "Error al actualizar el perfil", variant: "destructive" });
    },
  });

  const handleSubmit = async () => {
    updateProfileMutation.mutate();
  };

  return (
    <CustomPageLayout
      title="Mi Perfil"
      icon={<UserIcon className="w-4 h-4" />}
      showSearch={false}
      primaryButton={{
        label: "Guardar",
        onClick: handleSubmit,
      }}
    >
      <div className="space-y-6">
        {/* Foto de perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AvatarIcon className="w-5 h-5" />
              Foto de perfil
            </CardTitle>
            <CardDescription>Subí una imagen o utilizá una URL</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile?.avatar_url || ""} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Input placeholder="https://ejemplo.com/mi-foto.jpg" />
            <p className="text-sm text-muted-foreground">
              Formatos: JPG, PNG. Tamaño máximo: 2MB
            </p>
          </CardContent>
        </Card>

        {/* Información personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="w-5 h-5" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" value={formData.full_name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <select
                id="country"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              >
                <option value="">Selecciona tu país</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Fecha de nacimiento</Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate || ""}
                onChange={(e) => handleInputChange("birthdate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MoonIcon className="w-5 h-5" />
              Preferencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema de la interfaz</p>
                    <p className="text-sm text-muted-foreground">
                      Cambia entre modo claro y oscuro
                    </p>
                  </div>
                  <Switch
                    checked={formData.theme === "dark"}
                    onCheckedChange={(checked) =>
                      handleInputChange("theme", checked ? "dark" : "light")
                    }
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Barra lateral fija</p>
                    <p className="text-sm text-muted-foreground">
                      Mantener la barra lateral siempre visible
                    </p>
                  </div>
                  <Switch
                    checked={formData.sidebar_fixed}
                    onCheckedChange={(checked) =>
                      handleInputChange("sidebar_fixed", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomPageLayout>
  );
}
