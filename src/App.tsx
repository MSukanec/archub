import { Switch, Route } from "wouter";
import { useEffect, lazy, Suspense } from "react";
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


import Projects from "@/pages/professional/projects/Projects";
import ProjectView from "@/pages/professional/projects/ProjectView";






import FinancesCapitalMovements from "@/pages/professional/capital/Capital";
import OrganizationMovements from "@/pages/professional/movements/Movements";
import { Clients } from "@/pages/professional/clients/Clients";
import Project from "@/pages/professional/project/dashboard/Project";


import Preferences from "@/pages/professional/preferences/Preferences";
import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Logs from "@/pages/professional/project/construction/logs/Logs";
import ConstructionPersonnel from "@/pages/professional/project/construction/ConstructionPersonnel";
import Materials from "@/pages/professional/materials/Materials";
import Budgets from "@/pages/professional/budgets/Budgets";
import BudgetView from "@/pages/professional/budgets/BudgetView";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import ConstructionIndirects from "@/pages/professional/project/construction/indirects/Indirects";
import Media from "@/pages/professional/media/Media";
import Contacts from "@/pages/professional/contacts/Contacts";
import Calendar from "@/pages/professional/calendar/Calendar";

import OrganizationDashboard from "@/pages/professional/organization/OrganizationDashboard";

import Profile from "@/pages/profile/Profile";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Activity from "@/pages/professional/organization/Activity";

// Admin Pages (Lazy Loaded - solo admins las usan)
const AdminCommunity = lazy(() => import("@/pages/admin/community/AdminCommunity"));
const AdminCosts = lazy(() => import("@/pages/admin/costs/AdminCosts"));
const AdminTasks = lazy(() => import("@/pages/admin/tasks/AdminTasks"));
const AdminGeneral = lazy(() => import("@/pages/admin/general/AdminGeneral"));
const AdminCourses = lazy(() => import("@/pages/admin/courses/AdminCourses"));
const AdminCourseView = lazy(() => import("@/pages/admin/courses/AdminCourseView"));

// Provider Pages (Lazy Loaded - solo admins las usan)
const Products = lazy(() => import("@/pages/providers/products/Products"));

// Analysis Pages
import Analysis from "@/pages/professional/analysis/Analysis";
import TaskView from "@/pages/professional/analysis/TaskView";
import MaterialsView from "@/pages/professional/analysis/material-costs/MaterialsView";
import GeneralCosts from "@/pages/professional/finances/general-costs/GeneralCosts";

// Learning Pages
import LearningDashboard from "@/pages/learning/dashboard/LearningDashboard";
import CourseList from "@/pages/learning/courses/CourseList";
import CourseView from "@/pages/learning/courses/CourseView";
import PaymentReturn from "@/pages/learning/PaymentReturn";
import CheckoutPage from "@/pages/checkout/CheckoutPage";

// Notifications
import Notifications from "@/pages/Notifications";

// Home
import Home from "@/pages/Home";








import NotFound from "@/pages/public/NotFound";
import { ModalFactory } from "@/components/modal/form/ModalFactory";
import { ProjectContextInitializer } from "@/components/navigation/ProjectContextInitializer";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

function LazyLoadFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}

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

        {/* Home - Main landing page after onboarding */}
        <Route path="/home" component={Home} />

        {/* Main Dashboard - Independent dashboard */}
        <Route path="/dashboard" component={OrganizationDashboard} />

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/dashboard" component={OrganizationDashboard} />
        <Route path="/organization/preferences" component={Preferences} />
        <Route path="/organization/activity" component={Activity} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/organization/projects" component={Projects} />
        <Route path="/finances/general-costs" component={GeneralCosts} />
        
        <Route path="/organization" component={OrganizationDashboard} />

        <Route path="/calendar" component={Calendar} />


        {/* Projects Routes */}
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectView} />

        {/* General Routes */}
        <Route path="/project/dashboard" component={Project} />
        <Route path="/clients" component={Clients} />
        <Route path="/media" component={Media} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/professional/budgets" component={Budgets} />
        <Route path="/professional/budgets/view/:id" component={BudgetView} />
        







        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/indirects" component={ConstructionIndirects} />
        <Route path="/construction/logs" component={Logs} />
        <Route path="/construction/personnel" component={ConstructionPersonnel} />
        <Route path="/construction/materials" component={Materials} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/analysis/:id" component={TaskView} />
        <Route path="/analysis/materials/:id" component={MaterialsView} />
        
        {/* Learning Routes */}
        <Route path="/learning/dashboard" component={LearningDashboard} />
        <Route path="/learning/courses" component={CourseList} />
        <Route path="/learning/courses/:id" component={CourseView} />
        <Route path="/learning/retorno" component={PaymentReturn} />
        <Route path="/checkout" component={CheckoutPage} />

        {/* Finances Routes */}
        <Route path="/finances/dashboard" component={FinancesCapitalMovements} />

        <Route path="/finances/capital" component={FinancesCapitalMovements} />
        <Route path="/movements" component={OrganizationMovements} />
        
        {/* Duplicate General Routes for compatibility */}
        <Route path="/project/dashboard" component={Project} />
        <Route path="/clients" component={Clients} />


        {/* Profile Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/profile/organizations" component={Profile} />
        <Route path="/profile/preferences" component={Profile} />
        <Route path="/profile" component={Profile} />



        {/* Admin Routes - Lazy Loaded (solo se cargan cuando un admin accede) */}
        <Route path="/admin/community">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCommunity />
            </AuthAdmin>
          </Suspense>
        </Route>






        



        <Route path="/admin/costs">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCosts />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/tasks">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminTasks />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/general">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminGeneral />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/courses/:id">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCourseView />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/courses">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCourses />
            </AuthAdmin>
          </Suspense>
        </Route>

        {/* Provider Routes - Lazy Loaded (solo se cargan cuando un admin accede) */}
        <Route path="/proveedor/productos">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <Products />
            </AuthAdmin>
          </Suspense>
        </Route>
        
        <Route path="/providers/products">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <Products />
            </AuthAdmin>
          </Suspense>
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
