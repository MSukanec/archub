# Archub - Construction Management Platform

## Overview

Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, and financial management with multi-currency support. Key features include robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette and dark mode support, emphasizing reusable UI components.
- **Accent Color System**: Dual CSS variable approach for flexible theming (`--accent-hsl` for Tailwind, `--accent` for inline styles).
- **Modals**: Fully responsive Dialog component; right-side panel on desktop, fullscreen on mobile.
- **Navigation**: Redesigned sidebar with a project selector, breadcrumb-style main header, and a centralized "general" hub for main navigation. Mobile menu mirrors desktop sidebar structure. "Inicio" (Home) button appears first in general sidebar with "Secciones" divider before other sections.
- **Component Refactoring**: Generic container architecture for `DataRowCard` and a unified ghost button system.
- **Context-Aware Headers**: MainHeader adapts content based on the current module (e.g., simplified breadcrumbs in Learning module).
- **Button Design**: Default button variant uses gradient (yellow hsl(58,77%,51%) to green hsl(76,100%,40%)) matching logo colors.
- **Onboarding Flow**: Streamlined onboarding automatically sets users to 'professional' mode and navigates directly to /home, skipping SelectMode page.
- **StatCard Component**: Standardized minimal card design for statistics and KPIs. Features composable subcomponents (`StatCardTitle`, `StatCardValue`, `StatCardMeta`, `StatCardContent`) with preset styling (text-xs uppercase titles, text-5xl values, text-sm metadata). Used in admin and capital dashboards for visual consistency.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui (Radix UI primitives), Tailwind CSS, Zustand for state management, Wouter for routing, TanStack Query for data fetching.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth) with Supabase sessions.
- **Shared Schema**: `shared/schema.ts` for consistency between frontend and backend.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations with extensive cache invalidation.
- **Database Views**: Exclusive use of database views for data fetching (e.g., `construction_tasks_view`).

### Feature Specifications
- **Home Page**: Landing page (/home) after onboarding with personalized welcome message and quick-access cards to main sections (Organización, Proyecto, Capacitaciones, Administración). Maintains sidebar in 'general' level for hub navigation.
- **Project Management**: Includes custom React-based Gantt chart, Kanban board, and parametric task generation.
- **Financial Management**: Comprehensive tracking of movements, conversions, transfers, and budgets with multi-currency support, including specialized subforms for Personnel, Subcontracts, and Project Clients.
- **Document Management**: Hierarchical organization, versioning, redesigned file explorer navigation, and modal-based preview system.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Project Dashboard**: Displays KPIs, execution health, financial pulse, and documentation compliance.
- **Learning Module ("Capacitaciones")**:
    - Course management (courses, modules, lessons) with Vimeo integration.
    - CourseSidebar for navigation and `useCourseSidebarStore` for state management.
    - Lesson progress tracking (completion, last position, auto-save, auto-complete).
    - Advanced student note-taking system with summary notes and temporal markers (table-based interface).
    - Course dashboard (CourseDashboardTab) with StatCard components showing progress, study time, notes/markers count.
    - Course pricing system with server-side validation and Mercado Pago integration.
    - Discord Integration widget for community engagement.
    - Deep-link navigation for lessons and tabs via URL parameters.
    - Table-based tabs for Apuntes (summary notes) and Marcadores (temporal markers) with module grouping, filtering, and navigation.
- **Notification System**: Real-time notifications with bell icon badge, powered by Supabase `notifications` and `user_notifications` tables, supporting read/unread states and click navigation.
- **Admin Course Management**: Dedicated `AdminCourses` page with a three-tab interface (Dashboard, Alumnos, Cursos) for full CRUD operations on courses, modules, and lessons. Includes analytics, hierarchical tree view with drag & drop reordering, and enrollment management.
- **Coupon System**: Discount coupon system for courses with database-driven validation, redemption, and Mercado Pago integration.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items with drag-and-drop reordering.

### System Design Choices
- **Vercel Deployment**: Backend routes are implemented as Vercel-compatible serverless functions.
- **Admin Authorization**: Admin endpoints use `AuthError` and verify user roles via `admin_users` view.
- **SPA Fallback**: `vercel.json` configured for client-side routing and OAuth callbacks.

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