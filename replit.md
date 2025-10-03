# Archub - Construction Management Platform

## Overview

Archub is a modern construction management platform designed to streamline operations in the construction industry. It provides comprehensive tools for project tracking, team management, and budget monitoring, aiming to enhance efficiency and collaboration in construction projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS (with CSS variables)
- **State Management**: Zustand
- **Routing**: Wouter
- **Data Fetching**: TanStack Query (React Query)

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Session Management**: connect-pg-simple

### Authentication
- **Provider**: Supabase Auth (Email/password, Google OAuth)
- **Session Handling**: Supabase sessions
- **User Preferences**: Organization-specific `user_organization_preferences` table.

### Key Architectural Decisions
- **Shared Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Design System**: "new-york" style variant with neutral color palette and dark mode support. Emphasis on reusable UI components and centralized modal management.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations. Extensive use of cache invalidation for real-time updates.
- **Database Views**: ALWAYS use database views instead of raw tables for data fetching. Use `construction_tasks_view` instead of `construction_tasks` to get enriched data with division_name, category_name, and other joined fields.
- **Project Management Features**: Includes a custom-built React-based Gantt chart with optimistic updates, a full Kanban board system with drag & drop, and a system for generating parametric tasks.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets, with multi-currency support. Budget system migrated to backend API endpoints for improved authentication and error handling. Client management moved to finances section at `/finances/clients`. Movement assignment system includes three specialized subformularios: Personnel (7ef27d3f-ef17-49c3-a392-55282b3576ff), Subcontracts (f40a8fda-69e6-4e81-bc8a-464359cd8498), and Project Clients (f3b96eda-15d5-4c96-ade7-6f53685115d3) with complete CRUD operations and data persistence (August 2025).
- **Document Management**: Hierarchical document organization with versioning and file upload capabilities. Redesigned for file explorer-style navigation, and a modal-based preview system. Desktop features three-panel Bluebeam Revu-style layout with fixed proportions (2/3 viewer, 1/3 navigation/history). PDF viewer now uses fit-to-width scaling with overflow scroll to prevent content clipping during zoom operations. Main documentation interface now integrated into unified Library page with tabbed interface.
- **Activity Logging**: Centralized activity tracking system for user actions.
- **Admin Features**: Material prices management, and user/task parameter administration.
- **Onboarding Process**: Streamlined to a single step, focusing on essential user and organization data.
- **UI/UX Enhancements**: Redesigned projects page, improved header component with dynamic height and aesthetic refinements for a clean, professional appearance. Consistent UI architecture with modern header system. Project section completely eliminated from sidebar - functionality distributed to appropriate sections (finances, library).
- **DataRowCard System**: Completely refactored to generic container architecture (`src/components/data-row/`). DataRowCard now handles only styling, layout (columns), and interactivity, using children-based content system. All row components (MovementRow, ConversionRow, TransferRow, ClientObligationRow, ContactRow) updated to manage their own specific content via JSX children. Enables maximum flexibility for dozens of different row types while maintaining consistent aesthetics and behavior (August 2025).
- **Navigation Restructure**: Moved project management from organization to profile section - "Gestión de Proyectos" now located in profile sidebar above "Gestión de Organizaciones" (August 2025).
- **Organization Activity Page**: Converted Activity.tsx from a Dashboard tab to an independent page within the Organization section, positioned above Preferences in both desktop sidebar and mobile menu navigation (August 2025).
- **Resources Reorganization**: Replaced unified Library page with separate pages for Documentation, Gallery, and Contacts in Resources section. Eliminated tabs in favor of dedicated pages accessible through sub-sidebar navigation (August 2025).
- **Profile Organizations Refactor**: Split ProfileOrganizations.tsx into Organizations.tsx with tab-based interface containing OrganizationList.tsx and OrganizationBasicData.tsx components (August 2025).
- **Organization Dashboard Restructure**: Completely restructured organization management from tabs to dashboard architecture. Renamed src/pages/organization/tabs to /dashboard, moved Organization.tsx to dashboard/Dashboard.tsx, and renamed all components from "Organization*" prefix to "Dashboard*" prefix. Updated routing in App.tsx to use new Dashboard component. This provides cleaner separation of concerns and improved maintainability (August 2025).
- **Mobile Swipe Navigation**: Implemented swipe gesture support for tab navigation on mobile. Added useSwipe hook and SwipeContainer component to detect horizontal swipe gestures. Updated HeaderMobile and Layout components to automatically enable swipe-to-change-tabs functionality when multiple tabs are present. Users can now swipe left/right on mobile to navigate between tabs seamlessly (August 2025).
- **Mobile Content Padding**: Standardized mobile content padding to match header padding (px-4/16px) for consistent visual alignment. Updated Layout component to use consistent horizontal padding across mobile header and content areas (August 2025).
- **ComboBox Height Consistency**: Removed min-height constraints from ComboBoxWrite.tsx to match standard input field heights, following pattern applied to other ComboBox components for consistent UI appearance (August 2025).
- **AdminTaskList Table Improvements**: Reorganized columns to move SISTEMA column to final position before actions, implemented green badges for SISTEMA tasks and blue badges for USUARIO tasks, corrected action button styling to h-8 w-8 p-0 with proper hover states to match movements table button appearance (August 2025).
- **TaskMaterialDetailPopover Component Refactor**: Moved TaskMaterialsPopover.tsx to src/components/popovers/TaskMaterialDetailPopover.tsx with optimizations - removed decorative icons and update buttons, standardized all text sizing to text-xs to exactly match construction task table appearance, simplified layout for better performance (August 2025).
- **Button System Simplification**: Unified ghost button system by eliminating `ghost-icon` variant. Now uses single `variant="ghost"` with `size` controlling dimensions: `size="icon-sm"` for square icon buttons, `size="sm"` for buttons with text. This removes duplicate code and makes the system more intuitive - variant controls visual style, size controls dimensions. Applied across entire application ensuring consistency (August 2025).
- **Sidebar Layout Fixes**: Fixed bottom button positioning issue where notifications and user avatar buttons were being cut off at bottom of screen. Implemented proper height distribution with `min-h-0` on scrollable content and `mt-auto` on bottom section to ensure buttons always remain visible. Removed Administration section from project sidebar level to match organization sidebar clean structure (September 2025).
- **Header Administration Button**: Added dedicated Administration button with Crown icon to header, creating direct access to admin sidebar state instead of nested accordion approach. User avatar now displays as clean 32x32px icon without accompanying text for cleaner header appearance (September 2025).
- **Project Context Migration**: Fixed critical bug across all 7 construction pages where userData?.preferences?.last_project_id was used instead of centralized useProjectContext(). Pages now properly filter data by active project: ConstructionPersonnel, ConstructionMaterials, Indirects, IndirectList, Subcontracts, SubcontractList, and Logs. Also resolved insurance modal scoping issues (September 2025).
- **Three-Tier Cost System**: Implemented comprehensive three-option cost system for budget items. Users can now select between: 1) "Costo Archub" (real-time average from materials+labor), 2) "Costo de Organización" (using ORGANIZATION_TASK_PRICES_VIEW), and 3) "Costo Independiente" (manual override). Selected costs persist in BUDGET_ITEMS.unit_price column. Includes new useOrganizationTaskPrices hook and /api/organization-task-prices endpoint. Complete drag-and-drop reordering system with sort_key field and RPC budget_item_move (September 2025).
- **Sidebar Redesign**: Completely redesigned sidebar with 50px collapsed width and 240px expanded width. Implemented perfect centering for all buttons (32×32px) and icons when collapsed using flex centering without padding. Fixed hover/active effects to stay contained within sidebar boundaries using overflow-hidden. Buttons have w-8 when collapsed and w-full when expanded. Avatar button and divider lines also properly centered when collapsed (September 2025).
- **Main Header Enhancement**: Enhanced main header with breadcrumb-style navigation using "/" separators between Organization selector → Project selector → Current page name. Added comprehensive route-to-page-name mapping covering all organization, project, construction, finances, admin, and profile pages. Removed action button from header to maintain clean, consistent header design across all pages (September 2025).
- **Access Control & Restrictions**: Implemented comprehensive PlanRestricted component system with admin bypass functionality. SUBCONTRATOS and CLIENTES sections now visually disabled (coming_soon) for regular users but fully accessible to administrators. Admin bypass applies to all restriction types (plan limits, coming_soon features, general_mode) - admins can access everything while maintaining disabled visual styling for consistency (October 2025).
- **Partners Tab Migration**: Moved PartnersTab.tsx from finances/capital section to preferences section. Now integrated as final tab in Preferences.tsx, providing centralized management of organization partners alongside basic data, members, and finance settings. Capital page retains its three primary tabs (Resumen Financiero, Resumen por Socio, Detalle de Aportes/Retiros) (October 2025).
- **Project Dashboard Implementation**: Implemented comprehensive project dashboard (ProjectDashboard.tsx) with four main sections: 1) Project Overview with KPIs (overall progress, schedule compliance, budget consumption, approved documents), 2) Execution Health with phase progress bars, task distribution chart, and at-risk tasks list, 3) Financial Pulse showing budget vs. actual spending, recent movements, and financial health indicator, and 4) Documentation & Compliance with document status counters and recent uploads. Dashboard includes proper data hook guards with `enabled` flags, accurate schedule compliance calculation for completed/in-progress tasks, active budget validation (only uses budgets with 'active' or 'approved' status), comprehensive loading states, empty states for missing data, and responsive grid layouts. Uses framer-motion animations, CSS variables for theming, and lucide-react icons throughout (October 2025).
- **Learning Module Implementation**: Added new "Capacitaciones" (Learning) module with dedicated sidebar context and routing. SelectMode.tsx redesigned from 2x2 grid to single row of 5 mode options: Profesional, Capacitaciones, Proveedores, Contratistas, Visitantes. Created learning section in src/pages/learning with LearningDashboard.tsx and CourseList.tsx placeholder pages. Added 'learning' to SidebarContext and SidebarLevel types in navigationStore.ts. Updated Sidebar.tsx with learning navigation items (Dashboard, Cursos). Added 'learning' to user_type enum in shared/schema.ts for proper database type support (October 2025).

## External Dependencies

- **Supabase**: Authentication, Database (PostgreSQL), Storage.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Radix UI**: Headless component primitives for UI components.
- **TanStack Query**: Server state management (React Query).
- **Drizzle**: Type-safe ORM for PostgreSQL.
- **Vite**: Frontend build tool and development server.
- **tsx**: TypeScript execution for Node.js development.
- **esbuild**: Production bundling for Node.js backend.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **date-fns**: Date manipulation utilities.
- **React Flow**: For visual parameter dependency editor.
- **Recharts**: Charting library for data visualization.