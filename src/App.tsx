import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { ActionBarMobileProvider } from "@/components/layout/mobile/ActionBarMobileContext";
import { AuthGuard } from "@/components/ui-custom/security/AuthGuard";
import { AuthAdmin } from "@/components/ui-custom/security/AuthAdmin";

// Public Pages
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";

// Protected Pages


import Projects from "@/pages/professional/organization/Projects";






import FinancesDashboard from "@/pages/professional/project/finances/FinancesDashboard";
import Movements from "@/pages/professional/project/finances/movements/Movements";
import FinancesAnalysis from "@/pages/professional/project/finances/FinancesAnalysis";
import FinancesCapitalMovements from "@/pages/professional/project/finances/FinancesCapitalMovements";
import { Clients } from "@/pages/professional/project/finances/clients/Clients";


import Preferences from "@/pages/professional/organization/Preferences";
import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Logs from "@/pages/professional/project/construction/logs/Logs";
import ConstructionPersonnel from "@/pages/professional/project/construction/ConstructionPersonnel";
import ConstructionBudgets from "@/pages/professional/project/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/professional/project/construction/ConstructionMaterials";
import Analysis from "@/pages/professional/project/resources/analysis/Analysis";
import ConstructionTasks from "@/pages/professional/project/construction/tasks/Tasks";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import DesignDashboard from "@/pages/professional/project/design/DesignDashboard";
import Documentation from "@/pages/professional/project/resources/Documentation";
import Gallery from "@/pages/professional/project/resources/Gallery";
import Contacts from "@/pages/professional/project/resources/Contacts";
import Board from "@/pages/professional/project/resources/Board";

import OrganizationDashboard from "@/pages/professional/organization/OrganizationDashboard";
import Members from "@/pages/professional/organization/members/Members";

import Profile from "@/pages/profile/Profile";
import OrganizationData from "@/pages/professional/organization/data/OrganizationData";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Activity from "@/pages/professional/organization/Activity";

// Admin Pages
import AdminCommunity from "@/pages/admin/community/AdminCommunity";



import AdminMaterials from "@/pages/admin/materials/AdminMaterials";
import AdminTasks from "@/pages/admin/tasks/AdminTasks";
import AdminGeneral from "@/pages/admin/general/AdminGeneral";

// Provider Pages  
import Products from "@/pages/providers/products/Products";

// Analysis Pages
import AnalysisTasks from "@/pages/professional/analysis/tasks/Tasks";
import AnalysisLabor from "@/pages/professional/analysis/labor/Labor";
import AnalysisMaterials from "@/pages/professional/analysis/materials/Materials";
import AnalysisIndirects from "@/pages/professional/analysis/indirects/Indirects";










import NotFound from "@/pages/public/NotFound";
import { ModalFactory } from "@/components/modal/form/ModalFactory";
import { ProjectContextInitializer } from "@/components/navigation/ProjectContextInitializer";

function Router() {
  return (
    <AuthGuard>
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
        <Route path="/dashboard" component={OrganizationDashboard} />

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/preferences" component={Preferences} />
        <Route path="/organization/activity" component={Activity} />
        <Route path="/organization/data" component={OrganizationData} />

        <Route path="/organization/members" component={Members} />
        
        <Route path="/organization" component={Members} />


        <Route path="/organization/projects" component={Projects} />



        <Route path="/recursos/board" component={Board} />

        <Route path="/organization/:organizationId" component={Members} />

        {/* Projects Routes */}
        <Route path="/projects" component={Projects} />


        <Route path="/finances/clients" component={Clients} />
        


        {/* Resources Routes */}
        <Route path="/recursos/documentacion" component={Documentation} />
        <Route path="/recursos/galeria" component={Gallery} />
        <Route path="/recursos/contactos" component={Contacts} />

        {/* Design Routes */}
        <Route path="/design/dashboard" component={DesignDashboard} />




        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />
        <Route path="/construction/tasks" component={ConstructionTasks} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/logs" component={Logs} />
        <Route path="/construction/personnel" component={ConstructionPersonnel} />
        <Route path="/construction/budgets" component={ConstructionBudgets} />
        <Route path="/construction/materials" component={ConstructionMaterials} />
        <Route path="/recursos/cost-analysis" component={Analysis} />
        <Route path="/resources/analysis" component={Analysis} />
        <Route path="/resources/analysis/:tab?" component={Analysis} />
        
        {/* Analysis Routes */}
        <Route path="/analysis/tasks" component={AnalysisTasks} />
        <Route path="/analysis/labor" component={AnalysisLabor} />
        <Route path="/analysis/materials" component={AnalysisMaterials} />
        <Route path="/analysis/indirects" component={AnalysisIndirects} />


        {/* Finances Routes */}
        <Route path="/finances" component={FinancesDashboard} />
        <Route path="/finances/dashboard" component={FinancesDashboard} />
        <Route path="/finances/movements" component={Movements} />
        <Route path="/finances/analysis" component={FinancesAnalysis} />

        <Route path="/finances/capital-movements" component={FinancesCapitalMovements} />
        <Route path="/finances/clients" component={Clients} />


        {/* Profile Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/profile/organizations" component={Profile} />
        <Route path="/profile/preferences" component={Profile} />
        <Route path="/profile" component={Profile} />



        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <AuthAdmin>
            <AdminCommunity />
          </AuthAdmin>
        </Route>









        



        <Route path="/admin/materials">
          <AuthAdmin>
            <AdminMaterials />
          </AuthAdmin>
        </Route>

        <Route path="/admin/tasks">
          <AuthAdmin>
            <AdminTasks />
          </AuthAdmin>
        </Route>

        <Route path="/admin/general">
          <AuthAdmin>
            <AdminGeneral />
          </AuthAdmin>
        </Route>

        {/* Provider Routes */}
        <Route path="/proveedor/productos" component={Products} />





        {/* 404 Route - Must be last */}
        <Route path="*" component={NotFound} />
      </Switch>
    </AuthGuard>
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
