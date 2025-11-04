/**
 * 👤 UserQuickAccess - Acceso rápido animado del usuario en el header
 * 
 * Componente que muestra el avatar del usuario y se expande al hacer hover
 * para mostrar selectores de organización, proyecto y acceso al perfil.
 * 
 * Inspirado en el diseño de voice chat expandible con avatares.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { cn } from "@/lib/utils";
import { Building2, FolderOpen, User, ChevronDown } from "lucide-react";

interface UserQuickAccessProps {
  className?: string;
}

export function UserQuickAccess({ className }: UserQuickAccessProps) {
  const [, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);

  const { data: userData } = useCurrentUser();
  const organizations = userData?.organizations || [];
  const { currentOrganizationId, setCurrentOrganization, selectedProjectId, setSelectedProject } = useProjectContext();
  const { data: projectsLite = [] } = useProjectsLite();

  const currentOrg = organizations.find(o => o.id === currentOrganizationId);
  const currentProject = projectsLite.find(p => p.id === selectedProjectId);

  const handleOrgChange = (orgId: string) => {
    setCurrentOrganization(orgId);
    setOrgSelectorOpen(false);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId, currentOrganizationId);
    setProjectSelectorOpen(false);
  };

  const handleGoToProfile = () => {
    navigate('/profile');
    setIsExpanded(false);
  };

  return (
    <div 
      className={cn("relative flex items-center", className)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setOrgSelectorOpen(false);
        setProjectSelectorOpen(false);
      }}
    >
      {/* ESTADO COLAPSADO: Solo Avatar */}
      <motion.div
        className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full border border-border/40 shadow-sm overflow-hidden cursor-pointer"
        initial={{ width: 48, height: 48 }}
        animate={{ 
          width: isExpanded ? 320 : 48,
          height: 48
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
      >
        {/* Avatar - siempre visible */}
        <div className="flex-shrink-0 ml-1">
          <Avatar className="h-10 w-10 ring-2 ring-accent/20">
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
              {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* ESTADO EXPANDIDO: Selectores y botones */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="flex items-center gap-2 pr-3 overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {/* Selector de Organización (dropdown inline) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrgSelectorOpen(!orgSelectorOpen);
                    setProjectSelectorOpen(false);
                  }}
                  className="h-8 px-2 rounded-md hover:bg-accent/10 transition-colors flex items-center gap-1.5 group"
                >
                  <Building2 className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground max-w-[80px] truncate">
                    {currentOrg?.name || 'Org'}
                  </span>
                  <ChevronDown className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform",
                    orgSelectorOpen && "rotate-180"
                  )} />
                </button>

                {/* Dropdown de organizaciones */}
                <AnimatePresence>
                  {orgSelectorOpen && (
                    <motion.div
                      className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg p-2 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-semibold text-muted-foreground">Organizaciones</p>
                      </div>
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrgChange(org.id);
                            }}
                            className={cn(
                              "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                              org.id === currentOrganizationId
                                ? "bg-accent text-accent-foreground font-medium"
                                : "hover:bg-accent/10"
                            )}
                          >
                            {org.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divisor vertical */}
              <div className="h-6 w-px bg-border/50" />

              {/* Selector de Proyecto (dropdown inline) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectSelectorOpen(!projectSelectorOpen);
                    setOrgSelectorOpen(false);
                  }}
                  className="h-8 px-2 rounded-md hover:bg-accent/10 transition-colors flex items-center gap-1.5 group"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground max-w-[80px] truncate">
                    {currentProject?.name || 'Proyecto'}
                  </span>
                  <ChevronDown className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform",
                    projectSelectorOpen && "rotate-180"
                  )} />
                </button>

                {/* Dropdown de proyectos */}
                <AnimatePresence>
                  {projectSelectorOpen && (
                    <motion.div
                      className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg p-2 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-semibold text-muted-foreground">Proyectos</p>
                      </div>
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        {projectsLite.length === 0 ? (
                          <div className="px-2 py-4 text-center">
                            <p className="text-xs text-muted-foreground">No hay proyectos</p>
                          </div>
                        ) : (
                          projectsLite.map((project) => (
                            <button
                              key={project.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectChange(project.id);
                              }}
                              className={cn(
                                "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                                project.id === selectedProjectId
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "hover:bg-accent/10"
                              )}
                            >
                              {project.name}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divisor vertical */}
              <div className="h-6 w-px bg-border/50" />

              {/* Botón Ir a Perfil */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 hover:bg-accent/10"
                onClick={handleGoToProfile}
              >
                <User className="h-3.5 w-3.5" />
                <span className="font-medium">Perfil</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip cuando está colapsado */}
      {!isExpanded && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-md whitespace-nowrap">
            {userData?.user?.full_name || 'Usuario'}
          </div>
        </div>
      )}
    </div>
  );
}
