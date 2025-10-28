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
import { ModalFactory } from "@/components/modal/form/ModalFactory";
import { ProjectContextInitializer } from "@/components/navigation/ProjectContextInitializer";
import { Loader2 } from "lucide-react";

// Critical Pages - Loaded immediately (public + checkout)
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";
import PaymentReturn from "@/pages/learning/PaymentReturn";
import PayPalReturn from "@/pages/checkout/paypal/PayPalReturn";
import PayPalCancel from "@/pages/checkout/paypal/PayPalCancel";
import NotFound from "@/pages/public/NotFound";

// Lazy-loaded Pages - Load on demand (reduces initial bundle)
const Onboarding = lazy(() => import("@/pages/public/Onboarding"));
const SelectMode = lazy(() => import("@/pages/public/SelectMode"));
const Home = lazy(() => import("@/pages/Home"));

// Professional Pages
const Projects = lazy(() => import("@/pages/professional/projects/Projects"));
const ProjectView = lazy(() => import("@/pages/professional/projects/ProjectView"));
const FinancesCapitalMovements = lazy(() => import("@/pages/professional/capital/Capital"));
const OrganizationMovements = lazy(() => import("@/pages/professional/movements/Movements"));
const Clients = lazy(() => import("@/pages/professional/clients/Clients").then(m => ({ default: m.Clients })));
const Project = lazy(() => import("@/pages/professional/project/dashboard/Project"));
const Preferences = lazy(() => import("@/pages/professional/preferences/Preferences"));
const ConstructionDashboard = lazy(() => import("@/pages/professional/project/construction/ConstructionDashboard"));
const Logs = lazy(() => import("@/pages/professional/project/construction/logs/Logs"));
const ConstructionPersonnel = lazy(() => import("@/pages/professional/project/construction/ConstructionPersonnel"));
const Materials = lazy(() => import("@/pages/professional/materials/Materials"));
const Budgets = lazy(() => import("@/pages/professional/budgets/Budgets"));
const BudgetView = lazy(() => import("@/pages/professional/budgets/BudgetView"));
const ConstructionSubcontracts = lazy(() => import("@/pages/professional/project/construction/subcontracts/Subcontracts"));
const SubcontractView = lazy(() => import("@/pages/professional/project/construction/subcontracts/SubcontractView"));
const ConstructionIndirects = lazy(() => import("@/pages/professional/project/construction/indirects/Indirects"));
const Media = lazy(() => import("@/pages/professional/media/Media"));
const Contacts = lazy(() => import("@/pages/professional/contacts/Contacts"));
const Calendar = lazy(() => import("@/pages/professional/calendar/Calendar"));
const OrganizationDashboard = lazy(() => import("@/pages/professional/organization/OrganizationDashboard"));
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Activity = lazy(() => import("@/pages/professional/organization/Activity"));

// Admin Pages
const AdminCommunity = lazy(() => import("@/pages/admin/community/AdminCommunity"));
const AdminCosts = lazy(() => import("@/pages/admin/costs/AdminCosts"));
const AdminTasks = lazy(() => import("@/pages/admin/tasks/AdminTasks"));
const AdminGeneral = lazy(() => import("@/pages/admin/general/AdminGeneral"));
const AdminCourses = lazy(() => import("@/pages/admin/courses/AdminCourses"));
const AdminCourseView = lazy(() => import("@/pages/admin/courses/AdminCourseView"));

// Provider Pages
const Products = lazy(() => import("@/pages/providers/products/Products"));

// Analysis Pages
const Analysis = lazy(() => import("@/pages/professional/analysis/Analysis"));
const TaskView = lazy(() => import("@/pages/professional/analysis/TaskView"));
const MaterialsView = lazy(() => import("@/pages/professional/analysis/material-costs/MaterialsView"));
const GeneralCosts = lazy(() => import("@/pages/professional/finances/general-costs/GeneralCosts"));

// Learning Pages
const LearningDashboard = lazy(() => import("@/pages/learning/dashboard/LearningDashboard"));
const CourseList = lazy(() => import("@/pages/learning/courses/CourseList"));
const CourseView = lazy(() => import("@/pages/learning/courses/CourseView"));

// Notifications
const Notifications = lazy(() => import("@/pages/Notifications"));

// Loading fallback component
function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

// Wrapper for lazy components to handle Suspense per route
function LazyRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        {/* Public Routes - No lazy loading */}
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Checkout Routes - No lazy loading (critical) */}
        <Route path="/learning/retorno" component={PaymentReturn} />
        <Route path="/checkout/paypal/return" component={PayPalReturn} />
        <Route path="/checkout/paypal/cancel" component={PayPalCancel} />

        {/* Onboarding and Mode Selection Routes - Lazy loaded */}
        <Route path="/onboarding">{() => <LazyRoute component={Onboarding} />}</Route>
        <Route path="/select-mode">{() => <LazyRoute component={SelectMode} />}</Route>

        {/* Home - Main landing page after onboarding - Lazy loaded */}
        <Route path="/home">{() => <LazyRoute component={Home} />}</Route>

        {/* Main Dashboard - Independent dashboard - Lazy loaded */}
        <Route path="/dashboard">{() => <LazyRoute component={OrganizationDashboard} />}</Route>

        {/* Organization Routes - ORDEN IMPORTANTE: rutas específicas primero - Lazy loaded */}
        <Route path="/organization/dashboard">{() => <LazyRoute component={OrganizationDashboard} />}</Route>
        <Route path="/organization/preferences">{() => <LazyRoute component={Preferences} />}</Route>
        <Route path="/organization/activity">{() => <LazyRoute component={Activity} />}</Route>
        <Route path="/contacts">{() => <LazyRoute component={Contacts} />}</Route>
        <Route path="/notifications">{() => <LazyRoute component={Notifications} />}</Route>
        <Route path="/organization/projects">{() => <LazyRoute component={Projects} />}</Route>
        <Route path="/finances/general-costs">{() => <LazyRoute component={GeneralCosts} />}</Route>
        
        <Route path="/organization">{() => <LazyRoute component={OrganizationDashboard} />}</Route>

        <Route path="/calendar">{() => <LazyRoute component={Calendar} />}</Route>


        {/* Projects Routes - Lazy loaded */}
        <Route path="/projects">{() => <LazyRoute component={Projects} />}</Route>
        <Route path="/projects/:id">{() => <LazyRoute component={ProjectView} />}</Route>

        {/* General Routes - Lazy loaded */}
        <Route path="/project/dashboard">{() => <LazyRoute component={Project} />}</Route>
        <Route path="/clients">{() => <LazyRoute component={Clients} />}</Route>
        <Route path="/media">{() => <LazyRoute component={Media} />}</Route>
        <Route path="/budgets">{() => <LazyRoute component={Budgets} />}</Route>
        <Route path="/professional/budgets">{() => <LazyRoute component={Budgets} />}</Route>
        <Route path="/professional/budgets/view/:id">{() => <LazyRoute component={BudgetView} />}</Route>
        







        {/* Construction Routes - Lazy loaded */}
        <Route path="/construction/dashboard">{() => <LazyRoute component={ConstructionDashboard} />}</Route>
        <Route path="/construction/subcontracts">{() => <LazyRoute component={ConstructionSubcontracts} />}</Route>
        <Route path="/construction/subcontracts/:id">{() => <LazyRoute component={SubcontractView} />}</Route>
        <Route path="/construction/indirects">{() => <LazyRoute component={ConstructionIndirects} />}</Route>
        <Route path="/construction/logs">{() => <LazyRoute component={Logs} />}</Route>
        <Route path="/construction/personnel">{() => <LazyRoute component={ConstructionPersonnel} />}</Route>
        <Route path="/construction/materials">{() => <LazyRoute component={Materials} />}</Route>
        <Route path="/analysis">{() => <LazyRoute component={Analysis} />}</Route>
        <Route path="/analysis/:id">{() => <LazyRoute component={TaskView} />}</Route>
        <Route path="/analysis/materials/:id">{() => <LazyRoute component={MaterialsView} />}</Route>
        
        {/* Learning Routes - Lazy loaded */}
        <Route path="/learning/dashboard">{() => <LazyRoute component={LearningDashboard} />}</Route>
        <Route path="/learning/courses">{() => <LazyRoute component={CourseList} />}</Route>
        <Route path="/learning/courses/:id">{() => <LazyRoute component={CourseView} />}</Route>

        {/* Finances Routes - Lazy loaded */}
        <Route path="/finances/dashboard">{() => <LazyRoute component={FinancesCapitalMovements} />}</Route>
        <Route path="/finances/capital">{() => <LazyRoute component={FinancesCapitalMovements} />}</Route>
        <Route path="/movements">{() => <LazyRoute component={OrganizationMovements} />}</Route>
        
        {/* Duplicate General Routes for compatibility - Lazy loaded */}
        <Route path="/project/dashboard">{() => <LazyRoute component={Project} />}</Route>
        <Route path="/clients">{() => <LazyRoute component={Clients} />}</Route>

        {/* Profile Routes - ORDEN IMPORTANTE: rutas específicas primero - Lazy loaded */}
        <Route path="/profile/organizations">{() => <LazyRoute component={Profile} />}</Route>
        <Route path="/profile/preferences">{() => <LazyRoute component={Profile} />}</Route>
        <Route path="/profile">{() => <LazyRoute component={Profile} />}</Route>



        {/* Admin Routes */}
        <Route path="/admin/community">
          <AuthAdmin>
            <LazyRoute component={AdminCommunity} />
          </AuthAdmin>
        </Route>






        



        <Route path="/admin/costs">
          <AuthAdmin>
            <LazyRoute component={AdminCosts} />
          </AuthAdmin>
        </Route>

        <Route path="/admin/tasks">
          <AuthAdmin>
            <LazyRoute component={AdminTasks} />
          </AuthAdmin>
        </Route>

        <Route path="/admin/general">
          <AuthAdmin>
            <LazyRoute component={AdminGeneral} />
          </AuthAdmin>
        </Route>

        <Route path="/admin/courses/:id">
          <AuthAdmin>
            <LazyRoute component={AdminCourseView} />
          </AuthAdmin>
        </Route>

        <Route path="/admin/courses">
          <AuthAdmin>
            <LazyRoute component={AdminCourses} />
          </AuthAdmin>
        </Route>

        {/* Provider Routes */}
        <Route path="/proveedor/productos">
          <AuthAdmin>
            <LazyRoute component={Products} />
          </AuthAdmin>
        </Route>
        
        <Route path="/providers/products">
          <AuthAdmin>
            <LazyRoute component={Products} />
          </AuthAdmin>
        </Route>





        {/* 404 Route - Must be last - No lazy loading */}
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
