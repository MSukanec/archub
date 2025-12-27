import { Switch, Route } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { ActionBarMobileProvider } from "@/layouts";
import { AuthGuard, AuthAdmin } from "@/features/users";

// Public Pages
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";
import Privacy from "@/pages/public/Privacy";
import Contact from "@/pages/public/Contact";
import CourseLanding from "@/pages/public/CourseLanding";
import CourseCatalog from "@/pages/public/CourseCatalog";
import FoundersPage from "@/pages/public/FoundersPage";
import PricingPlanPublic from "@/pages/public/PricingPlan";

// Protected Pages


import OrganizationProjectsPage from "@/pages/dashboard/OrganizationProjectsPage";
import ProjectDashboardPage from "@/pages/dashboard/ProjectDashboardPage";
import ProjectDataPage from "@/pages/dashboard/ProjectDataPage";
import TasksPage from "@/pages/dashboard/TasksPage";




import FinancesCapitalMovements from "@/pages/professional/capital/Capital";
import OrganizationMovements from "@/pages/professional/movements/Movements";
import { ClientsPage } from "@/pages/dashboard/ClientsPage";


import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Sitelog from "@/pages/sitelog/Sitelog";
import PersonnelPage from "@/pages/dashboard/PersonnelPage";
import Materials from "@/pages/professional/materials/Materials";
import Budgets from "@/pages/professional/budgets/Budgets";
import BudgetView from "@/pages/professional/budgets/BudgetView";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import ConstructionIndirects from "@/pages/professional/project/construction/indirects/Indirects";
import { ContactsPage } from "@/pages/dashboard/ContactsPage";
import Calendar from "@/pages/professional/calendar/Calendar";

// Media Pages
import Media from "@/pages/media/Media";

// Moodboard Pages
import Moodboard from "@/pages/moodboard/Moodboard";

import { OrganizationDashboardPage } from "@/pages/dashboard/OrganizationDashboardPage";
import { OrganizationDataPage } from "@/pages/dashboard/OrganizationDataPage";
import { OrganizationSettingsPage } from "@/pages/dashboard/OrganizationSettingsPage";

import UserPage from "@/pages/dashboard/UserPage";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Home from "@/pages/Home";

// Lab Pages (Lazy Loaded - experimental POCs)
const FinancialLatticePage = lazy(() => import("@/pages/lab/FinancialLatticePage"));
const ContactsLabPage = lazy(() => import("@/pages/lab/ContactsLabPage"));

// Admin Pages (importados normalmente para evitar loader)
import AdminAdmin from "@/pages/admin/administration/AdminAdmin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSupport from "@/pages/admin/support/AdminSupport";
import AdminPayments from "@/pages/admin/payments/AdminPayments";
import AdminSubscriptions from "@/pages/admin/subscriptions/AdminSubscriptions";
import AdminCosts from "@/pages/admin/costs/AdminCosts";
import AdminTasks from "@/pages/admin/tasks/AdminTasks";
import AdminGeneral from "@/pages/admin/general/AdminGeneral";
import AdminCoursesPage from "@/pages/admin/AdminCoursesPage";
import AdminCourseSettingsPage from "@/pages/admin/AdminCourseSettingsPage";
import AdminLayoutPage from "@/pages/admin/AdminLayoutPage";
import AdminEmailTemplates from "@/pages/admin/email-templates/EmailTemplatesAdmin";
import AdminOps from "@/pages/admin/ops/AdminOps";

// Provider Pages (Lazy Loaded - solo admins las usan)
const Products = lazy(() => import("@/pages/providers/products/Products"));

// Analysis Pages
import Analysis from "@/pages/professional/analysis/Analysis";
import TaskView from "@/pages/professional/analysis/TaskView";
import MaterialsView from "@/pages/professional/analysis/material-costs/MaterialsView";
import GeneralCostsPage from "@/pages/dashboard/GeneralCostsPage";

// Community Pages
import Community from "@/pages/community/Community";
import CommunityMap from "@/pages/community/CommunityMap";

// Client Portal Pages (Lazy Loaded - para clientes externos)
const ClientPortal = lazy(() => import("@/pages/client-portal/ClientPortal"));
const PortalAuthCallback = lazy(() => import("@/pages/client-portal/PortalAuthCallback"));

// Learning Pages (importado normalmente para evitar loader)
import LearningDashboardPage from "@/pages/learning/LearningDashboardPage";
import CoursesListPage from "@/pages/learning/CoursesListPage";

// Founders Portal (Lazy Loaded - solo fundadores)
const FoundersPortalPage = lazy(() => import("@/features/founders-portal").then(m => ({ default: m.FoundersPortalPage })));
const CourseLandingPage = lazy(() => import("@/pages/learning/CourseLandingPage"));
const CoursePage = lazy(() => import("@/pages/learning/CoursePage"));
const CourseLandingPrivate = lazy(() => import("@/pages/professional/learning/CourseLanding"));
const PaymentReturnPage = lazy(() => import("@/pages/learning/PaymentReturnPage"));
const CheckoutPage = lazy(() => import("@/pages/checkout/CheckoutPage"));
const MPSeatSubscriptionSuccess = lazy(() => import("@/pages/MPSeatSubscriptionSuccess"));
const SubscriptionCheckout = lazy(() => import("@/pages/checkout/SubscriptionCheckout"));

// Finances Pages
import { OrganizationFinancesPage } from "@/pages/dashboard/OrganizationFinancesPage";
import { ProjectFinancesPage } from "@/pages/dashboard/ProjectFinancesPage";

// Settings Pages
import PricingPlan from "@/pages/settings/PricingPlan";
import CapitalPage from "@/pages/dashboard/CapitalPage";

// User Page








import NotFound from "@/pages/public/NotFound";
import { ModalProvider } from "@/components/modal";
import { PresenceInitializer, ProjectContextInitializer } from "@/layouts/initializers";
import { LoadingSpinner } from "@/components/shared/layout/LoadingSpinner";

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
        {/* Client Portal Routes - Public via AuthGuard config */}
        <Route path="/portal/auth/callback">
          <Suspense fallback={<LazyLoadFallback />}>
            <PortalAuthCallback />
          </Suspense>
        </Route>
        <Route path="/portal/:projectId">
          <Suspense fallback={<LazyLoadFallback />}>
            <ClientPortal />
          </Suspense>
        </Route>

        {/* Public Routes */}
        <Route path="/" component={Landing} />
          <Route path="/precios" component={PricingPlanPublic} />
          <Route path="/founders" component={FoundersPage} />
          <Route path="/cursos" component={CourseCatalog} />
          <Route path="/cursos/:slug" component={CourseLanding} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/contact" component={Contact} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />

        {/* Onboarding and Mode Selection Routes */}
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/select-mode" component={SelectMode} />
        
        {/* Home Route - Redirects to correct dashboard based on user mode */}
        <Route path="/home" component={Home} />

        {/* Main Dashboard - Independent dashboard */}
        <Route path="/dashboard" component={OrganizationDashboardPage} />

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero */}
        <Route path="/organization/dashboard" component={OrganizationDashboardPage} />
        <Route path="/organization/basic-data" component={OrganizationDataPage} />
        <Route path="/organization/activity" component={OrganizationSettingsPage} />
        <Route path="/organization/founders-portal">
          <Suspense fallback={<LazyLoadFallback />}>
            <FoundersPortalPage />
          </Suspense>
        </Route>
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/organization/projects" component={OrganizationProjectsPage} />
        
        {/* General Costs Route */}
        <Route path="/general-costs" component={GeneralCostsPage} />
        
        {/* Finances Routes */}
        <Route path="/finances" component={OrganizationFinancesPage} />
        <Route path="/project/finances" component={ProjectFinancesPage} />
        
        <Route path="/organization" component={OrganizationDashboardPage} />

        <Route path="/calendar" component={Calendar} />


        {/* Projects Routes */}
        <Route path="/projects" component={OrganizationProjectsPage} />

        {/* General Routes */}
        <Route path="/project/dashboard" component={ProjectDashboardPage} />
        <Route path="/project" component={ProjectDataPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/media" component={Media} />
        <Route path="/project/moodboard" component={Moodboard} />
        <Route path="/project/tasks" component={TasksPage} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/professional/budgets" component={Budgets} />
        <Route path="/professional/budgets/view/:id" component={BudgetView} />
        







        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/indirects" component={ConstructionIndirects} />
        <Route path="/construction/logs" component={Sitelog} />
        <Route path="/construction/personnel" component={PersonnelPage} />
        <Route path="/construction/materials" component={Materials} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/analysis/:id" component={TaskView} />
        <Route path="/analysis/materials/:id" component={MaterialsView} />
        
        {/* Community Routes */}
        <Route path="/community/dashboard" component={Community} />
        <Route path="/community/map" component={CommunityMap} />
        <Route path="/community" component={Community} />

        {/* Organization Settings Routes */}
        <Route path="/organization/billing" component={OrganizationSettingsPage} />
        <Route path="/organization/settings" component={OrganizationSettingsPage} />
        <Route path="/organization/members" component={OrganizationSettingsPage} />
        <Route path="/organization/capital" component={CapitalPage} />
        <Route path="/settings/pricing-plan" component={PricingPlan} />
        
        {/* User Page */}
        <Route path="/user" component={UserPage} />
        
        {/* Legacy pricing route - redirect to settings */}
        <Route path="/pricing-plan" component={PricingPlan} />
        
        {/* Learning Routes */}
        <Route path="/learning/dashboard" component={LearningDashboardPage} />
        <Route path="/learning/courses" component={CoursesListPage} />
        <Route path="/learning/courses/:slug/info">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseLandingPage />
          </Suspense>
        </Route>
        <Route path="/learning/courses/:id">
          <Suspense fallback={<LazyLoadFallback />}>
            <CoursePage />
          </Suspense>
        </Route>
        <Route path="/learning/landing/:slug">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseLandingPrivate />
          </Suspense>
        </Route>
        <Route path="/learning/retorno">
          <Suspense fallback={<LazyLoadFallback />}>
            <PaymentReturnPage />
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
        
        {/* MP Payment Return Routes - Redirect to API endpoints */}
        <Route path="/mp/seat-subscription-success">
          <Suspense fallback={<LazyLoadFallback />}>
            <MPSeatSubscriptionSuccess />
          </Suspense>
        </Route>

        {/* Finances Routes */}
        <Route path="/finances/dashboard" component={FinancesCapitalMovements} />

        <Route path="/finances/capital" component={FinancesCapitalMovements} />
        
        {/* Profile Routes - redirect to /user */}
        <Route path="/profile/organizations" component={UserPage} />
        <Route path="/profile/preferences" component={UserPage} />
        <Route path="/profile" component={UserPage} />



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
        <Route path="/admin/ops">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminOps />
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
              <AdminLayoutPage />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/courses/:id">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCourseSettingsPage />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/courses">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminCoursesPage />
            </AuthAdmin>
          </Suspense>
        </Route>

        <Route path="/admin/email-templates">
          <Suspense fallback={<LazyLoadFallback />}>
            <AuthAdmin>
              <AdminEmailTemplates />
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





        {/* Lab Routes - Experimental POCs */}
        <Route path="/lab/financial-lattice">
          <Suspense fallback={<LazyLoadFallback />}>
            <FinancialLatticePage />
          </Suspense>
        </Route>
        
        <Route path="/lab/contacts">
          <Suspense fallback={<LazyLoadFallback />}>
            <ContactsLabPage />
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
          <ModalProvider />
        </ActionBarMobileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
