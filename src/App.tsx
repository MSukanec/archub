import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import Dashboard from "@/pages/Dashboard";
import OrganizationManagement from "@/pages/organization/OrganizationList";
import OrganizationProjects from "@/pages/organization/OrganizationProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import Movements from "@/pages/Movements";
import SiteLogs from "@/pages/SiteLogs";


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
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
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