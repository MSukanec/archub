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
- **Project Management Features**: Includes a custom-built React-based Gantt chart with optimistic updates, a full Kanban board system with drag & drop, and a system for generating parametric tasks.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets, with multi-currency support. Budget system migrated to backend API endpoints for improved authentication and error handling. Client management moved to finances section at `/finances/clients`. Movement assignment system includes three specialized subformularios: Personnel (7ef27d3f-ef17-49c3-a392-55282b3576ff), Subcontracts (f40a8fda-69e6-4e81-bc8a-464359cd8498), and Project Clients (f3b96eda-15d5-4c96-ade7-6f53685115d3) with complete CRUD operations and data persistence (August 2025).
- **Document Management**: Hierarchical document organization with versioning and file upload capabilities. Redesigned for file explorer-style navigation, and a modal-based preview system. Desktop features three-panel Bluebeam Revu-style layout with fixed proportions (2/3 viewer, 1/3 navigation/history). PDF viewer now uses fit-to-width scaling with overflow scroll to prevent content clipping during zoom operations. Main documentation interface now integrated into unified Library page with tabbed interface.
- **Activity Logging**: Centralized activity tracking system for user actions.
- **Admin Features**: Material prices management, and user/task parameter administration.
- **Onboarding Process**: Streamlined to a single step, focusing on essential user and organization data.
- **UI/UX Enhancements**: Redesigned projects page, improved header component with dynamic height and aesthetic refinements for a clean, professional appearance. Consistent UI architecture with modern header system. Project section completely eliminated from sidebar - functionality distributed to appropriate sections (finances, library).
- **DataRowCard System**: Completely refactored to generic container architecture (`src/components/data-row/`). DataRowCard now handles only styling, layout (columns), and interactivity, using children-based content system. All row components (MovementRow, ConversionRow, TransferRow, ClientObligationRow, ContactRow) updated to manage their own specific content via JSX children. Enables maximum flexibility for dozens of different row types while maintaining consistent aesthetics and behavior (August 2025).
- **Navigation Restructure**: Moved project management from organization to profile section - "Gestión de Proyectos" now located in profile sidebar above "Gestión de Organizaciones" (August 2025).
- **Resources Reorganization**: Replaced unified Library page with separate pages for Documentation, Gallery, and Contacts in Resources section. Eliminated tabs in favor of dedicated pages accessible through sub-sidebar navigation (August 2025).
- **Profile Organizations Refactor**: Split ProfileOrganizations.tsx into Organizations.tsx with tab-based interface containing OrganizationList.tsx and OrganizationBasicData.tsx components (August 2025).
- **Organization Dashboard Restructure**: Completely restructured organization management from tabs to dashboard architecture. Renamed src/pages/organization/tabs to /dashboard, moved Organization.tsx to dashboard/Dashboard.tsx, and renamed all components from "Organization*" prefix to "Dashboard*" prefix. Updated routing in App.tsx to use new Dashboard component. This provides cleaner separation of concerns and improved maintainability (August 2025).
- **Mobile Swipe Navigation**: Implemented swipe gesture support for tab navigation on mobile. Added useSwipe hook and SwipeContainer component to detect horizontal swipe gestures. Updated HeaderMobile and Layout components to automatically enable swipe-to-change-tabs functionality when multiple tabs are present. Users can now swipe left/right on mobile to navigate between tabs seamlessly (August 2025).
- **Mobile Content Padding**: Standardized mobile content padding to match header padding (px-4/16px) for consistent visual alignment. Updated Layout component to use consistent horizontal padding across mobile header and content areas (August 2025).
- **ComboBox Height Consistency**: Removed min-height constraints from ComboBoxWrite.tsx to match standard input field heights, following pattern applied to other ComboBox components for consistent UI appearance (August 2025).
- **AdminTaskList Table Improvements**: Reorganized columns to move SISTEMA column to final position before actions, implemented green badges for SISTEMA tasks and blue badges for USUARIO tasks, corrected action button styling to h-8 w-8 p-0 with proper hover states to match movements table button appearance (August 2025).
- **TaskMaterialDetailPopover Component Refactor**: Moved TaskMaterialsPopover.tsx to src/components/popovers/TaskMaterialDetailPopover.tsx with optimizations - removed decorative icons and update buttons, standardized all text sizing to text-xs to exactly match construction task table appearance, simplified layout for better performance (August 2025).
- **Button System Consistency Fix**: Corrected ghost button implementations across entire application. Replaced hardcoded `variant="ghost"` with manual `h-8 w-8 p-0` classes with proper `variant="ghost-icon"` and `size="icon-sm"` usage. This ensures ALL action buttons throughout the web are perfectly square (not stretched) and consistent with the established design system. Applied to TaskMaterialDetailPopover, ConstructionBudgets table actions, and other ghost icon buttons (August 2025).

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