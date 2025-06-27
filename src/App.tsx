import { Switch, Route, Redirect } from "wouter"; // 👈 asegurate de importar Redirect
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ui-custom/misc/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";

// Páginas
import OrganizationManagement from "@/pages/organization/OrganizationList";
import OrganizationProjects from "@/pages/organization/OrganizationProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import OrganizationDashboard from "@/pages/organization/OrganizationDashboard";
import OrganizationMembers from "@/pages/organization/OrganizationMembers";
import OrganizationActivity from "@/pages/organization/OrganizationActivity";
import ProjectDashboard from "@/pages/project/ProjectDashboard";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import Profile from "@/pages/others/Profile";
import Movements from "@/pages/finances/FinancesMovements";
import SiteLogs from "@/pages/site/SiteLogs";
import OrganizationPreferences from "@/pages/organization/OrganizationPreferences";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";

function Router() {
  return (
    <Switch>
      {/* ORGANIZACIÓN ROUTES */}
      <Route path="/organization/dashboard">
        <ProtectedRoute>
          <OrganizationDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/proyectos">
        <ProtectedRoute>
          <OrganizationProjects />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/contactos">
        <ProtectedRoute>
          <OrganizationContacts />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/activity">
        <ProtectedRoute>
          <OrganizationActivity />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/members">
        <ProtectedRoute>
          <OrganizationMembers />
        </ProtectedRoute>
      </Route>

      <Route path="/preferencias">
        <ProtectedRoute>
          <OrganizationPreferences />
        </ProtectedRoute>
      </Route>

      {/* PROYECTO ROUTES */}
      <Route path="/project/dashboard">
        <ProtectedRoute>
          <ProjectDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/design/dashboard">
        <ProtectedRoute>
          <ProjectDashboard />
        </ProtectedRoute>
      </Route>

      {/* OBRA ROUTES */}
      <Route path="/construction/dashboard">
        <ProtectedRoute>
          <ConstructionDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/bitacora">
        <ProtectedRoute>
          <SiteLogs />
        </ProtectedRoute>
      </Route>

      {/* FINANZAS ROUTES */}
      <Route path="/finance/dashboard">
        <ProtectedRoute>
          <FinancesDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/movimientos">
        <ProtectedRoute>
          <Movements />
        </ProtectedRoute>
      </Route>

      {/* COMERCIALIZACIÓN ROUTES */}
      <Route path="/commercialization/dashboard">
        <ProtectedRoute>
          <OrganizationDashboard />
        </ProtectedRoute>
      </Route>

      {/* PERFIL */}
      <Route path="/perfil">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      {/* CONFIGURACIÓN */}
      <Route path="/configuracion">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      {/* REDIRECTS */}
      <Route path="/dashboard">
        <Redirect to="/organization/dashboard" />
      </Route>

      <Route path="/">
        <Redirect to="/organization/dashboard" />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
