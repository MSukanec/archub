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






import FinancesCapitalMovements from "@/pages/professional/finances/capital/Capital";
import OrganizationMovements from "@/pages/professional/finances/movements/Movements";
import { Clients } from "@/pages/professional/project/commercialization/clients/Clients";
import Project from "@/pages/professional/project/dashboard/Project";


import Preferences from "@/pages/professional/organization/preferences/Preferences";
import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Logs from "@/pages/professional/project/construction/logs/Logs";
import ConstructionPersonnel from "@/pages/professional/project/construction/ConstructionPersonnel";
import ConstructionBudgets from "@/pages/professional/project/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/professional/project/construction/ConstructionMaterials";
import ConstructionTasks from "@/pages/professional/project/construction/tasks/Tasks";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import ConstructionIndirects from "@/pages/professional/project/construction/indirects/Indirects";
import Media from "@/pages/professional/general/media/Media";
import Contacts from "@/pages/professional/organization/contacts/Contacts";
import Calendar from "@/pages/professional/general/calendar/Calendar";

import OrganizationDashboard from "@/pages/professional/organization/OrganizationDashboard";

import Profile from "@/pages/profile/Profile";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Activity from "@/pages/professional/organization/Activity";

// Admin Pages
import AdminCommunity from "@/pages/admin/community/AdminCommunity";



import AdminCosts from "@/pages/admin/costs/AdminCosts";
import AdminTasks from "@/pages/admin/tasks/AdminTasks";
import AdminGeneral from "@/pages/admin/general/AdminGeneral";

// Provider Pages  
import Products from "@/pages/providers/products/Products";

// Analysis Pages
import Analysis from "@/pages/professional/analysis/Analysis";
import TaskView from "@/pages/professional/analysis/TaskView";
import GeneralCosts from "@/pages/professional/finances/general-costs/GeneralCosts";










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
        <Route path="/organization/dashboard" component={OrganizationDashboard} />
        <Route path="/organization/preferences" component={Preferences} />
        <Route path="/organization/activity" component={Activity} />
        <Route path="/organization/contacts" component={Contacts} />
        <Route path="/organization/projects" component={Projects} />
        <Route path="/finances/general-costs" component={GeneralCosts} />
        
        <Route path="/organization" component={OrganizationDashboard} />

        <Route path="/general/calendar" component={Calendar} />


        {/* Projects Routes */}
        <Route path="/projects" component={Projects} />

        {/* General Routes */}
        <Route path="/project/dashboard" component={Project} />
        <Route path="/commercialization/clients" component={Clients} />
        <Route path="/general/media" component={Media} />
        







        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />
        <Route path="/construction/tasks" component={ConstructionTasks} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/indirects" component={ConstructionIndirects} />
        <Route path="/construction/logs" component={Logs} />
        <Route path="/construction/personnel" component={ConstructionPersonnel} />
        <Route path="/construction/budgets" component={ConstructionBudgets} />
        <Route path="/construction/materials" component={ConstructionMaterials} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/analysis/:id" component={TaskView} />
        


        {/* Finances Routes */}
        <Route path="/finances/dashboard" component={FinancesCapitalMovements} />

        <Route path="/finances/capital" component={FinancesCapitalMovements} />
        <Route path="/finances/movements" component={OrganizationMovements} />
        
        {/* Duplicate General Routes for compatibility */}
        <Route path="/project/dashboard" component={Project} />
        <Route path="/commercialization/clients" component={Clients} />


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
            <AdminCosts />
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
        <Route path="/proveedor/productos">
          <AuthAdmin>
            <Products />
          </AuthAdmin>
        </Route>
        
        <Route path="/providers/products">
          <AuthAdmin>
            <Products />
          </AuthAdmin>
        </Route>





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
