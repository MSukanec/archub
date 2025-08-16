import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { MobileActionBarProvider } from "@/components/layout/mobile/MobileActionBarContext";
import { AuthRedirect } from "@/components/ui-custom/AuthRedirect";
import { ProtectedRoute } from "@/components/ui-custom/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/ui-custom/AdminProtectedRoute";

// Public Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Protected Pages


import Projects from "@/pages/organization/Projects";





import FinancesClients from "@/pages/finances/FinancesClients";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import FinancesMovements from "@/pages/finances/FinancesMovements";
import FinancesAnalysis from "@/pages/finances/FinancesAnalysis";
import FinancesInstallments from "@/pages/finances/FinancesInstallments";
import FinancesCapitalMovements from "@/pages/finances/FinancesCapitalMovements";


import Preferences from "@/pages/organization/Preferences";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";
import ConstructionLogs from "@/pages/construction/ConstructionLogs";
import ConstructionPersonnel from "@/pages/construction/ConstructionPersonnel";
import ConstructionBudgets from "@/pages/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/construction/ConstructionMaterials";
import CostAnalysis from "@/pages/resources/CostAnalysis";
import ConstructionTasks from "@/pages/construction/tasks/Tasks";


import ConstructionSubcontracts from "@/pages/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/construction/subcontracts/SubcontractView";
import DesignDashboard from "@/pages/design/DesignDashboard";
import Documentation from "@/pages/resources/Documentation";
import Gallery from "@/pages/resources/Gallery";
import Contacts from "@/pages/resources/Contacts";
import Board from "@/pages/resources/Board";

import Organization from "@/pages/organization/Organization";

import Profile from "@/pages/profile/Profile";

import Onboarding from "@/pages/Onboarding";
import SelectMode from "@/pages/SelectMode";

// Admin Pages
import AdminCommunity from "@/pages/admin/community/AdminCommunity";


import AdminMaterials from "@/pages/admin/materials/AdminMaterials";
import AdminTasks from "@/pages/admin/tasks/AdminTasks";
import AdminGeneral from "@/pages/admin/general/AdminGeneral";










import NotFound from "@/pages/NotFound";
import { ModalFactory } from "@/components/modal/form/ModalFactory";
import { ProjectContextInitializer } from "@/components/navigation/ProjectContextInitializer";

function Router() {
  return (
    <AuthRedirect>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Onboarding and Mode Selection Routes */}
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/select-mode" component={SelectMode} />

        {/* Main Dashboard - redirects to Organization */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Organization />
          </ProtectedRoute>
        </Route>

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/preferences">
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        </Route>
        
        <Route path="/organization">
          <ProtectedRoute>
            <Organization />
          </ProtectedRoute>
        </Route>


        <Route path="/organization/projects">
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        </Route>



        <Route path="/recursos/board">
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        </Route>

        <Route path="/organization/:organizationId">
          <ProtectedRoute>
            <Organization />
          </ProtectedRoute>
        </Route>

        {/* Projects Routes */}
        <Route path="/projects">
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        </Route>


        <Route path="/finances/clients">
          <ProtectedRoute>
            <FinancesClients />
          </ProtectedRoute>
        </Route>
        


        {/* Resources Routes */}
        <Route path="/recursos/documentacion">
          <ProtectedRoute>
            <Documentation />
          </ProtectedRoute>
        </Route>
        <Route path="/recursos/galeria">
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        </Route>
        <Route path="/recursos/contactos">
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        </Route>

        {/* Design Routes */}
        <Route path="/design/dashboard">
          <ProtectedRoute>
            <DesignDashboard />
          </ProtectedRoute>
        </Route>




        {/* Construction Routes */}
        <Route path="/construction/dashboard">
          <ProtectedRoute>
            <ConstructionDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/construction/tasks">
          <ProtectedRoute>
            <ConstructionTasks />
          </ProtectedRoute>
        </Route>


        <Route path="/construction/subcontracts">
          <ProtectedRoute>
            <ConstructionSubcontracts />
          </ProtectedRoute>
        </Route>
        <Route path="/construction/subcontracts/:id">
          <ProtectedRoute>
            <SubcontractView />
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
        <Route path="/recursos/cost-analysis">
          <ProtectedRoute>
            <CostAnalysis />
          </ProtectedRoute>
        </Route>


        {/* Finances Routes */}
        <Route path="/finances">
          <ProtectedRoute>
            <FinancesDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/dashboard">
          <ProtectedRoute>
            <FinancesDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/movements">
          <ProtectedRoute>
            <FinancesMovements />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/analysis">
          <ProtectedRoute>
            <FinancesAnalysis />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/installments">
          <ProtectedRoute>
            <FinancesInstallments />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/capital-movements">
          <ProtectedRoute>
            <FinancesCapitalMovements />
          </ProtectedRoute>
        </Route>


        {/* Profile Routes */}
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>



        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminCommunity />
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

        <Route path="/admin/tasks">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminTasks />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/general">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminGeneral />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>






        {/* 404 Route - Must be last */}
        <Route path="*" component={NotFound} />
      </Switch>
    </AuthRedirect>
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
          <ProjectContextInitializer />
          <Toaster />
          <Router />
          <ModalFactory />
        </MobileActionBarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
