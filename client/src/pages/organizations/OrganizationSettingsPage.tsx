import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { OrganizationSettings } from "@/components/organization/OrganizationSettings";

export default function OrganizationSettingsPage() {
  return (
    <MainLayout sidebarType={SidebarTypes.MainSidebar}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Configuración de la Organización</h1>
        
        <OrganizationSettings />
      </div>
    </MainLayout>
  );
}