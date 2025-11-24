/**
 * ⚠️ DEPRECATED - Temporary Compatibility Layer
 * 
 * This file provides backward compatibility during migration.
 * All imports from "@/layout/desktop" are redirected to "@/layouts/dashboard"
 * 
 * TODO: Update all consumers to import from "@/layouts" instead
 * Once all consumers are updated, this file can be deleted
 */

// Re-export all dashboard components from new location
export { 
  DashboardLayout as Layout,
  PageLayout,
  LeftSidebar,
  RightSidebar,
  ButtonSidebar,
  SidebarIconButton,
  Header,
  Footer,
  ActionBar,
  ProjectSelectorButton,
  OrganizationSelectorButton,
  type WidthMode,
  type WidthProp,
  resolveWidthMode,
  getContainerClasses,
  getHeaderPaddingClasses,
  getContentPaddingClasses
} from "@/layouts";

// Note: Old direct file imports like:
// import { Layout } from "@/layout/desktop/Layout"
// Should be updated to:
// import { DashboardLayout } from "@/layouts"
