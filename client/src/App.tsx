import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";
import MaterialsPage from "@/pages/materials/MaterialsPage";
import MaterialForm from "@/pages/materials/MaterialForm";
import TasksPage from "@/pages/tasks/TasksPage";
import TaskForm from "@/pages/tasks/TaskForm";
import BudgetsPage from "@/pages/budgets/BudgetsPage";
import BudgetForm from "@/pages/budgets/BudgetForm";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import ProjectForm from "@/pages/projects/ProjectForm";
import ProjectDetailsPage from "@/pages/projects/ProjectDetailsPage";
import ProjectMaterialsPage from "@/pages/projects/ProjectMaterialsPage";
import TransactionsPage from "@/pages/projects/TransactionsPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import ProfileConfigPage from "@/pages/profile/ProfileConfigPage";
import OrganizationPage from "@/pages/organization/OrganizationPage";
import OrganizationSettingsPage from "@/pages/organizations/OrganizationSettingsPage";
import TeamPage from "@/pages/team/TeamPage";
import CategoriesPage from "@/pages/categories/CategoriesPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import LandingPage from "@/pages/landing/LandingPage";
import UnitsPage from "@/pages/units/UnitsPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function Router() {
  return (
    <Switch>
      {/* Rutas públicas */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/login">
        {() => <Redirect to="/auth/login" />}
      </Route>
      <Route path="/register">
        {() => <Redirect to="/auth/register" />}
      </Route>
      
      {/* Rutas protegidas */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/materials/new" component={MaterialForm} />
      <Route path="/materials/:id/edit">
        {(params) => <ProtectedRoute path="/materials/:id/edit" component={() => <MaterialForm materialId={params.id} />} />}
      </Route>
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/tasks/new" component={TaskForm} />
      <Route path="/tasks/:id/edit">
        {(params) => <ProtectedRoute path="/tasks/:id/edit" component={() => <TaskForm taskId={params.id} />} />}
      </Route>
      <ProtectedRoute path="/budgets" component={BudgetsPage} />
      <ProtectedRoute path="/budgets/new" component={BudgetForm} />
      <Route path="/budgets/:id/edit">
        {(params) => <ProtectedRoute path="/budgets/:id/edit" component={() => <BudgetForm budgetId={params.id} />} />}
      </Route>
      <Route path="/budgets/:id">
        {(params) => <ProtectedRoute path="/budgets/:id" component={() => <BudgetForm budgetId={params.id} readOnly={true} />} />}
      </Route>
      <Route path="/projects/:projectId/budgets">
        {(params) => <ProtectedRoute path="/projects/:projectId/budgets" component={() => <BudgetsPage projectId={parseInt(params.projectId)} />} />}
      </Route>
      <Route path="/projects/:projectId/budgets/new">
        {(params) => <ProtectedRoute path="/projects/:projectId/budgets/new" component={() => <BudgetForm projectId={parseInt(params.projectId)} />} />}
      </Route>
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects/new" component={ProjectForm} />
      <Route path="/projects/:id">
        {(params) => <ProtectedRoute path="/projects/:id" component={() => <ProjectDetailsPage projectId={params.id} />} />}
      </Route>
      <Route path="/projects/:id/edit">
        {(params) => <ProtectedRoute path="/projects/:id/edit" component={() => <ProjectForm projectId={params.id} />} />}
      </Route>
      <Route path="/projects/:id/transactions">
        {(params) => <ProtectedRoute path="/projects/:id/transactions" component={() => <TransactionsPage projectId={params.id} />} />}
      </Route>
      <Route path="/projects/:id/materials">
        {(params) => <ProtectedRoute path="/projects/:id/materials" component={() => <ProjectMaterialsPage projectId={params.id} />} />}
      </Route>
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/config" component={ProfileConfigPage} />
      <ProtectedRoute path="/organization" component={OrganizationPage} />
      <ProtectedRoute path="/organization/settings" component={OrganizationSettingsPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/categories" component={() => <CategoriesPage />} />
      <ProtectedRoute path="/units" component={UnitsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="archub-theme">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
