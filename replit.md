# Archub - Construction Management Platform

## Overview

Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile).
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Mobile menu mirrors desktop sidebar.
- **Button Design**: Default button variant uses a yellow to green gradient matching logo colors.
- **Onboarding Flow**: Streamlined onboarding sets users to 'professional' mode and navigates directly to /home.
- **StatCard Component**: Standardized minimal card design for statistics and KPIs.
- **LoadingSpinner Component**: Custom spinner with Archub logo and conic gradient.
- **Checkout UX Improvements**: Replaced billing info Accordion with Switch control for better UX, with conditional validation for CUIT/Tax ID.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views (e.g., `course_progress_view`, `course_user_study_time_view`) for efficient data fetching, especially in the learning module.
- **API Base URL Helper**: `src/utils/apiBase.ts` for environment-aware API endpoint resolution.

### Feature Specifications
- **Core Modules**: Home page, Project Management (Gantt, Kanban), Financial Management (multi-currency, budgets), Document Management (versioning, file explorer), Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, lesson progress tracking, advanced note-taking, course dashboard, course pricing with server-side validation, Mercado Pago integration, Discord integration, and deep-link navigation.
- **Admin Management**: Dedicated sections for Admin Course Management (CRUD, analytics, enrollment) and Admin Payment Management.
- **Admin Payment Management**: Includes a "Transfers Tab" for manual review of pending bank transfers with approve/reject actions and a "History Tab" with KPIs and full payment history. Backend API supports admin endpoints with `verifyAdmin()` authentication and automatic user enrollment on approval.
- **Coupon System**: Discount coupon system for courses with database-driven validation.
- **Payment Architecture**: Unified `payments` table for all payment types (courses, subscriptions, plans) with generalized fields. `payment_events` table for webhook auditing, and `bank_transfer_payments` for specific bank transfer details. Supports dual payment providers (Mercado Pago for ARS, PayPal for USD) and a bank transfer method with receipt upload and admin approval workflow. Includes optional Twilio WhatsApp notifications for admin alerts on receipt uploads.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules using a `RouteDeps` pattern for shared dependencies and consistent authentication with Supabase clients and RLS.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages to reduce initial bundle size and improve load times.
- **Performance Optimizations (Gacela Mode)**: Focused on sub-second page loads by using database views, smart caching, pre-computed calculations, and optimized backend endpoints to replace slow client-side queries and direct Supabase view calls, effectively eliminating 500 RLS errors.

### Recent Changes

#### Admin Users & Enrollments RLS Bypass Fix (Oct 31, 2025)
- **Problem**: Admin users tab and enrollment modal couldn't display or modify users/enrollments when RLS policies were enabled because they made direct Supabase client queries subject to RLS restrictions
- **Solution**: Created backend API endpoints with service role authentication to bypass RLS for admin operations:
  - `GET /api/admin/users` - List all users with stats (search, filter, sort support)
  - `PATCH /api/admin/users/:id` - Update user status (deactivate/activate)
  - `POST /api/admin/enrollments` - Create course enrollment
  - `PATCH /api/admin/enrollments/:id` - Update course enrollment
- **Files updated**:
  - `server/routes/admin.ts` - Added user management and enrollment mutation endpoints with `verifyAdmin()` and `getAdminClient()`
  - `src/pages/admin/community/AdminCommunityUsers.tsx` - Migrated from direct Supabase queries to backend API calls
  - `src/components/modal/modals/admin/CourseEnrollmentModal.tsx` - Changed users query and enrollment mutations (create/update) to use backend API endpoints
- **Result**: Admin users tab and enrollment modal now work correctly with RLS enabled, admins can view and manage all users and create/update enrollments regardless of RLS policies

#### Learning Dashboard Cache Strategy (Oct 31, 2025)
- **Problem**: Dashboard showed empty state after enrollment because cache wasn't refreshing
- **Solution**: Changed from infinite cache to always-fresh strategy (`staleTime: 0`, `refetchOnMount: 'always'`)
- **Cache invalidation**: PaymentReturn now invalidates `/api/learning/dashboard` after successful enrollment
- **Result**: Newly enrolled courses appear immediately in dashboard with accurate 0% progress state

#### Mobile UI Improvements for Admin Modules (Nov 01, 2025)
- **Feature**: Implemented comprehensive mobile ActionBar with filtering and search across admin interfaces
- **Components created**:
  - `AdminCourseStudentRow` - Mobile row component for course enrollments with avatar, progress, and course info
  - `AdminCourseCouponRow` - Mobile row component for coupons with status badges and redemption stats
  - `AdminPaymentTransferRow` - Mobile row component for bank transfer payments with receipt button
- **Pages enhanced**:
  - `AdminCourseUsersTab` - Full mobile ActionBar (Home, Search, Create, Filter, Notifications) with search by user/course and filters by status/course
  - `AdminCourseCouponTab` - Full mobile ActionBar with search by code and filters by status/type
  - `AdminPaymentsTransfersTab` - Mobile ActionBar with search by user/course and filter by status; KPIs optimized for 2-column grid on mobile (2 top, 1 bottom)
- **Mobile UX Pattern**: All admin mobile rows follow DataRowCard pattern with avatar (left), content (center), trailing info (right), and expandable details section with action buttons
- **Result**: Admin modules now have full-featured mobile experience with search, filters, and clean mobile-optimized layouts

#### Course Content Table Redesign (Nov 01, 2025)
- **Feature**: Completely redesigned CourseContentTab to show all lessons in a comprehensive table format
- **Table Implementation**:
  - Uses Table component with `groupBy` and `renderGroupHeader` to create gray header rows for each module
  - Columns: Nombre (30%), Duración (12%), Notas (10%), Marcadores (12%), Completada (16%), Acciones (20%)
  - Actions column includes "Ir a Lección" button (default variant) that navigates to the lesson
  - Grouped by module with visual separators showing module name and lesson count
- **Component created**:
  - `LessonRow` - Mobile row component following DataRowCard pattern (no avatar), lesson title, module info, stats (duration, notes, markers) with inline status badge, and full-width "Ir a Lección" button at bottom
- **Navigation logic**:
  - Implements same deep-link navigation as CourseMarkersTab: `setCurrentLesson`, `navigate` with URL params (tab, lesson), and `goToLesson` from store
  - Properly switches to "Lecciones" tab and loads the selected lesson
- **Data sources**:
  - Modules from `course_modules`
  - Lessons from `course_lessons`
  - Progress from `/api/courses/{id}/progress`
  - Notes and markers count from `course_lesson_notes` filtered by `note_type`
- **Result**: Users can now see all course content in a single organized table view with full mobile support, making it easy to navigate between lessons and see progress at a glance

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
- **Twilio**: For optional WhatsApp notifications.
- **Mercado Pago**: Payment gateway for ARS.
- **PayPal**: Payment gateway for USD.
- **Vimeo**: Video hosting and integration for the learning module.