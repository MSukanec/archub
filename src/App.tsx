import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";

import OrganizationManagement from "@/pages/organization/OrganizationList";
import OrganizationProjects from "@/pages/organization/OrganizationProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import OrganizationDashboard from "@/pages/organization/OrganizationDashboard";
import OrganizationMembers from "@/pages/organization/OrganizationMembers";
import OrganizationActivity from "@/pages/organization/OrganizationActivity";
import ProjectDashboard from "@/pages/project/ProjectDashboard";
import FinancesDashboard from "@/pages/finance/FinancesDashboard";
import Profile from "@/pages/others/Profile";
import Movements from "@/pages/finances/FinancesMovements";
import SiteLogs from "@/pages/site/SiteLogs";


function Router() {
  return (
    <Switch>
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
      <Route path="/finance/dashboard">
        <ProtectedRoute>
          <FinancesDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/perfil">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <OrganizationDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <OrganizationDashboard />
        </ProtectedRoute>
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