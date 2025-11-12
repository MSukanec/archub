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
import Privacy from "@/pages/Privacy";

// Protected Pages


import Projects from "@/pages/professional/projects/Projects";






import FinancesCapitalMovements from "@/pages/professional/capital/Capital";
import OrganizationMovements from "@/pages/professional/movements/Movements";
import { Clients } from "@/pages/professional/clients/Clients";
import Project from "@/pages/professional/project/dashboard/Project";
import ProjectData from "@/pages/professional/project-data/ProjectData";


import OrganizationPreferences from "@/pages/professional/organization-preferences/OrganizationPreferences";
import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Logs from "@/pages/professional/project/construction/logs/Logs";
import Personnel from "@/pages/professional/personnel/Personnel";
import Materials from "@/pages/professional/materials/Materials";
import Budgets from "@/pages/professional/budgets/Budgets";
import BudgetView from "@/pages/professional/budgets/BudgetView";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import ConstructionIndirects from "@/pages/professional/project/construction/indirects/Indirects";
import Contacts from "@/pages/professional/contacts/Contacts";
import Calendar from "@/pages/professional/calendar/Calendar";

// Media Pages (Lazy Loaded - incluye librerías pesadas de PDF)
const Media = lazy(() => import("@/pages/professional/media/Media"));

import OrganizationDashboard from "@/pages/professional/organization/OrganizationDashboard";

import Profile from "@/pages/profile/Profile";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Activity from "@/pages/activity/Activity";

// Admin Pages (Lazy Loaded - solo admins las usan)
const AdminAdmin = lazy(() => import("@/pages/admin/administration/AdminAdmin"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminSupport = lazy(() => import("@/pages/admin/support/AdminSupport"));
const AdminPayments = lazy(() => import("@/pages/admin/payments/AdminPayments"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/subscriptions/AdminSubscriptions"));
const AdminCosts = lazy(() => import("@/pages/admin/costs/AdminCosts"));
const AdminTasks = lazy(() => import("@/pages/admin/tasks/AdminTasks"));
const AdminGeneral = lazy(() => import("@/pages/admin/general/AdminGeneral"));
const AdminCourses = lazy(() => import("@/pages/admin/courses/AdminCourses"));
const AdminCourseView = lazy(() => import("@/pages/admin/courses/AdminCourseView"));
const AdminLayout = lazy(() => import("@/pages/admin/layout/AdminLayout"));

// Provider Pages (Lazy Loaded - solo admins las usan)
const Products = lazy(() => import("@/pages/providers/products/Products"));

// Analysis Pages
import Analysis from "@/pages/professional/analysis/Analysis";
import TaskView from "@/pages/professional/analysis/TaskView";
import MaterialsView from "@/pages/professional/analysis/material-costs/MaterialsView";
import GeneralCosts from "@/pages/professional/finances/general-costs/GeneralCosts";

// Community Pages
import Community from "@/pages/community/Community";
import CommunityMap from "@/pages/community/CommunityMap";

// Learning Pages (Lazy Loaded - incluye reproductor Vimeo pesado)
const LearningDashboard = lazy(() => import("@/pages/learning/dashboard/LearningDashboard"));
const CourseList = lazy(() => import("@/pages/learning/courses/CourseList"));
const CourseView = lazy(() => import("@/pages/learning/courses/CourseView"));
const PaymentReturn = lazy(() => import("@/pages/learning/PaymentReturn"));
const CheckoutPage = lazy(() => import("@/pages/checkout/CheckoutPage"));
const SubscriptionCheckout = lazy(() => import("@/pages/checkout/SubscriptionCheckout"));

// Notifications
import Notifications from "@/pages/settings/Notifications";

// Home
import Home from "@/pages/Home";

// Pricing
import PricingPlan from "@/pages/PricingPlan";

// Settings Pages
import Billing from "@/pages/settings/Billing";
import Members from "@/pages/settings/Members";








import NotFound from "@/pages/public/NotFound";
import { ModalFactory } from "@/components/modal/form/ModalFactory";
import { ProjectContextInitializer } from "@/components/navigation/ProjectContextInitializer";
import { PresenceInitializer } from "@/components/navigation/PresenceInitializer";
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
        <Route path="/privacy" component={Privacy} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Onboarding and Mode Selection Routes */}
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/select-mode" component={SelectMode} />

        {/* Home - Main landing page after onboarding */}
        <Route path="/home" component={Home} />

        {/* Pricing - Plans and pricing page */}
        <Route path="/pricing" component={PricingPlan} />

        {/* Main Dashboard - Independent dashboard */}
        <Route path="/dashboard" component={OrganizationDashboard} />

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/dashboard" component={OrganizationDashboard} />
        <Route path="/organization/preferences" component={OrganizationPreferences} />
        <Route path="/organization/activity" component={Activity} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/organization/projects" component={Projects} />
        <Route path="/finances/general-costs" component={GeneralCosts} />
        
        <Route path="/organization" component={OrganizationDashboard} />

        <Route path="/calendar" component={Calendar} />


        {/* Projects Routes */}
        <Route path="/projects" component={Projects} />

        {/* General Routes */}
        <Route path="/project/dashboard" component={Project} />
        <Route path="/project" component={ProjectData} />
        <Route path="/clients" component={Clients} />
        <Route path="/media">
          <Suspense fallback={<LazyLoadFallback />}>
            <Media />
          </Suspense>
        </Route>
        <Route path="/budgets" component={Budgets} />
        <Route path="/professional/budgets" component={Budgets} />
        <Route path="/professional/budgets/view/:id" component={BudgetView} />
        







        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/indirects" component={ConstructionIndirects} />
        <Route path="/construction/logs" component={Logs} />
        <Route path="/construction/personnel" component={Personnel} />
        <Route path="/construction/materials" component={Materials} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/analysis/:id" component={TaskView} />
        <Route path="/analysis/materials/:id" component={MaterialsView} />
        
        {/* Community Routes */}
        <Route path="/community/dashboard" component={Community} />
        <Route path="/community/map" component={CommunityMap} />
        <Route path="/community" component={Community} />

        {/* Settings Routes */}
        <Route path="/settings/billing" component={Billing} />
        <Route path="/settings/members" component={Members} />
        
        {/* Learning Routes - Lazy Loaded (incluye reproductor Vimeo pesado) */}
        <Route path="/learning/dashboard">
          <Suspense fallback={<LazyLoadFallback />}>
            <LearningDashboard />
          </Suspense>
        </Route>
        <Route path="/learning/courses">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseList />
          </Suspense>
        </Route>
        <Route path="/learning/courses/:id">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseView />
          </Suspense>
        </Route>
        <Route path="/learning/retorno">
          <Suspense fallback={<LazyLoadFallback />}>
            <PaymentReturn />
          </Suspense>
        </Route>
        <Route path="/checkout">
          <Suspense fallback={<LazyLoadFallback />}>
            <CheckoutPage />
          </Suspense>
        </Route>
        <Route path="/subscription/checkout">
          <Suspense fallback={<LazyLoadFallback />}>
            <SubscriptionCheckout />
          </Suspense>
        </Route>

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
        <Route path="/admin/dashboard">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminDashboard />
            </AuthAdmin>
          </Suspense>
        </Route>
        <Route path="/admin/administration">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminAdmin />
            </AuthAdmin>
          </Suspense>
        </Route>
        <Route path="/admin/support">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminSupport />
            </AuthAdmin>
          </Suspense>
        </Route>
        <Route path="/admin/payments">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminPayments />
            </AuthAdmin>
          </Suspense>
        </Route>
        <Route path="/admin/subscriptions">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminSubscriptions />
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

        <Route path="/admin/layout">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminLayout />
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
          <PresenceInitializer />
          <Toaster />
          <Router />
          <ModalFactory />
        </ActionBarMobileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
