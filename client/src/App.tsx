import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";
import MaterialsPage from "@/pages/materials/MaterialsPage";
import MaterialForm from "@/pages/materials/MaterialForm";
import TasksPage from "@/pages/tasks/TasksPage";
import TaskForm from "@/pages/tasks/TaskForm";
import BudgetsPage from "@/pages/budgets/BudgetsPage";
import BudgetForm from "@/pages/budgets/BudgetForm";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return children;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/">
        {() => (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        )}
      </Route>

      <Route path="/materials">
        {() => (
          <RequireAuth>
            <MaterialsPage />
          </RequireAuth>
        )}
      </Route>

      <Route path="/materials/new">
        {() => (
          <RequireAuth>
            <MaterialForm />
          </RequireAuth>
        )}
      </Route>

      <Route path="/materials/:id/edit">
        {(params) => (
          <RequireAuth>
            <MaterialForm materialId={params.id} />
          </RequireAuth>
        )}
      </Route>

      <Route path="/tasks">
        {() => (
          <RequireAuth>
            <TasksPage />
          </RequireAuth>
        )}
      </Route>

      <Route path="/tasks/new">
        {() => (
          <RequireAuth>
            <TaskForm />
          </RequireAuth>
        )}
      </Route>

      <Route path="/tasks/:id/edit">
        {(params) => (
          <RequireAuth>
            <TaskForm taskId={params.id} />
          </RequireAuth>
        )}
      </Route>

      <Route path="/budgets">
        {() => (
          <RequireAuth>
            <BudgetsPage />
          </RequireAuth>
        )}
      </Route>

      <Route path="/budgets/new">
        {() => (
          <RequireAuth>
            <BudgetForm />
          </RequireAuth>
        )}
      </Route>

      <Route path="/budgets/:id/edit">
        {(params) => (
          <RequireAuth>
            <BudgetForm budgetId={params.id} />
          </RequireAuth>
        )}
      </Route>

      <Route path="/projects/:projectId/budgets">
        {(params) => (
          <RequireAuth>
            <BudgetsPage projectId={parseInt(params.projectId)} />
          </RequireAuth>
        )}
      </Route>

      <Route path="/projects/:projectId/budgets/new">
        {(params) => (
          <RequireAuth>
            <BudgetForm projectId={parseInt(params.projectId)} />
          </RequireAuth>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
