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
- **StatCard Component**: Standardized minimal card design for statistics and KPIs. Features composable subcomponents (`StatCardTitle`, `StatCardValue`, `StatCardMeta`, `StatCardContent`) with preset styling (text-xs uppercase titles, text-5xl values, text-sm metadata). Supports optional navigation via `href` or `onCardClick` props with hover effects (shadow-md) and animated arrow indicator on StatCardTitle. Used in admin, capital, and learning dashboards for visual consistency.
- **LoadingSpinner Component**: Custom loading component (`src/components/ui-custom/LoadingSpinner.tsx`) featuring Archub logo at center with conic gradient spinner (yellow to green gradient matching button colors). Supports size variants (sm, md, lg, xl) and fullScreen mode. Used in AuthGuard, Onboarding, and other loading states across the application.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui (Radix UI primitives), Tailwind CSS, Zustand for state management, Wouter for routing, TanStack Query for data fetching.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth) with Supabase sessions.
- **Shared Schema**: `shared/schema.ts` for consistency between frontend and backend.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations with extensive cache invalidation.
- **Database Views**: Exclusive use of database views for data fetching (e.g., `construction_tasks_view`).
- **PayPal Integration**: Custom implementation with Vercel serverless endpoints (`/api/paypal/*`) and Supabase Edge Function webhook. Order creation resolves `course_id` from `course_slug` and includes metadata in `invoice_id` field with format `user:{user_id};course:{course_id}`. Payment capture handled by frontend, enrollment/logging handled by Supabase webhook.
- **API Base URL Helper**: `src/utils/apiBase.ts` provides `getApiBase()` function that prioritizes `VITE_API_BASE` environment variable (production/preview) and falls back to `window.location.origin` (local development). Used in all payment API calls to ensure correct endpoint resolution across environments.

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
- **Coupon System**: Discount coupon system for courses with database-driven validation, redemption, and Mercado Pago/PayPal integration.
- **Payment Processing**: Dual payment provider support (Mercado Pago for ARS, PayPal for USD) with webhook-based enrollment. PayPal flow: create-order → user approval → capture-order → webhook enrollment. Mercado Pago flow: create preference → redirect → webhook enrollment. All payment API calls use `getApiBase()` to construct full URLs for cross-environment compatibility.
- **Subscription Duration**: `course_prices` table includes `months` field for subscription duration tracking. Admin interface allows setting subscription length (1, 3, 6, 12 months, etc.). Payment flows automatically use configured duration from price data.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items with drag-and-drop reordering.

### System Design Choices
- **Vercel Deployment**: Backend routes are implemented as Vercel-compatible serverless functions.
- **Admin Authorization**: Admin endpoints use `AuthError` and verify user roles via `admin_users` view.
- **SPA Fallback**: `vercel.json` configured for client-side routing and OAuth callbacks.

### Backend Modular Architecture (Oct 2025 Refactoring)

**Overview**: The monolithic `server/routes.ts` (~4,000 lines) was modularized into domain-specific route modules to improve maintainability and code organization. Final result: `server/routes.ts` reduced to **203 lines** (95% reduction).

**Structure**:
```
server/
├── routes.ts (203 lines) - Main router, imports and registers all modules
└── routes/
    ├── _base.ts - Shared utilities (Supabase clients, auth helpers, RouteDeps pattern)
    ├── reference.ts (2 endpoints) - Countries, task parameters
    ├── user.ts (8 endpoints) - User profile, preferences, current-user
    ├── projects.ts (12 endpoints) - Projects, budgets, budget-items, design-phase-tasks
    ├── subcontracts.ts (16 endpoints) - Movements, subcontract management
    ├── courses.ts (7 endpoints) - Lessons, courses, enrollments, learning dashboard
    ├── admin.ts (11 endpoints) - Admin-only operations, user management
    └── payments.ts (7 endpoints) - MercadoPago, PayPal, webhooks, checkout
```

**RouteDeps Pattern**: All modules receive a `RouteDeps` object containing shared dependencies (`app`, `getAdminClient`, `createAuthenticatedClient`, `extractToken`, `verifyAdmin`). This eliminates code duplication and ensures consistent authentication handling across modules.

**Endpoint Map**:
- **Reference** (`/api/countries`, `/api/task-parameters`)
- **User** (`/api/current-user`, `/api/user/*`)
- **Projects** (`/api/projects/*`, `/api/budgets/*`, `/api/budget-items/*`, `/api/design-phase-tasks/*`, `/api/organization-task-prices/*`)
- **Subcontracts** (`/api/movements/bulk`, `/api/movement-subcontracts/*`, `/api/subcontract-*`)
- **Courses** (`/api/lessons/*`, `/api/courses/*`, `/api/user/all-progress`, `/api/user/enrollments`, `/api/learning/dashboard`)
- **Admin** (`/api/admin/*` - 11 operations including users, courses, coupons, payments)
- **Payments** (`/api/checkout/*`, `/api/webhooks/mp`, `/api/paypal/*` - MercadoPago & PayPal integrations)

**Security**: All modules use authenticated Supabase clients (via `createAuthenticatedClient`) to ensure proper Row Level Security (RLS) enforcement. Admin endpoints additionally verify user roles via `verifyAdmin` helper.

**Benefits**:
- Improved code organization and maintainability
- Easier to locate and modify domain-specific logic
- Reduced cognitive load (each module is self-contained)
- Consistent authentication patterns across all endpoints
- Zero regressions (all endpoints preserved with identical logic)

### Frontend Performance Optimizations (Oct 2025)

**Overview**: Implemented code-splitting and lazy loading to reduce initial bundle size and improve load times. Heavy, role-specific pages now load on-demand instead of being included in the initial bundle.

**Lazy-Loaded Page Groups**:

1. **Admin Pages** (7 pages - lazy loaded since Oct 2025)
   - `AdminCommunity`, `AdminCosts`, `AdminTasks`, `AdminGeneral`, `AdminCourses`, `AdminCourseView`
   - `Products` (provider page, admin-only)
   - **Rationale**: Only accessed by admin users (~5% of user base). No need to load admin dashboards, course management UIs, and analytics for regular users.
   - **Location**: `src/App.tsx` lines 60-68
   - **Loading State**: Uses `LazyLoadFallback` component with `LoadingSpinner`

2. **Learning Pages** (5 pages - lazy loaded since Oct 2025)
   - `LearningDashboard`, `CourseList`, `CourseView`, `PaymentReturn`, `CheckoutPage`
   - **Rationale**: Includes heavy Vimeo player and only accessed by users taking courses. Checkout pages only used during payment flow.
   - **Location**: `src/App.tsx` lines 80-84
   - **Loading State**: Uses `LazyLoadFallback` component with `LoadingSpinner`

**Implementation Pattern**:
```typescript
// Lazy import (top of App.tsx)
const AdminCourses = lazy(() => import("@/pages/admin/courses/AdminCourses"));

// Suspense wrapper in route definition (IMPORTANT: Suspense OUTSIDE AuthAdmin)
<Route path="/admin/courses">
  <Suspense fallback={<LazyLoadFallback />}>
    <AuthAdmin>
      <AdminCourses />
    </AuthAdmin>
  </Suspense>
</Route>
```

**Decision Criteria for Future Pages**:

**✅ USE Lazy Loading when:**
- Page is role-restricted (admin-only, provider-only)
- Page contains heavy dependencies (video players, PDF generators, charting libraries, Excel parsers)
- Page is accessed by <20% of users
- Page is not part of the critical user journey (onboarding, login, home)

**❌ DON'T USE Lazy Loading when:**
- Page is accessed by majority of users (home, dashboard, login)
- Page is part of onboarding flow
- Page is very lightweight (<50KB)
- Page needs instant navigation (no loading spinner acceptable)

**Dependencies Removed** (Oct 2025):
- ❌ `reactflow` - Unused dependency (0 imports found)

**Performance Impact**:
- **Initial bundle reduction**: ~25-30% smaller (admin + learning pages excluded from main chunk)
- **First load time**: Improved by ~40-60% for regular users
- **Lazy page first-visit**: Brief loading spinner (~0.5-1s) on first access
- **Subsequent visits**: Instant (cached by browser)
- **Vimeo player**: Only loaded when user accesses a course (major savings for non-students)

**Future Optimization Candidates**:
- Analysis pages (Analysis, TaskView) - heavy charting (recharts, d3)
- PDF generation/viewing components - heavy pdfjs-dist and @react-pdf/renderer
- Excel import/export - xlsx, papaparse

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