import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

import {
  Settings,
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity,
  ArrowLeft,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Crown,
  Package,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setHovered } = useSidebarStore();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const queryClient = useQueryClient();

  // Estado para acordeones
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isExpanded = isDocked || isHovered;

  const transitionRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsTransitioning(true);
    
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
    }

    transitionRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);

    return () => {
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
      }
    };
  }, [isExpanded]);

  const toggleAccordion = (label: string) => {
    setExpandedAccordions(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  // Contextos de navegación
  const getNavigationItems = () => {
    switch (currentSidebarContext) {
      case "organization":
        return [
          { label: "Panel Principal", icon: Home, href: "/organization/dashboard" },
          {
            label: "Organización",
            icon: Users,
            items: [
              { label: "Gestión de Organizaciones", icon: Building, href: "/organization/organizations" },
              { label: "Contactos", icon: Mail, href: "/organization/contactos" },
            ]
          },
          {
            label: "Proyectos",
            icon: FolderOpen,
            items: [
              { label: "Gestión de Proyectos", icon: Building, href: "/organization/projects" },
            ]
          },
          {
            label: "Obra",
            icon: FileText,
            items: [
              { label: "Bitácora", icon: FileText, href: "/organization/site-logs" },
            ]
          },
          {
            label: "Finanzas",
            icon: DollarSign,
            items: [
              { label: "Movimientos", icon: Activity, href: "/organization/movements" },
            ]
          },
        ];

      case "project":
        return [
          { label: "Panel Principal", icon: Home, href: "/project/dashboard" },
          {
            label: "Proyecto",
            icon: Building,
            items: [
              { label: "Información General", icon: Building, href: "/project/info" },
              { label: "Equipo", icon: Users, href: "/project/team" },
            ]
          },
          {
            label: "Diseño",
            icon: FileText,
            items: [
              { label: "Planos", icon: FileText, href: "/project/design/plans" },
              { label: "Especificaciones", icon: FileText, href: "/project/design/specs" },
            ]
          },
          {
            label: "Obra",
            icon: Building,
            items: [
              { label: "Bitácora", icon: FileText, href: "/project/construction/logs" },
              { label: "Avance", icon: Activity, href: "/project/construction/progress" },
            ]
          },
          {
            label: "Finanzas",
            icon: DollarSign,
            items: [
              { label: "Presupuesto", icon: DollarSign, href: "/project/finance/budget" },
              { label: "Gastos", icon: Activity, href: "/project/finance/expenses" },
            ]
          },
        ];

      case "admin":
        return [
          { label: "Resumen de Administración", icon: Home, href: "/admin/dashboard" },
          { label: "Usuarios", icon: Users, href: "/admin/users" },
          { label: "Organizaciones", icon: Building, href: "/admin/organizations" },
          { label: "Categorías de Materiales", icon: Tag, href: "/admin/material-categories" },
          { label: "Materiales", icon: Package, href: "/admin/materials" },
        ];

      default:
        return [
          { label: "Panel Principal", icon: Home, href: "/dashboard" },
          {
            label: "Organización",
            icon: Users,
            items: [
              { label: "Gestión de Organizaciones", icon: Building, href: "/organizations" },
              { label: "Contactos", icon: Mail, href: "/contactos" },
            ]
          },
          {
            label: "Proyectos",
            icon: FolderOpen,
            items: [
              { label: "Gestión de Proyectos", icon: Building, href: "/projects" },
            ]
          },
          {
            label: "Obra",
            icon: FileText,
            items: [
              { label: "Bitácora", icon: FileText, href: "/site-logs" },
            ]
          },
          {
            label: "Finanzas",
            icon: DollarSign,
            items: [
              { label: "Movimientos", icon: Activity, href: "/movements" },
            ]
          },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div
      className={cn(
        "fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[40px]",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
          <div
            className={`flex-1 transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
          >
            {navigationItems.map((item: any, index) => (
              <div key={`${item.label}-${index}`} className="mb-[2px]">
                {/* Main Button */}
                <SidebarButton
                  icon={<item.icon className="w-[18px] h-[18px]" />}
                  label={item.label}
                  isActive={location === item.href}
                  isExpanded={isExpanded}
                  onClick={
                    item.items
                      ? () => toggleAccordion(item.label)
                      : () => navigate(item.href)
                  }
                  showChevron={!!item.items}
                  isAccordionExpanded={expandedAccordions.includes(item.label)}
                />

                {/* Subitems */}
                {item.items && expandedAccordions.includes(item.label) && (
                  <div className="mt-[2px] mb-[4px]">
                    {item.items.map((child: any, childIndex: number) => (
                      <SidebarButton
                        key={`${child.label}-${childIndex}`}
                        icon={<child.icon className="w-[18px] h-[18px]" />}
                        label={child.label}
                        isActive={location === child.href}
                        isExpanded={isExpanded}
                        onClick={() => navigate(child.href)}
                        isChild={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Plan Button - ABOVE Divider */}
          <div className="mt-auto pb-2">
            {isExpanded ? (
              <div className={cn(
                "w-full border rounded-lg p-3",
                (!userData?.plan || userData.plan.name === 'free') && "bg-orange-50 border-orange-200",
                userData?.plan?.name === 'pro' && "bg-blue-50 border-blue-200",
                userData?.plan?.name === 'teams' && "bg-purple-50 border-purple-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    (!userData?.plan || userData.plan.name === 'free') && "bg-orange-500",
                    userData?.plan?.name === 'pro' && "bg-blue-500",
                    userData?.plan?.name === 'teams' && "bg-purple-500"
                  )}>
                    {(!userData?.plan || userData.plan.name === 'free') && <Star className="w-3 h-3 text-white" />}
                    {userData?.plan?.name === 'pro' && <Crown className="w-3 h-3 text-white" />}
                    {userData?.plan?.name === 'teams' && <Zap className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs font-medium text-gray-600">Plan actual:</span>
                </div>
                <div className="mb-2">
                  <span className={cn(
                    "text-sm font-semibold",
                    (!userData?.plan || userData.plan.name === 'free') && "text-orange-600",
                    userData?.plan?.name === 'pro' && "text-blue-600",
                    userData?.plan?.name === 'teams' && "text-purple-600"
                  )}>
                    {(!userData?.plan || userData.plan.name === 'free') && 'Free'}
                    {userData?.plan?.name === 'pro' && 'Pro'}
                    {userData?.plan?.name === 'teams' && 'Teams'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {(!userData?.plan || userData.plan.name === 'free') && "Actualiza para obtener funcionalidades profesionales"}
                  {userData?.plan?.name === 'pro' && "Actualiza para obtener funcionalidades empresariales"}
                  {userData?.plan?.name === 'teams' && "Ya estás disfrutando de las mejores funcionalidades de Archub!"}
                </p>
                {(!userData?.plan || userData.plan.name === 'free') && (
                  <button className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1 transition-colors">
                    <Crown className="w-3 h-3" />
                    Actualizar a PRO
                  </button>
                )}
                {userData?.plan?.name === 'pro' && (
                  <button className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-1 transition-colors">
                    <Zap className="w-3 h-3" />
                    Actualizar a TEAMS
                  </button>
                )}
              </div>
            ) : (
              <SidebarButton
                icon={
                  <div className={cn(
                    "w-[18px] h-[18px] rounded-full flex items-center justify-center",
                    (!userData?.plan || userData.plan.name === 'free') && "bg-orange-500",
                    userData?.plan?.name === 'pro' && "bg-blue-500",
                    userData?.plan?.name === 'teams' && "bg-purple-500"
                  )}>
                    {(!userData?.plan || userData.plan.name === 'free') && <Star className="w-3 h-3 text-white" />}
                    {userData?.plan?.name === 'pro' && <Crown className="w-3 h-3 text-white" />}
                    {userData?.plan?.name === 'teams' && <Zap className="w-3 h-3 text-white" />}
                  </div>
                }
                label="Plan"
                isActive={false}
                isExpanded={isExpanded}
                onClick={() => {}}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Administration */}
          <SidebarButton
            icon={<Shield className="w-[18px] h-[18px]" />}
            label="Administración"
            isActive={currentSidebarContext === "admin"}
            isExpanded={isExpanded}
            onClick={() => {
              setSidebarContext("admin");
              navigate("/admin/dashboard");
            }}
          />

          {/* Profile - FIXED: Avatar stays in same position */}
          <SidebarButton
            icon={
              <div className="w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {userData?.user?.avatar_url ? (
                  <img 
                    src={userData.user.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium">
                    {userData?.user?.full_name?.substring(0, 2).toUpperCase() || "US"}
                  </div>
                )}
              </div>
            }
            label={
              isExpanded ? (
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--menues-fg)] truncate leading-tight">
                    {userData?.user?.full_name || "Usuario"}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate leading-tight">
                    {userData?.organization?.name || "Sin organización"}
                  </div>
                </div>
              ) : (
                "Mi Perfil"
              )
            }
            isActive={location === "/perfil"}
            isExpanded={isExpanded}
            onClick={() => navigate("/perfil")}
          />
        </div>
      </div>
    </div>
  );
}