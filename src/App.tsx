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
      <Route path="/organizations">
        <ProtectedRoute>
          <Layout>
            <OrganizationManagement />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/organizaciones">
        <ProtectedRoute>
          <Layout>
            <OrganizationManagement />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/movimientos">
        <ProtectedRoute>
          <Layout>
            <Movements />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/finanzas/movimientos">
        <ProtectedRoute>
          <Layout>
            <Movements />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/finances/movements">
        <ProtectedRoute>
          <Layout>
            <Movements />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/bitacora">
        <ProtectedRoute>
          <Layout>
            <SiteLogs />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/construction/dashboard">
        <ProtectedRoute>
          <Layout>
            <ConstructionDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/obra/bitacora">
        <ProtectedRoute>
          <Layout>
            <SiteLogs />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/construction/site-logs">
        <ProtectedRoute>
          <Layout>
            <SiteLogs />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/preferencias">
        <ProtectedRoute>
          <Layout>
            <OrganizationPreferences />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/proyectos">
        <ProtectedRoute>
          <Layout>
            <OrganizationProjects />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/organization/contactos">
        <ProtectedRoute>
          <Layout>
            <OrganizationContacts />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/organization/dashboard">
        <ProtectedRoute>
          <Layout>
            <OrganizationDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/organization/members">
        <ProtectedRoute>
          <Layout>
            <OrganizationMembers />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/organization/activity">
        <ProtectedRoute>
          <Layout>
            <OrganizationActivity />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/project/dashboard">
        <ProtectedRoute>
          <Layout>
            <ProjectDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/finance/dashboard">
        <ProtectedRoute>
          <Layout>
            <FinancesDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/perfil">
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
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
