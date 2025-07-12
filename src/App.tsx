import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { MobileActionBarProvider } from "@/components/layout/mobile/MobileActionBarContext";
import { AuthRedirect } from "@/components/ui-custom/misc/AuthRedirect";
import { ProtectedRoute } from "@/components/ui-custom/misc/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/ui-custom/misc/AdminProtectedRoute";

// Public Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Protected Pages
import OrganizationDashboard from "@/pages/organization/OrganizationDashboard";
import OrganizationProjects from "@/pages/organization/OrganizationProjects";
import OrganizationContacts from "@/pages/organization/OrganizationContacts";
import OrganizationMembers from "@/pages/organization/OrganizationMembers";
import OrganizationActivity from "@/pages/organization/OrganizationActivity";
import ProjectDashboard from "@/pages/project/ProjectDashboard";
import ProjectBasicData from "@/pages/project/ProjectBasicData";
import ProjectClients from "@/pages/project/ProjectClients";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import FinancesMovements from "@/pages/finances/FinancesMovements";
import FinancesInstallments from "@/pages/finances/FinancesInstallments";

import FinancesPreferences from "@/pages/finances/FinancesPreferences";
import ConstructionDashboard from "@/pages/construction/ConstructionDashboard";
import ConstructionLogs from "@/pages/construction/ConstructionLogs";
import ConstructionAttendance from "@/pages/construction/ConstructionAttendance";
import ConstructionBudgets from "@/pages/construction/ConstructionBudgets";
import ConstructionMaterials from "@/pages/construction/ConstructionMaterials";
import ConstructionGallery from "@/pages/construction/ConstructionGallery";
import DesignDashboard from "@/pages/design/DesignDashboard";
import DesignTimeline from "@/pages/design/DesignTimeline";
import DesignDocumentation from "@/pages/design/DesignDocumentation";
import OrganizationTasks from "@/pages/organization/OrganizationTasks";
import Changelog from "@/pages/others/Changelog";
import Profile from "@/pages/others/Profile";
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
import AdminMovementConcepts from "@/pages/admin/AdminMovementConcepts";
import AdminChangelogs from "@/pages/admin/AdminChangelogs";
import AdminCategories from "@/pages/admin/AdminCategories";

import NotFound from "@/pages/NotFound";

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
        <Route path="/onboarding">
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        </Route>
        
        <Route path="/select-mode">
          <ProtectedRoute>
            <SelectMode />
          </ProtectedRoute>
        </Route>

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
        <Route path="/organization/projects">
          <ProtectedRoute>
            <OrganizationProjects />
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

        {/* Projects Routes */}
        <Route path="/projects">
          <ProtectedRoute>
            <OrganizationProjects />
          </ProtectedRoute>
        </Route>
        <Route path="/project/dashboard">
          <ProtectedRoute>
            <ProjectDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/project/basic-data">
          <ProtectedRoute>
            <ProjectBasicData />
          </ProtectedRoute>
        </Route>
        <Route path="/project/clients">
          <ProtectedRoute>
            <ProjectClients />
          </ProtectedRoute>
        </Route>

        {/* Design Routes */}
        <Route path="/design/dashboard">
          <ProtectedRoute>
            <DesignDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/design/timeline">
          <ProtectedRoute>
            <DesignTimeline />
          </ProtectedRoute>
        </Route>
        <Route path="/design/documentation">
          <ProtectedRoute>
            <DesignDocumentation />
          </ProtectedRoute>
        </Route>

        {/* Construction Routes */}
        <Route path="/construction/dashboard">
          <ProtectedRoute>
            <ConstructionDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/construction/logs">
          <ProtectedRoute>
            <ConstructionLogs />
          </ProtectedRoute>
        </Route>
        <Route path="/construction/personnel">
          <ProtectedRoute>
            <ConstructionAttendance />
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
        <Route path="/construction/gallery">
          <ProtectedRoute>
            <ConstructionGallery />
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
        <Route path="/finances/installments">
          <ProtectedRoute>
            <FinancesInstallments />
          </ProtectedRoute>
        </Route>

        <Route path="/finances/preferences">
          <ProtectedRoute>
            <FinancesPreferences />
          </ProtectedRoute>
        </Route>

        {/* Other Routes */}
        <Route path="/tasks">
          <ProtectedRoute>
            <OrganizationTasks />
          </ProtectedRoute>
        </Route>
        <Route path="/changelog">
          <ProtectedRoute>
            <Changelog />
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
        <Route path="/admin/task-templates">
          <ProtectedRoute>
            <AdminProtectedRoute>
              <AdminTaskTemplates />
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
          <Toaster />
          <Router />
        </MobileActionBarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
