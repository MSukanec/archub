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
import OrganizationDashboard from "@/pages/organization/OrganizationDashboard";
import OrganizationBasicData from "@/pages/organization/OrganizationBasicData";
import ProfileProjects from "@/pages/profile/ProfileProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import OrganizationMembers from "@/pages/organization/OrganizationMembers";
import OrganizationActivity from "@/pages/organization/OrganizationActivity";


import FinancesClients from "@/pages/finances/FinancesClients";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import FinancesMovements from "@/pages/finances/FinancesMovements";
import FinancesAnalysis from "@/pages/finances/FinancesAnalysis";
import FinancesInstallments from "@/pages/finances/FinancesInstallments";
import FinancesCapitalMovements from "@/pages/finances/FinancesCapitalMovements";
import FinancesSubcontracts from "@/pages/finances/FinancesSubcontracts";

import OrganizationPreferences from "@/pages/organization/OrganizationPreferences";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";
import ConstructionLogs from "@/pages/construction/ConstructionLogs";
import ConstructionPersonnel from "@/pages/construction/ConstructionPersonnel";
import ConstructionBudgets from "@/pages/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/construction/ConstructionMaterials";
import ConstructionCostAnalysis from "@/pages/construction/ConstructionCostAnalysis";
import ConstructionTasks from "@/pages/construction/ConstructionTasks";

import ConstructionSchedule from "@/pages/construction/ConstructionSchedule";
import ConstructionSubcontracts from "@/pages/construction/ConstructionSubcontracts";
import DesignDashboard from "@/pages/design/DesignDashboard";
import Library from "@/pages/Library";
import OrganizationBoard from "@/pages/organization/OrganizationBoard";
import ProfileOrganizations from "@/pages/profile/ProfileOrganizations";

import ProfileBasicData from "@/pages/profile/ProfileBasicData";
import ProfileSettings from "@/pages/profile/ProfileSettings";
import Onboarding from "@/pages/Onboarding";
import SelectMode from "@/pages/others/SelectMode";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrganizations from "@/pages/admin/AdminOrganizations";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminGeneratedTasks from "@/pages/admin/AdminGeneratedTasks";
import AdminTaskParameters from "@/pages/admin/AdminTaskParameters";
import AdminTaskTemplates from "@/pages/admin/AdminTaskTemplates";

import AdminMaterials from "@/pages/admin/AdminMaterials";
import AdminMaterialCategories from "@/pages/admin/AdminMaterialCategories";
import AdminMaterialPrices from "@/pages/admin/AdminMaterialPrices";
import AdminBrands from "@/pages/admin/AdminBrands";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminUnitPresentations from "@/pages/admin/AdminUnitPresentations";
import AdminMovementConcepts from "@/pages/admin/AdminMovementConcepts";
import AdminChangelogs from "@/pages/admin/AdminChangelogs";
import AdminCategories from "@/pages/admin/AdminCategories";


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

        {/* Main Dashboard - redirects to Organization Dashboard */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        </Route>

        {/* Organization Routes */}
        <Route path="/organization">
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/organization/dashboard">
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/organization/basic-data">
          <ProtectedRoute>
            <OrganizationBasicData />
          </ProtectedRoute>
        </Route>
        <Route path="/profile/projects">
          <ProtectedRoute>
            <ProfileProjects />
          </ProtectedRoute>
        </Route>
        <Route path="/organization/contacts">
          <ProtectedRoute>
            <OrganizationContacts />
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
        <Route path="/organization/board">
          <ProtectedRoute>
            <OrganizationBoard />
          </ProtectedRoute>
        </Route>
        <Route path="/organizaciones">
          <ProtectedRoute>
            <ProfileOrganizations />
          </ProtectedRoute>
        </Route>
        <Route path="/organizations">
          <ProtectedRoute>
            <ProfileOrganizations />
          </ProtectedRoute>
        </Route>

        {/* Projects Routes */}
        <Route path="/projects">
          <ProtectedRoute>
            <ProfileProjects />
          </ProtectedRoute>
        </Route>


        <Route path="/finances/clients">
          <ProtectedRoute>
            <FinancesClients />
          </ProtectedRoute>
        </Route>
        
        {/* Library Route */}
        <Route path="/library">
          <ProtectedRoute>
            <Library />
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

        <Route path="/construction/schedule">
          <ProtectedRoute>
            <ConstructionSchedule />
          </ProtectedRoute>
        </Route>
        <Route path="/construction/subcontracts">
          <ProtectedRoute>
            <ConstructionSubcontracts />
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
        <Route path="/construction/cost-analysis">
          <ProtectedRoute>
            <ConstructionCostAnalysis />
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
        <Route path="/finances/subcontracts">
          <ProtectedRoute>
            <FinancesSubcontracts />
          </ProtectedRoute>
        </Route>

        <Route path="/organization/preferences">
          <ProtectedRoute>
            <OrganizationPreferences />
          </ProtectedRoute>
        </Route>

        {/* Profile Routes */}
        <Route path="/profile">
          <ProtectedRoute>
            <ProfileBasicData />
          </ProtectedRoute>
        </Route>
        <Route path="/profile/data">
          <ProtectedRoute>
            <ProfileBasicData />
          </ProtectedRoute>
        </Route>
        <Route path="/profile/settings">
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        </Route>
        <Route path="/profile/organizations">
          <ProtectedRoute>
            <ProfileOrganizations />
          </ProtectedRoute>
        </Route>

        {/* Admin Routes */}
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

        <Route path="/admin/generated-tasks">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminGeneratedTasks />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/categories">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminCategories />
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
        
        <Route path="/admin/task-templates">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminTaskTemplates />
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
        <Route path="/admin/material-prices">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminMaterialPrices />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/brands">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminBrands />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/products">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminProducts />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/unit-presentations">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminUnitPresentations />
            </AdminProtectedRoute>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/movement-concepts">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminMovementConcepts />
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
