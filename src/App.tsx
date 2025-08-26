import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { ActionBarMobileProvider } from "@/components/layout/mobile/ActionBarMobileContext";
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






import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import Movements from "@/pages/finances/movements/Movements";
import FinancesAnalysis from "@/pages/finances/FinancesAnalysis";
import FinancesCapitalMovements from "@/pages/finances/FinancesCapitalMovements";
import { Clients } from "@/pages/finances/clients/Clients";


import Preferences from "@/pages/organization/Preferences";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";
import Logs from "@/pages/construction/logs/Logs";
import ConstructionPersonnel from "@/pages/construction/ConstructionPersonnel";
import ConstructionBudgets from "@/pages/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/construction/ConstructionMaterials";
import Analysis from "@/pages/resources/analysis/Analysis";
import ConstructionTasks from "@/pages/construction/tasks/Tasks";


import ConstructionSubcontracts from "@/pages/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/construction/subcontracts/SubcontractView";
import DesignDashboard from "@/pages/design/DesignDashboard";
import Documentation from "@/pages/resources/Documentation";
import Gallery from "@/pages/resources/Gallery";
import Contacts from "@/pages/resources/Contacts";
import Board from "@/pages/resources/Board";

import Dashboard from "@/pages/dashboard/Dashboard";
import Members from "@/pages/organization/members/Members";

import Profile from "@/pages/profile/Profile";
import OrganizationData from "@/pages/organization/data/OrganizationData";

import Onboarding from "@/pages/Onboarding";
import SelectMode from "@/pages/SelectMode";

// Admin Pages
import AdminCommunity from "@/pages/admin/community/AdminCommunity";



import AdminMaterials from "@/pages/admin/materials/AdminMaterials";
import AdminTasks from "@/pages/admin/tasks/AdminTasks";
import AdminGeneral from "@/pages/admin/general/AdminGeneral";

// Provider Pages  
import Products from "@/pages/providers/products/Products";

// Analysis Pages
import AnalysisTasks from "@/pages/analysis/Tasks";
import AnalysisLabor from "@/pages/analysis/Labor";
import AnalysisMaterials from "@/pages/analysis/Materials";
import AnalysisIndirects from "@/pages/analysis/Indirects";










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

        {/* Main Dashboard - Independent dashboard */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/preferences">
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        </Route>

        <Route path="/organization/data">
          <ProtectedRoute>
            <OrganizationData />
          </ProtectedRoute>
        </Route>

        <Route path="/organization/members">
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        </Route>
        
        <Route path="/organization">
          <ProtectedRoute>
            <Members />
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
            <Members />
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
            <Clients />
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
            <Logs />
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
            <Analysis />
          </ProtectedRoute>
        </Route>
        <Route path="/resources/analysis">
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        </Route>
        <Route path="/resources/analysis/:tab?">
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        </Route>
        
        {/* Analysis Routes */}
        <Route path="/analysis/tasks">
          <ProtectedRoute>
            <AnalysisTasks />
          </ProtectedRoute>
        </Route>
        <Route path="/analysis/labor">
          <ProtectedRoute>
            <AnalysisLabor />
          </ProtectedRoute>
        </Route>
        <Route path="/analysis/materials">
          <ProtectedRoute>
            <AnalysisMaterials />
          </ProtectedRoute>
        </Route>
        <Route path="/analysis/indirects">
          <ProtectedRoute>
            <AnalysisIndirects />
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
            <Movements />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/analysis">
          <ProtectedRoute>
            <FinancesAnalysis />
          </ProtectedRoute>
        </Route>

        <Route path="/finances/capital-movements">
          <ProtectedRoute>
            <FinancesCapitalMovements />
          </ProtectedRoute>
        </Route>
        <Route path="/finances/clients">
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        </Route>


        {/* Profile Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/profile/organizations">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/profile/preferences">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
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

        {/* Provider Routes */}
        <Route path="/proveedor/productos">
          <ProtectedRoute>
            <Products />
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
        <ActionBarMobileProvider>
          <ProjectContextInitializer />
          <Toaster />
          <Router />
          <ModalFactory />
        </ActionBarMobileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
