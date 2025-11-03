import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ChevronDown, 
  Building2, 
  FolderOpen, 
  Slash,
  Home,
  Building,
  Users,
  FileText,
  Calculator,
  Package,
  Layers,
  History,
  BookOpen,
  DollarSign,
  Activity,
  Settings,
  ListTodo,
  GraduationCap,
  Wallet
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProject } from "@/hooks/use-projects";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProjectSelectorButton } from "./ProjectSelectorButton";
import { OrganizationSelectorButton } from "./OrganizationSelectorButton";

// Mapeo de rutas a nombres e iconos de páginas
const PAGE_CONFIG: Record<string, { name: string; icon: any }> = {
  // Home
  '/home': { name: 'Inicio', icon: Home },
  
  // Organization level
  '/organization/dashboard': { name: 'Resumen de Organización', icon: Home },
  '/organization/projects': { name: 'Gestión de Proyectos', icon: Building },
  '/contacts': { name: 'Contactos', icon: Users },
  '/analysis': { name: 'Análisis de Costos', icon: FileText },
  '/movements': { name: 'Movimientos', icon: DollarSign },
  '/finances/capital': { name: 'Capital', icon: Calculator },
  '/finances/general-costs': { name: 'Gastos Generales', icon: FolderOpen },
  '/organization/activity': { name: 'Actividad', icon: Activity },
  '/organization/preferences': { name: 'Preferencias', icon: Settings },
  
  // Project level
  '/project/dashboard': { name: 'Resumen de Proyecto', icon: Home },
  '/budgets': { name: 'Cómputo y Presupuesto', icon: Calculator },
  '/professional/budgets': { name: 'Cómputo y Presupuesto', icon: Calculator },
  '/construction/personnel': { name: 'Mano de Obra', icon: Users },
  '/construction/materials': { name: 'Materiales', icon: Package },
  '/construction/indirects': { name: 'Indirectos', icon: Layers },
  '/construction/subcontracts': { name: 'Subcontratos', icon: FileText },
  '/construction/logs': { name: 'Bitácora', icon: History },
  '/clients': { name: 'Clientes', icon: Users },
  
  // Admin
  '/admin/community': { name: 'Comunidad', icon: Users },
  '/admin/payments': { name: 'Pagos', icon: Wallet },
  '/admin/courses': { name: 'Cursos', icon: BookOpen },
  '/admin/tasks': { name: 'Tareas', icon: ListTodo },
  '/admin/costs': { name: 'Costos', icon: DollarSign },
  '/providers/products': { name: 'Productos', icon: Package },
  '/admin/general': { name: 'General', icon: Settings },
  
  // Learning / Capacitaciones
  '/learning/dashboard': { name: 'Dashboard', icon: Home },
  '/learning/courses': { name: 'Cursos', icon: GraduationCap },
};

interface MainHeaderProps {
  // Vacío por ahora - sin props
}

export function MainHeader() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setCurrentOrganization, setSelectedProject } = useProjectContext();
  const { setSidebarLevel, sidebarLevel, currentSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  
  // Detectar si estamos en el contexto de Learning
  const isLearningContext = currentSidebarContext === 'learning';
  
  // ORGANIZATION CHANGE MUTATION - Exact copy from ProfileOrganizations.tsx that WORKS
  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      console.log('🔄 Switching to organization:', organizationId)
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select()
      
      if (error) {
        console.error('❌ Error switching organization:', error)
        throw error
      }
      console.log('✅ Organization switch successful:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      console.log('✅ Organization switch queries invalidated');
    },
    onError: (error) => {
      console.error('❌ Organization switch error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      })
    }
  });

  // PROJECT CHANGE MUTATION - Exact copy from OrganizationDashboard.tsx that WORKS  
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !currentOrganizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: currentOrganizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      // Update project context
      setSelectedProject(projectId, currentOrganizationId);
      setSidebarLevel('project');
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, currentOrganizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      console.log('✅ Project selection successful:', projectId);
    },
    onError: (error) => {
      console.error('❌ Project selection error:', error)
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  });
  
  // Get real data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  
  // Get current page info (icon + name)
  const pageConfig = PAGE_CONFIG[location];
  const PageIcon = pageConfig?.icon || Home;
  const currentPageName = pageConfig?.name || 'Página';
  
  // Determinar qué selector mostrar según el contexto
  let selectorComponent: React.ReactNode = null;
  if (sidebarLevel === 'project') {
    selectorComponent = <ProjectSelectorButton />;
  } else if (sidebarLevel === 'organization') {
    selectorComponent = <OrganizationSelectorButton />;
  }

  return (
    <div 
      className="w-full h-12 border-b flex items-center justify-between px-4 z-50"
      style={{ 
        backgroundColor: "var(--main-sidebar-bg)",
        borderBottomColor: "var(--main-sidebar-border)"
      }}
    >
      {/* Left side: Logo + Icon + Title */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/home">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer">
            <img 
              src="/ArchubLogo.png" 
              alt="Archub" 
              className="h-8 w-auto"
            />
          </div>
        </Link>

        {/* Page Icon + Title */}
        <div className="flex items-center gap-3">
          <PageIcon className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {currentPageName}
          </h1>
        </div>
      </div>

      {/* Right side: Selector */}
      <div className="flex items-center">
        {selectorComponent}
      </div>
    </div>
  );
}