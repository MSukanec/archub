# Archub - Construction Management Platform

## Overview

Archub is a modern construction management platform designed to streamline operations in the construction industry. It provides comprehensive tools for project tracking, team management, and budget monitoring, aiming to enhance efficiency and collaboration in construction projects. The platform includes features like financial management with multi-currency support, robust document management, and a comprehensive project dashboard with KPIs and financial health indicators. Archub also incorporates a learning module for professional development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: Wouter
- **Data Fetching**: TanStack Query

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Session Management**: connect-pg-simple

### Authentication
- **Provider**: Supabase Auth (Email/password, Google OAuth)
- **Session Handling**: Supabase sessions

### Key Architectural Decisions
- **Shared Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Design System**: "new-york" style variant with a neutral color palette and dark mode support, emphasizing reusable UI components.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations with extensive cache invalidation.
- **Database Views**: Always use database views for data fetching (e.g., `construction_tasks_view`).
- **Project Management**: Includes a custom React-based Gantt chart, Kanban board, and parametric task generation.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets with multi-currency support. Features specialized subforms for Personnel, Subcontracts, and Project Clients.
- **Document Management**: Hierarchical organization with versioning, file upload, a redesigned file explorer-style navigation, and a modal-based preview system.
- **UI/UX Enhancements**: Redesigned projects page, improved header component, consistent UI architecture, and standardized mobile content padding.
- **Component Refactoring**: DataRowCard system refactored to a generic container architecture for maximum flexibility and consistent aesthetics. Unified ghost button system.
- **Navigation**: Restructured navigation with project management moved to the profile section, organization activity as an independent page, and a redesigned sidebar with breadcrumb-style main header. Mobile menu completely redesigned to match desktop Sidebar structure using sidebarLevel (organization, project, admin, learning) with bottom toggle buttons for Project, Admin, and Learning access. HeaderMobile logo navigates to /mode-selection. CourseSidebar integrated in mobile as 280px side panel. **MainHeader Context-Aware**: In Learning context, MainHeader displays simplified breadcrumb "Capacitaciones / <Page Name>" instead of organization/project selectors.
- **Access Control**: Implemented `PlanRestricted` component system with admin bypass for features like Subcontracts and Clients.
- **Project Dashboard**: Comprehensive dashboard with KPIs, execution health, financial pulse, and documentation compliance.
- **Learning Module**: New "Capacitaciones" module with course management, including courses, modules, and lessons, with Vimeo integration. Features CourseSidebar component on the right side of the layout (similar to main sidebar on left) for course navigation, controlled via useCourseSidebarStore, automatically activated in CourseViewer tab. Includes lesson progress tracking with course_lesson_progress table (progress_pct, last_position_sec, completed_at, is_completed). CourseViewer header has 3 action buttons: Marcar como Completa (secondary variant), Anterior (secondary variant), Siguiente (secondary variant). Sidebar displays progress circles (empty/filled with --accent color based on is_completed flag) next to each lesson. Navigation logic handles first/last lesson edge cases with disabled buttons. Auto-save progress every 8 seconds with throttle. Auto-complete lessons at 95% progress. VimeoPlayer restores last viewing position when switching lessons using loadVideo() pattern without iframe recreation. **Course Pricing System**: Frontend displays prices from `course_prices` table via Supabase using `useCoursePrice` hook and `getCoursePrice` utility. PayButton and PaymentMethodModal NO longer receive price from client - Edge Function `create_mp_preference` fetches secure server-side price by `course_slug + provider + currency`. Supports provider-specific pricing (e.g., 'mercadopago', 'paypal') or 'any' as fallback. Payment modal shows real-time price with loading state. Full-screen mode selection interface redesigned with hover animations.
- **Admin Course Management**: AdminCourses page at /admin/courses with three-tab interface (Cursos, Módulos, Lecciones) for administrative course management. Tables display courses with visibility/status, modules with course hierarchy, and lessons with Vimeo integration. "Cursos" button added to admin sidebar below "Productos". Full CRUD functionality implemented with modals: CourseFormModal (create/edit courses with slug, title, descriptions, cover, visibility, active status), CourseModuleFormModal (create/edit modules with course selection, title, description, sort order), and LessonFormModal (create/edit lessons with cascading course/module selection, Vimeo ID, duration, free preview, sort order, active status). All modals registered in ModalFactory and integrated with AdminCourses page. AdminCourseView (/admin/courses/:id) provides detailed course editing with HierarchicalTree component displaying modules (parent nodes) and lessons (child nodes) with drag & drop support for reordering. Header buttons allow adding modules/lessons with pre-selected course context. Cache invalidation ensures both global and course-specific queries stay synchronized.
- **Cost System**: Three-tier cost system for budget items (Archub Cost, Organization Cost, Independent Cost) with drag-and-drop reordering.

## External Dependencies

- **Supabase**: Authentication, Database (PostgreSQL), Storage.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Radix UI**: Headless component primitives.
- **TanStack Query**: Server state management.
- **Drizzle**: Type-safe ORM for PostgreSQL.
- **Vite**: Frontend build tool.
- **tsx**: TypeScript execution for Node.js development.
- **esbuild**: Production bundling for Node.js backend.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **date-fns**: Date manipulation utilities.
- **React Flow**: For visual parameter dependency editor.
- **Recharts**: Charting library.