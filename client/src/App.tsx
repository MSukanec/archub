import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
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
import ProfilePage from "@/pages/profile/ProfilePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/login">
        {() => <Redirect to="/auth/login" />}
      </Route>
      <Route path="/register">
        {() => <Redirect to="/auth/register" />}
      </Route>
      
      <ProtectedRoute path="/" component={Dashboard} />
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
      <Route path="/projects/:projectId/budgets">
        {(params) => <ProtectedRoute path="/projects/:projectId/budgets" component={() => <BudgetsPage projectId={parseInt(params.projectId)} />} />}
      </Route>
      <Route path="/projects/:projectId/budgets/new">
        {(params) => <ProtectedRoute path="/projects/:projectId/budgets/new" component={() => <BudgetForm projectId={parseInt(params.projectId)} />} />}
      </Route>
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects/new" component={ProjectForm} />
      <Route path="/projects/:id/edit">
        {(params) => <ProtectedRoute path="/projects/:id/edit" component={() => <ProjectForm projectId={params.id} />} />}
      </Route>
      <ProtectedRoute path="/profile" component={ProfilePage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
