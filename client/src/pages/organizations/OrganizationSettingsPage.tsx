import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { OrganizationSettings } from "@/components/organization/OrganizationSettings";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MainLayout } from "@/components/layout/MainLayout";

interface Organization {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  logoUrl: string | null;
  pdfConfig?: {
    logoPosition: "left" | "center" | "right";
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showTaxId: boolean;
    primaryColor: string;
    secondaryColor: string;
  };
}

export default function OrganizationSettingsPage() {
  // Obtener la organización activa
  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ["/api/organizations/active"],
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !organization) {
    return (
      <MainLayout>
        <div className="container py-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudo cargar la información de la organización. 
              Por favor, asegúrate de que existe una organización y que tienes permisos para acceder a ella.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Configuración de la Organización | ArchHub</title>
      </Helmet>
      
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Configuración de la Organización</h1>
          <p className="text-muted-foreground mt-2">
            Actualiza la información y configuración de tu organización
          </p>
        </div>
        
        <div className="bg-card rounded-lg border shadow p-6">
          <OrganizationSettings organization={organization} />
        </div>
      </div>
    </MainLayout>
  );
}