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
import Organizations from "@/pages/Organizations";

import Movements from "@/pages/Movements";
import SiteLogs from "@/pages/SiteLogs";

import Contacts from "@/pages/Contacts";

import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/organizations">
        <ProtectedRoute>
          <Layout>
            <Organizations />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/organizaciones">
        <ProtectedRoute>
          <Layout>
            <Organizations />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/proyectos">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/gestion-proyectos">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
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
      <Route path="/bitacora">
        <ProtectedRoute>
          <Layout>
            <SiteLogs />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/contactos">
        <ProtectedRoute>
          <Layout>
            <Contacts />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/organizaciones">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/usuarios">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/tareas">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/perfil">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/organizaciones">
        <ProtectedRoute>
          <Layout>
            <Organizations />
          </Layout>
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
      {/* Add more protected routes here */}
      <Route component={NotFound} />
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
