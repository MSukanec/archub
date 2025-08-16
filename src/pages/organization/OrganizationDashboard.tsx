import { Layout } from "@/components/layout/desktop/Layout";
import { Building, Plus, Users, DollarSign, CheckSquare, FileText, HardHat, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/CustomButton";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";

export default function OrganizationDashboard() {
  const { openModal } = useGlobalModalStore();

  const headerProps = {
    title: "Resumen de Organización",
    icon: Building,
    breadcrumb: [
      { name: "Organización", href: "/organization/dashboard" }
    ],
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acciones Rápidas de Organización */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Acciones Rápidas de Organización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CustomButton
                icon={Plus}
                title="Crear un nuevo proyecto"
                description="Inicia un nuevo proyecto de construcción"
                onClick={() => openModal('project', {})}
              />
              <CustomButton
                icon={Users}
                title="Crear un nuevo contacto"
                description="Agrega un nuevo cliente o proveedor"
                onClick={() => openModal('contact', {})}
              />
              <CustomButton
                icon={DollarSign}
                title="Crear un nuevo movimiento"
                description="Registra un ingreso o egreso financiero"
                onClick={() => openModal('movement', {})}
              />
              <CustomButton
                icon={CheckSquare}
                title="Crear una nueva tarea"
                description="Agrega una tarea administrativa"
                onClick={() => openModal('construction-task', {})}
              />
            </CardContent>
          </Card>

          {/* Acciones Rápidas de Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Acciones Rápidas de Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CustomButton
                icon={CheckSquare}
                title="Crear una nueva tarea"
                description="Agrega una tarea de construcción al proyecto activo"
                onClick={() => openModal('construction-task', {})}
              />
              <CustomButton
                icon={FileText}
                title="Crear una nueva bitácora"
                description="Registra el progreso y eventos del proyecto"
                onClick={() => openModal('site-log', {})}
              />
              <CustomButton
                icon={HardHat}
                title="Crear un nuevo subcontrato"
                description="Gestiona subcontratistas y trabajos externos"
                onClick={() => openModal('subcontract', {})}
              />
              <CustomButton
                icon={Receipt}
                title="Crear un nuevo presupuesto"
                description="Estima costos para el proyecto"
                onClick={() => openModal('budget', {})}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
