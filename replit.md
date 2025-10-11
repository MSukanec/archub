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
- **Design System**: "new-york" style variant with a neutral color palette and dark mode support, emphasizing reusable UI components. **Accent Color System**: Dual CSS variable approach - `--accent-hsl` (76 100% 40%) for Tailwind with opacity support (e.g., bg-accent/5), and `--accent` (hsl(76, 100%, 40%)) for inline styles. Payment modals use color-mix() for soft accent backgrounds.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations with extensive cache invalidation.
- **Database Views**: Always use database views for data fetching (e.g., `construction_tasks_view`).
- **Project Management**: Includes a custom React-based Gantt chart, Kanban board, and parametric task generation.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets with multi-currency support. Features specialized subforms for Personnel, Subcontracts, and Project Clients.
- **Document Management**: Hierarchical organization with versioning, file upload, a redesigned file explorer-style navigation, and a modal-based preview system.
- **UI/UX Enhancements**: Redesigned projects page, improved header component, consistent UI architecture, and standardized mobile content padding. **Modal System**: Fully responsive Dialog component - desktop maintains right-side panel layout (w-1/2, min-w-600px), mobile uses fullscreen layout (inset-0) with proper viewport fit to prevent content overflow.
- **Component Refactoring**: DataRowCard system refactored to a generic container architecture for maximum flexibility and consistent aesthetics. Unified ghost button system.
- **Navigation**: Restructured navigation with project management moved to the profile section, organization activity as an independent page, and a redesigned sidebar with breadcrumb-style main header. Mobile menu completely redesigned to match desktop Sidebar structure using sidebarLevel (organization, project, admin, learning) with bottom toggle buttons for Project, Admin, and Learning access. HeaderMobile logo navigates to /mode-selection. CourseSidebar integrated in mobile as 280px side panel. **MainHeader Context-Aware**: In Learning context, MainHeader displays simplified breadcrumb "Capacitaciones / <Page Name>" instead of organization/project selectors.
- **Access Control**: Implemented `PlanRestricted` component system with admin bypass for features like Subcontracts and Clients.
- **Project Dashboard**: Comprehensive dashboard with KPIs, execution health, financial pulse, and documentation compliance.
- **Learning Module**: New "Capacitaciones" module with course management, including courses, modules, and lessons, with Vimeo integration. Features CourseSidebar component on the right side of the layout (similar to main sidebar on left) for course navigation, controlled via useCourseSidebarStore, automatically activated in CourseViewer tab. Includes lesson progress tracking with course_lesson_progress table (progress_pct, last_position_sec, completed_at, is_completed). CourseViewer header has 3 action buttons: Marcar como Completa (secondary variant), Anterior (secondary variant), Siguiente (secondary variant). Sidebar displays progress circles (empty/filled with --accent color based on is_completed flag) next to each lesson. Navigation logic handles first/last lesson edge cases with disabled buttons. Auto-save progress every 8 seconds with throttle. Auto-complete lessons at 95% progress. VimeoPlayer restores last viewing position when switching lessons using loadVideo() pattern without iframe recreation. **Course Pricing System**: Frontend displays prices from `course_prices` table via Supabase using `useCoursePrice` hook and `getCoursePrice` utility. PayButton and PaymentMethodModal NO longer receive price from client - Edge Function `create_mp_preference` fetches secure server-side price by `course_slug + provider + currency`. Supports provider-specific pricing (e.g., 'mercadopago', 'paypal') or 'any' as fallback. Payment modal shows real-time price with loading state. Full-screen mode selection interface redesigned with hover animations. **Payment Flow**: CRITICAL - Payment flow queries `public.users` by `auth_id` to get `profile.id`, then sends `user_id: profile.id` (NOT `auth.users.id`) to Edge Function. This ensures webhook can insert into `payments_log` and `course_enrollments` without FK violations. PayButton only displays if user has NO active enrollment (`is_active = true`). **LearningDashboard**: Uses EmptyState component when user has no enrolled courses, with button navigating to CourseList. **Sidebar Level Management**: OrganizationDashboard and SelectMode properly set sidebarLevel to 'organization' when switching from learning mode to prevent sidebar state persistence issues. **Student Notes System**: Advanced note-taking system with summary notes and temporal markers stored in `course_lesson_notes` table (unique constraint: user_id,lesson_id,note_type). CourseView redesigned with four tabs in order: "Datos del Curso", "Lecciones", "Apuntes", "Marcadores". CourseViewer uses Preferences-style layout with icon+title+description sections separated by hr divider for both notes and markers. Deep-link navigation implemented via URL params (?tab=Lecciones&lesson=<id>&seek=<seconds>) allowing markers to navigate to specific lessons at exact video timestamps. Tab synchronization handled via useEffect with handleTabChange that always clears query params to prevent manual navigation locks. CourseViewer observes initialSeekTime changes to update targetSeekTime for multiple marker navigations. CourseMarkersTab displays all course markers in Table component with search/filters and "Go to Lesson" action buttons.
- **Notification System**: Real-time notification system with bell icon and badge in header (both desktop MainHeader and mobile HeaderMobile). Uses Supabase tables `notifications` and `user_notifications` for delivery tracking. Features: getUnreadCount(), fetchNotifications(), markAsRead(), markAllAsRead(), subscribeUserNotifications() for real-time updates via Supabase realtime channels. NotificationDropdown displays notification list with read/unread states, time ago formatting, and click navigation using resolveNotificationHref() helper that supports routing via data.route, data.course_slug, data.payment_id, data.organization_id, data.project_id. Badge updates automatically when new notifications arrive or are marked as read.
- **Admin Course Management**: AdminCourses page at /admin/courses with three-tab interface (Dashboard, Alumnos, Cursos) for administrative course management. **Dashboard tab (first position)**: Comprehensive analytics dashboard (AdminCourseDashboard.tsx) displaying 8 KPI cards (total/active courses, active subscriptions, expiring subscriptions this/next month, average completion rate, total revenue, monthly revenue with growth percentage, previous month revenue, average monthly revenue), recent enrollments list, and upcoming expirations (30-day window). Tables display courses with visibility/status, modules with course hierarchy, and lessons with Vimeo integration. "Cursos" button added to admin sidebar below "Productos". Full CRUD functionality implemented with modals: CourseFormModal (create/edit courses with slug, title, descriptions, cover, visibility, active status), CourseModuleFormModal (create/edit modules with course selection, title, description, sort order), and LessonFormModal (create/edit lessons with cascading course/module selection, Vimeo ID, duration, free preview, sort order, active status). All modals registered in ModalFactory and integrated with AdminCourses page. AdminCourseView (/admin/courses/:id) provides detailed course editing with HierarchicalTree component displaying modules (parent nodes) and lessons (child nodes) with drag & drop support for reordering. Header buttons allow adding modules/lessons with pre-selected course context. Cache invalidation ensures both global and course-specific queries stay synchronized. AdminCourseUsersTab provides enrollment management with delete functionality using DeleteConfirmationModal.
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