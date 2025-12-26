/**
 * Layouts Barrel File
 * Central export point for all layout components
 * 
 * This allows clean imports like:
 * import { DashboardLayout, PageLayout } from "@/layouts"
 */

// Dashboard Layout exports
export { Layout as DashboardLayout } from "./dashboard/DashboardLayout";
export { HeroLayout } from "./dashboard/HeroLayout";
export { PageLayout } from "./dashboard/PageLayout";

// Dashboard Components - Sidebar
export { LeftSidebar } from "./dashboard/components/Sidebar/LeftSidebar";
export { default as ButtonSidebar } from "./dashboard/components/Sidebar/ButtonSidebar";
export { SidebarIconButton } from "./dashboard/components/Sidebar/SidebarIconButton";

// Dashboard Components - Topbar
export { Header } from "./dashboard/components/Topbar/Header";
export { ContextSelector } from "./dashboard/components/Topbar/ContextSelector";

// Dashboard Components - Mobile
export * from './dashboard/components/MobileMenu';
export * from './dashboard/components/MobileActionBar';

// Layout utilities
export { 
  type WidthMode, 
  type WidthProp, 
  resolveWidthMode, 
  getContainerClasses, 
  getHeaderPaddingClasses, 
  getContentPaddingClasses 
} from "./dashboard/layoutWidth";

// Marketing Layout exports
export * from './marketing';

// Initializers (global app setup)
export * from './initializers';
