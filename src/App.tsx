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


import ProjectsPage from "@/pages/dashboard/ProjectsPage";
import ProjectDashboardPage from "@/pages/dashboard/ProjectDashboardPage";
import ProjectDataPage from "@/pages/dashboard/ProjectDataPage";




import FinancesCapitalMovements from "@/pages/professional/capital/Capital";
import OrganizationMovements from "@/pages/professional/movements/Movements";
import { Clients } from "@/pages/clients/Clients";


import ConstructionDashboard from "@/pages/professional/project/construction/ConstructionDashboard";
import Sitelog from "@/pages/sitelog/Sitelog";
import Personnel from "@/pages/professional/personnel/Personnel";
import Materials from "@/pages/professional/materials/Materials";
import Budgets from "@/pages/professional/budgets/Budgets";
import BudgetView from "@/pages/professional/budgets/BudgetView";


import ConstructionSubcontracts from "@/pages/professional/project/construction/subcontracts/Subcontracts";
import SubcontractView from "@/pages/professional/project/construction/subcontracts/SubcontractView";
import ConstructionIndirects from "@/pages/professional/project/construction/indirects/Indirects";
import Contacts from "@/pages/contacts/Contacts";
import Calendar from "@/pages/professional/calendar/Calendar";

// Media Pages
import Media from "@/pages/media/Media";

// Moodboard Pages
import Moodboard from "@/pages/moodboard/Moodboard";

import OrganizationDashboardPage from "@/pages/organization/OrganizationDashboardPage";
import OrganizationData from "@/pages/organization-data/OrganizationData";
import OrganizationSettings from "@/pages/organization-settings/OrganizationSettings";

import Profile from "@/pages/profile/Profile";

import Onboarding from "@/pages/public/Onboarding";
import SelectMode from "@/pages/public/SelectMode";
import Home from "@/pages/Home";
import Activity from "@/pages/activity/Activity";

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
import AdminCourses from "@/pages/admin/courses/AdminCourses";
import AdminCourseView from "@/pages/admin/courses/AdminCourseView";
import AdminLayout from "@/pages/admin/layout/AdminLayout";
import AdminEmailTemplates from "@/pages/admin/email-templates/EmailTemplatesAdmin";
import AdminOps from "@/pages/admin/ops/AdminOps";

// Provider Pages (Lazy Loaded - solo admins las usan)
const Products = lazy(() => import("@/pages/providers/products/Products"));

// Analysis Pages
import Analysis from "@/pages/professional/analysis/Analysis";
import TaskView from "@/pages/professional/analysis/TaskView";
import MaterialsView from "@/pages/professional/analysis/material-costs/MaterialsView";
import GeneralCosts from "@/pages/general-costs/GeneralCosts";

// Community Pages
import Community from "@/pages/community/Community";
import CommunityMap from "@/pages/community/CommunityMap";

// Client Portal Pages (Lazy Loaded - para clientes externos)
const ClientPortal = lazy(() => import("@/pages/client-portal/ClientPortal"));
const PortalAuthCallback = lazy(() => import("@/pages/client-portal/PortalAuthCallback"));

// Learning Pages (importado normalmente para evitar loader)
import LearningDashboard from "@/pages/learning/dashboard/LearningDashboard";
import CourseList from "@/pages/learning/courses/CourseList";

// Founders Portal (Lazy Loaded - solo fundadores)
const FoundersPortalPage = lazy(() => import("@/features/founders-portal").then(m => ({ default: m.FoundersPortalPage })));
const CourseInfo = lazy(() => import("@/pages/learning/courses/CourseInfo"));
const CourseView = lazy(() => import("@/pages/learning/courses/CourseView"));
const CourseLandingPrivate = lazy(() => import("@/pages/professional/learning/CourseLanding"));
const PaymentReturn = lazy(() => import("@/pages/learning/PaymentReturn"));
const CheckoutPage = lazy(() => import("@/pages/checkout/CheckoutPage"));
const MPSeatSubscriptionSuccess = lazy(() => import("@/pages/MPSeatSubscriptionSuccess"));
const SubscriptionCheckout = lazy(() => import("@/pages/checkout/SubscriptionCheckout"));

// Finances Pages
import OrganizationFinances from "@/pages/organization-finances/OrganizationFinances";
import ProjectFinances from "@/pages/project-finances/ProjectFinances";

// Settings Pages (legacy - keeping for backwards compatibility)
import PricingPlan from "@/pages/settings/PricingPlan";
import Billing from "@/pages/billing/Billing";
import Members from "@/pages/members/Members";
import Capital from "@/pages/capital/Capital";
import OrganizationActivity from "@/pages/settings/OrganizationActivity";

// User Page
import User from "@/pages/user/User";








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
        <Route path="/organization/basic-data" component={OrganizationData} />
        <Route path="/organization/activity" component={Activity} />
        <Route path="/organization/founders-portal">
          <Suspense fallback={<LazyLoadFallback />}>
            <FoundersPortalPage />
          </Suspense>
        </Route>
        <Route path="/contacts" component={Contacts} />
        <Route path="/organization/projects" component={ProjectsPage} />
        
        {/* General Costs Route */}
        <Route path="/general-costs" component={GeneralCosts} />
        
        {/* Finances Routes */}
        <Route path="/finances" component={OrganizationFinances} />
        <Route path="/project/finances" component={ProjectFinances} />
        
        <Route path="/organization" component={OrganizationDashboardPage} />

        <Route path="/calendar" component={Calendar} />


        {/* Projects Routes */}
        <Route path="/projects" component={ProjectsPage} />

        {/* General Routes */}
        <Route path="/project/dashboard" component={ProjectDashboardPage} />
        <Route path="/project" component={ProjectDataPage} />
        <Route path="/clients" component={Clients} />
        <Route path="/media" component={Media} />
        <Route path="/project/moodboard" component={Moodboard} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/professional/budgets" component={Budgets} />
        <Route path="/professional/budgets/view/:id" component={BudgetView} />
        







        {/* Construction Routes */}
        <Route path="/construction/dashboard" component={ConstructionDashboard} />


        <Route path="/construction/subcontracts" component={ConstructionSubcontracts} />
        <Route path="/construction/subcontracts/:id" component={SubcontractView} />
        <Route path="/construction/indirects" component={ConstructionIndirects} />
        <Route path="/construction/logs" component={Sitelog} />
        <Route path="/construction/personnel" component={Personnel} />
        <Route path="/construction/materials" component={Materials} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/analysis/:id" component={TaskView} />
        <Route path="/analysis/materials/:id" component={MaterialsView} />
        
        {/* Community Routes */}
        <Route path="/community/dashboard" component={Community} />
        <Route path="/community/map" component={CommunityMap} />
        <Route path="/community" component={Community} />

        {/* Organization Settings Routes */}
        <Route path="/organization/billing" component={Billing} />
        <Route path="/organization/settings" component={OrganizationSettings} />
        <Route path="/organization/members" component={Members} />
        <Route path="/organization/capital" component={Capital} />
        <Route path="/settings/organization-activity" component={OrganizationActivity} />
        <Route path="/settings/pricing-plan" component={PricingPlan} />
        
        {/* User Page */}
        <Route path="/user" component={User} />
        
        {/* Legacy pricing route - redirect to settings */}
        <Route path="/pricing-plan" component={PricingPlan} />
        
        {/* Learning Routes */}
        <Route path="/learning/dashboard" component={LearningDashboard} />
        <Route path="/learning/courses" component={CourseList} />
        <Route path="/learning/courses/:slug/info">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseInfo />
          </Suspense>
        </Route>
        <Route path="/learning/courses/:id">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseView />
          </Suspense>
        </Route>
        <Route path="/learning/landing/:slug">
          <Suspense fallback={<LazyLoadFallback />}>
            <CourseLandingPrivate />
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
        
        {/* MP Payment Return Routes - Redirect to API endpoints */}
        <Route path="/mp/seat-subscription-success">
          <Suspense fallback={<LazyLoadFallback />}>
            <MPSeatSubscriptionSuccess />
          </Suspense>
        </Route>

        {/* Finances Routes */}
        <Route path="/finances/dashboard" component={FinancesCapitalMovements} />

        <Route path="/finances/capital" component={FinancesCapitalMovements} />
        
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
