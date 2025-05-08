import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSettings } from "@/components/organization/OrganizationSettings";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("general");

  // Obtener la organización activa
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations/active"],
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Configuración de la Organización</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : organization ? (
          <Card>
            <CardHeader>
              <CardTitle>Personalización</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationSettings organization={organization} />
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-8">
            <p>No se encontró ninguna organización. Por favor, crea una organización primero.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}