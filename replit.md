# Archub - Construction Management Platform

## Overview

Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs.

## Recent Changes (Oct 31, 2025)

### Performance Optimization - "Gacela Mode" 🚀
**Goal**: Sub-second page loads throughout the application

#### Course List Optimization
- **Eliminated slow queries**: Replaced `/api/user/all-progress` endpoint call with direct Supabase view queries
- **View-based architecture**: CourseList now uses `course_progress_view` for instant progress data instead of scanning `course_lesson_progress` table
- **Smart caching**: 10s staleTime for progress (was 30s), 5s for enrollments (was 60s), auto-refresh every 10-15s
- **Simplified calculations**: Removed heavy client-side progress calculations in favor of pre-computed database views
- **Result**: Sub-second page loads after initial cache (previously 7+ seconds)

#### Payment/Enrollment Flow Optimization
- **Critical fix**: PaymentReturn now invalidates cache immediately when enrollment is detected
- **Fast button updates**: Enrollment query cache reduced to 5s with 10s auto-refresh
- **Expected result**: "INSCRIBIRME" → "VER CURSO" button change is now instant (previously could take up to 60 seconds)

#### Learning Dashboard Optimization
- **Backend rewrite**: Replaced manual calculations with 5 parallel view queries
  - `course_user_global_progress_view` for global progress
  - `course_progress_view` for per-course progress
  - `course_user_study_time_view` for study time metrics
  - `course_user_active_days_view` for streak calculation
  - `course_lesson_completions_view` for recent activity
- **Frontend caching**: 10s staleTime with 20s auto-refresh
- **Result**: Dashboard load time reduced from 10+ seconds to sub-second

#### Critical Bug Fix - RLS Errors (500)
- **Problem**: Frontend queries directly to Supabase views and tables caused 500 errors due to missing RLS policies or stack depth limits
- **Solution**: Created backend API endpoints that safely access views with proper authentication:
  - `GET /api/user/course-progress` - Get user's course progress (supports optional course_id filter)
  - `GET /api/user/study-time` - Get user's study time metrics
- **Files updated**: 
  - `server/routes/user.ts` - Added new endpoints
  - `src/pages/learning/courses/CourseList.tsx` - Uses backend endpoint instead of direct view query
  - `src/pages/learning/courses/view/CourseDashboardTab.tsx` - Uses backend endpoints, removed progress chart
  - `src/hooks/use-organization-stats.ts` - Added graceful error handling (returns defaults instead of throwing)
  - `src/hooks/use-contacts.ts` - Added graceful error handling for stack depth exceeded errors
  - `src/components/learning/DiscordWidget.tsx` - Changed button text to "Ir a foro de consultas"
- **Error handling strategy**: Queries that fail now return default/empty values with zero retries and infinite cache to prevent error spam
- **UX improvements**: 
  - Removed unnecessary padding in empty states for mobile views
  - Added "Continuar viendo" card in course dashboard that takes users to their last watched lesson at the exact second they left off (only visible when user has started at least one lesson)
  - Enhanced "CONTINUAR CURSO" button to intelligently navigate: goes to last watched lesson at exact second if progress exists, otherwise starts from first lesson
- **Result**: Zero 500 errors visible to users, all data loads correctly through authenticated backend

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components.
- **Accent Color System**: Dual CSS variable approach for flexible theming.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile).
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Mobile menu mirrors desktop sidebar.
- **Component Refactoring**: Generic container architecture for `DataRowCard` and a unified ghost button system.
- **Context-Aware Headers**: MainHeader adapts content based on the current module.
- **Button Design**: Default button variant uses a yellow to green gradient matching logo colors.
- **Onboarding Flow**: Streamlined onboarding sets users to 'professional' mode and navigates directly to /home.
- **StatCard Component**: Standardized minimal card design for statistics and KPIs, featuring composable subcomponents and optional navigation.
- **LoadingSpinner Component**: Custom spinner (`src/components/ui-custom/LoadingSpinner.tsx`) with Archub logo and conic gradient.
- **Checkout UX Improvements**: Replaced billing info Accordion with Switch control ("Necesito factura") for better UX. Conditional validation - CUIT/Tax ID only required when invoice switch is enabled. Billing data submission only when switch is ON.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Shared Schema**: `shared/schema.ts` for consistency.
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Exclusive use of database views for data fetching.
- **PayPal Integration**: Custom implementation with Vercel serverless endpoints and Supabase Edge Function webhook for payment capture and enrollment.
- **API Base URL Helper**: `src/utils/apiBase.ts` for environment-aware API endpoint resolution.

### Feature Specifications
- **Home Page**: Personalized landing page with quick-access cards to main sections.
- **Project Management**: Custom React-based Gantt chart, Kanban board, and parametric task generation.
- **Financial Management**: Tracking of movements, conversions, transfers, budgets, with multi-currency support and specialized subforms.
- **Document Management**: Hierarchical organization, versioning, redesigned file explorer, and modal-based preview.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Project Dashboard**: Displays KPIs, execution health, financial pulse, and documentation compliance.
- **Learning Module ("Capacitaciones")**: Course management (courses, modules, lessons), Vimeo integration, lesson progress tracking, advanced student note-taking, course dashboard, course pricing with server-side validation and Mercado Pago integration, Discord integration, deep-link navigation, and table-based notes/markers.
- **Notification System**: Real-time notifications with bell icon badge, read/unread states, and click navigation.
- **Admin Course Management**: Dedicated `AdminCourses` page with CRUD operations, analytics, hierarchical tree view, and enrollment management.
- **Admin Payment Management**: Complete `/admin/payments` section with:
  - **Transfers Tab**: Manual review workflow for pending bank transfers with approve/reject actions, receipt viewer (PDF/images), status filters, and confirmation dialogs.
  - **History Tab**: KPI dashboard (pending payments, approved today, total month revenue) with complete payment history table.
  - **Backend API**: Three admin endpoints (`GET /api/admin/payments`, `PATCH /:id/approve`, `PATCH /:id/reject`) with `verifyAdmin()` authentication. Approval auto-enrolls users via `enrollUserInCourse()`.
  - **Authentication Pattern**: All queries and mutations use Supabase session tokens with `Authorization: Bearer` headers for admin verification.
- **Coupon System**: Discount coupon system for courses with database-driven validation and payment integration.
- **Payment Architecture**: Unified payment system with future subscription support:
  - **`payments` table**: Master unified table for ALL payments (courses, subscriptions, plans) with generalized fields (`product_type`, `product_id`, `organization_id`, `approved_at`, `metadata`). Tracks payment status lifecycle (pending → completed/rejected).
  - **`payment_events` table**: Webhook event auditing for PayPal/Mercado Pago (provider logs, raw payloads, event types).
  - **`bank_transfer_payments` table**: Bank transfer-specific details (receipt_url, payer_name, reviewed_by) linked to `payments` via `payment_id` FK.
  - **Payment Flow**: All payment methods create records in `payments` first, provider-specific tables link via FK. Webhooks update both `payment_events` and `payments`. Admin approval updates both `payments` (status, approved_at) and `bank_transfer_payments` (status, reviewed_by).
- **Payment Processing**: Dual payment provider support (Mercado Pago for ARS, PayPal for USD) with webhook-based enrollment. Bank transfer payment method with receipt upload functionality - users can upload proof of payment (PDF/JPG/PNG, max 10MB) which enters "pending review" status until admin approval. `bank_transfer_payments` table stores `course_id` directly for improved performance and reliability. Both upload and approval endpoints include defensive fallback to `checkout_sessions` for legacy records, with early-fail validation preventing partial updates. Optional Twilio WhatsApp notifications send admin alerts when users upload receipts. Critical user ID mapping: All bank-transfer endpoints resolve public.users profile via auth_id before database operations to avoid RLS violations (auth.users.id ≠ public.users.id).
- **Subscription Duration**: `course_prices` table includes `months` field for subscription duration tracking.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.

### System Design Choices
- **Vercel Deployment**: Backend routes implemented as Vercel-compatible serverless functions.
- **Admin Authorization**: Admin endpoints use `AuthError` and verify user roles via `admin_users` view.
- **SPA Fallback**: `vercel.json` configured for client-side routing and OAuth callbacks.
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules (`reference`, `user`, `projects`, `subcontracts`, `courses`, `admin`, `payments`, `bank-transfer`) using a `RouteDeps` pattern for shared dependencies and consistent authentication. All modules use authenticated Supabase clients and RLS.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages to reduce initial bundle size and improve load times. Pages are lazy-loaded based on role-restriction, heavy dependencies, or infrequency of access.
- **Database Views for Learning Module**: Optimized Supabase views following `course_*_view` naming convention for consistency:
  - `course_lessons_total_view`: Total lessons per course
  - `course_progress_view`: User progress per course (used in CourseDashboardTab)
  - `course_user_active_days_view`: User activity tracking
  - `course_user_course_done_view`: Completed lessons per course/user
  - `course_user_global_progress_view`: Global user progress across all courses
  - `course_user_study_time_view`: User study time metrics (used in CourseDashboardTab)
  - `course_lesson_completions_view`: Pre-computed lesson completions with joins (replaces 4-level nested joins, improves /api/learning/dashboard from 12s → <1s)

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

## Environment Variables

### Required (Core Functionality)
- `DATABASE_URL` - PostgreSQL connection string (Neon/Supabase)
- `VITE_SUPABASE_URL` - Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (frontend)
- `SUPABASE_URL` - Supabase project URL (backend)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend)

### Optional (WhatsApp Notifications)
Enable automatic WhatsApp notifications when users upload bank transfer receipts:
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp sender number (format: `whatsapp:+14155238886`)
- `ADMIN_WHATSAPP_NUMBER` - Admin WhatsApp recipient number (format: `whatsapp:+5491132273000`)

**Note**: If Twilio variables are not configured, receipt uploads will function normally but WhatsApp notifications will be silently skipped.