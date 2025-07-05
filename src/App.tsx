import { Switch, Route, Redirect } from "wouter"; // 👈 asegurate de importar Redirect
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/desktop/Layout";
import { ProtectedRoute } from "@/components/ui-custom/misc/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/ui-custom/misc/AdminProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { MobileActionBarProvider } from "@/components/layout/mobile/MobileActionBarContext";

// Páginas
import OrganizationManagement from "@/pages/organization/OrganizationList";
import OrganizationProjects from "@/pages/organization/OrganizationProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import OrganizationDashboard from "@/pages/organization/OrganizationDashboard";
import OrganizationMembers from "@/pages/organization/OrganizationMembers";
import OrganizationActivity from "@/pages/organization/OrganizationActivity";
import ProjectDashboard from "@/pages/project/ProjectDashboard";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import FinancesPreferences from "@/pages/finances/FinancesPreferences";
import Profile from "@/pages/others/Profile";
import FinancesMovements from "@/pages/finances/FinancesMovements";
import ConstructionLogs from "@/pages/construction/ConstructionLogs";
import ConstructionPersonnel from "@/pages/construction/ConstructionPersonnel";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";
import ConstructionBudgets from "@/pages/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/construction/ConstructionMaterials";
import ConstructionGallery from "@/pages/construction/ConstructionGallery";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrganizations from "@/pages/admin/AdminOrganizations";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminTasks from "@/pages/admin/AdminTasks";
import AdminGeneratedTasks from "@/pages/admin/AdminGeneratedTasks";
import AdminTaskCategoriesTemplates from "@/pages/admin/AdminTaskCategoriesTemplates";
import AdminTaskParameters from "@/pages/admin/AdminTaskParameters";
import AdminMaterials from "@/pages/admin/AdminMaterials";
import AdminMaterialCategories from "@/pages/admin/AdminMaterialCategories";
import AdminChangelogs from "@/pages/admin/AdminChangelogs";
import Tasks from "@/pages/others/Tasks";
import Changelog from "@/pages/others/Changelog";
import DesignTimeline from "@/pages/design/DesignTimeline";
import DesignDashboard from "@/pages/design/DesignDashboard";
import DesignDocumentation from "@/pages/design/DesignDocumentation";
import SelectMode from "@/pages/others/SelectMode";
import NotFound from "@/pages/others/NotFound";
import SlideModalExample2 from "@/components/modal/SlideModalExample2";

function Router() {
  return (
    <Switch>
      <Route path="/select-mode">
        <ProtectedRoute>
          <SelectMode />
        </ProtectedRoute>
      </Route>

      <Route path="/slide-modal-example">
        <ProtectedRoute>
          <SlideModalExample2 />
        </ProtectedRoute>
      </Route>

      <Route path="/organizations">
        <ProtectedRoute>
          <OrganizationManagement />
        </ProtectedRoute>
      </Route>

      <Route path="/organizaciones">
        <ProtectedRoute>
          <OrganizationManagement />
        </ProtectedRoute>
      </Route>

      <Route path="/movimientos">
        <ProtectedRoute>
          <FinancesMovements />
        </ProtectedRoute>
      </Route>

      <Route path="/finanzas/movimientos">
        <ProtectedRoute>
          <FinancesMovements />
        </ProtectedRoute>
      </Route>

      <Route path="/finances/movements">
        <ProtectedRoute>
          <FinancesMovements />
        </ProtectedRoute>
      </Route>

      <Route path="/finances/dashboard">
        <ProtectedRoute>
          <FinancesDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/finances/preferences">
        <ProtectedRoute>
          <FinancesPreferences />
        </ProtectedRoute>
      </Route>

      <Route path="/finanzas/preferencias">
        <ProtectedRoute>
          <FinancesPreferences />
        </ProtectedRoute>
      </Route>

      <Route path="/bitacora">
        <ProtectedRoute>
          <ConstructionLogs />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/dashboard">
        <ProtectedRoute>
          <ConstructionDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/obra/dashboard">
        <ProtectedRoute>
          <ConstructionDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/budgets">
        <ProtectedRoute>
          <ConstructionBudgets />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/materials">
        <ProtectedRoute>
          <ConstructionMaterials />
        </ProtectedRoute>
      </Route>

      <Route path="/obra/bitacora">
        <ProtectedRoute>
          <ConstructionLogs />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/site-logs">
        <ProtectedRoute>
          <ConstructionLogs />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/logs">
        <ProtectedRoute>
          <ConstructionLogs />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/personnel">
        <ProtectedRoute>
          <ConstructionPersonnel />
        </ProtectedRoute>
      </Route>

      <Route path="/construction/gallery">
        <ProtectedRoute>
          <ConstructionGallery />
        </ProtectedRoute>
      </Route>



      <Route path="/proyectos">
        <ProtectedRoute>
          <OrganizationProjects />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/projects">
        <ProtectedRoute>
          <OrganizationProjects />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/contacts">
        <ProtectedRoute>
          <OrganizationContacts />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/contactos">
        <ProtectedRoute>
          <OrganizationContacts />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/dashboard">
        <ProtectedRoute>
          <OrganizationDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/members">
        <ProtectedRoute>
          <OrganizationMembers />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/activity">
        <ProtectedRoute>
          <OrganizationActivity />
        </ProtectedRoute>
      </Route>



      <Route path="/project/dashboard">
        <ProtectedRoute>
          <ProjectDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/design/dashboard">
        <ProtectedRoute>
          <DesignDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/design/timeline">
        <ProtectedRoute>
          <DesignTimeline />
        </ProtectedRoute>
      </Route>

      <Route path="/design/documentation">
        <ProtectedRoute>
          <DesignDocumentation />
        </ProtectedRoute>
      </Route>

      <Route path="/finances/dashboard">
        <ProtectedRoute>
          <FinancesDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/finanzas/dashboard">
        <ProtectedRoute>
          <FinancesDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/perfil">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      {/* Rutas de administración - Solo para administradores */}
      <Route path="/admin/dashboard">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/organizations">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminOrganizations />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminUsers />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/changelogs">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminChangelogs />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/tasks">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminTasks />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/generated-tasks">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminGeneratedTasks />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/task-categories-templates">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminTaskCategoriesTemplates />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/task-parameters">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminTaskParameters />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/material-categories">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminMaterialCategories />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/materials">
        <ProtectedRoute>
          <AdminProtectedRoute>
            <AdminMaterials />
          </AdminProtectedRoute>
        </ProtectedRoute>
      </Route>

      <Route path="/tasks">
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      </Route>

      <Route path="/changelog">
        <ProtectedRoute>
          <Changelog />
        </ProtectedRoute>
      </Route>

      {/* Redirección de /dashboard por compatibilidad */}
      <Route path="/dashboard">
        <Redirect to="/organization/dashboard" />
      </Route>

      {/* Redirección principal */}
      <Route path="/">
        <Redirect to="/organization/dashboard" />
      </Route>

      {/* Página 404 - debe ir al final */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MobileActionBarProvider>
          <Toaster />
          <Router />
        </MobileActionBarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
