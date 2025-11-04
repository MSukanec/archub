/**
 * 👤 UserQuickAccess - Popover de acceso rápido del usuario
 * 
 * Componente que muestra el avatar del usuario y se despliega como popover
 * hacia abajo (fuera del header) mostrando selectores y acceso al perfil.
 * 
 * Inspirado en el diseño de voice chat expandible.
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
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setOrgSelectorOpen(false);
        setProjectSelectorOpen(false);
      }}
    >
      {/* Avatar - siempre visible */}
      <div className="cursor-pointer">
        <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
            {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Popover que se despliega hacia abajo */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
          >
            {/* Header del popover con nombre de usuario */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userData?.user?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userData?.user?.email || ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent flex-shrink-0"
                  onClick={handleGoToProfile}
                  title="Ir a mi perfil"
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenido del popover - columna vertical */}
            <div className="p-2">
              
              {/* Selector de Organización - Acordeón inline */}
              <div className="space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrgSelectorOpen(!orgSelectorOpen);
                    setProjectSelectorOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-accent" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground font-medium">Organización</span>
                      <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate max-w-[180px]">
                        {currentOrg?.name || 'Seleccionar'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    orgSelectorOpen && "rotate-180"
                  )} />
                </button>

                {/* Lista de organizaciones - inline */}
                <AnimatePresence>
                  {orgSelectorOpen && (
                    <motion.div
                      className="pl-9 pr-2 space-y-0.5 max-h-48 overflow-y-auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrgChange(org.id);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                            org.id === currentOrganizationId
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/10"
                          )}
                        >
                          {org.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selector de Proyecto - Acordeón inline */}
              <div className="space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectSelectorOpen(!projectSelectorOpen);
                    setOrgSelectorOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="h-4 w-4 text-accent" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground font-medium">Proyecto activo</span>
                      <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate max-w-[180px]">
                        {currentProject?.name || 'Seleccionar'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    projectSelectorOpen && "rotate-180"
                  )} />
                </button>

                {/* Lista de proyectos - inline */}
                <AnimatePresence>
                  {projectSelectorOpen && (
                    <motion.div
                      className="pl-9 pr-2 space-y-0.5 max-h-48 overflow-y-auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {projectsLite.length === 0 ? (
                        <div className="px-3 py-4 text-center">
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
                              "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                              project.id === selectedProjectId
                                ? "bg-accent text-accent-foreground font-medium"
                                : "hover:bg-accent/10"
                            )}
                          >
                            {project.name}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
