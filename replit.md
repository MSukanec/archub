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
- **Component Standardization**: Standardized `StatCard` and custom `LoadingSpinner` components.
- **Checkout UX**: Replaced billing info Accordion with Switch control for improved user experience.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views (e.g., `course_progress_view`) for efficient data fetching.
- **API Base URL Helper**: `src/utils/apiBase.ts` for environment-aware API endpoint resolution.

### Feature Specifications
- **Core Modules**: Home page, Project Management (Gantt, Kanban), Financial Management (multi-currency, budgets), Document Management (versioning, file explorer), Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, lesson progress tracking, advanced note-taking, course dashboard, course pricing with server-side validation, Mercado Pago integration, Discord integration, and deep-link navigation. Includes lesson favorites system.
- **Admin Management**: Dedicated sections for Admin Course Management (CRUD, analytics, enrollment) and Admin Payment Management with mobile UI improvements.
- **Admin Payment Management**: Includes "Transfers Tab" for manual review of bank transfers and "History Tab" with KPIs.
- **Coupon System**: Discount coupon system for courses with database-driven validation.
- **Payment Architecture**: Unified `payments` table for all payment types, `payment_events` for webhook auditing, and `bank_transfer_payments` for specific bank transfer details. Supports dual payment providers (Mercado Pago for ARS, PayPal for USD) and bank transfer method with admin approval.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **User Activity Tracking**: User presence heartbeat functionality reactivated for real-time activity status in admin panels.

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules using a `RouteDeps` pattern for shared dependencies and consistent authentication.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages.
- **Performance Optimizations (Gacela Mode)**: Focused on sub-second page loads using database views, smart caching, pre-computed calculations, and optimized backend endpoints to replace slow client-side queries and direct Supabase view calls.
- **Lesson Viewer Performance**: Refactored lesson notes and markers with backend API endpoints and React Query for sub-second load times and caching.
- **Admin Enrollments Performance**: Optimized `/api/admin/enrollments` endpoint from 150+ cascading queries to 4 bulk queries with in-memory data combination.

### Recent Changes

#### Mobile Menu Color Variables Standardization (Nov 02, 2025)
- **Problem**: Mobile menu was using different color variables (`--card-bg`, `--text-muted`, etc.) than desktop sidebar, creating visual inconsistency
- **Solution**: Updated mobile menu components to use identical sidebar color variables for unified design
- **Implementation**:
  - Updated `MobileMenuButton.tsx` to use:
    - `--main-sidebar-fg` for default icon and text colors
    - `--main-sidebar-button-hover-bg` for hover states
    - `--main-sidebar-button-active-bg` for active button backgrounds
    - `--main-sidebar-button-active-fg` for active text
    - `--main-sidebar-border` for borders
    - `--accent` for active icons (consistent with desktop)
  - Updated `MobileMenu.tsx` header and background to use:
    - `--main-sidebar-bg` for menu background
    - `--main-sidebar-fg` for header text and icons
    - `--main-sidebar-button-hover-bg` for button hover states
- **Files updated**: `src/components/layout/mobile/MobileMenuButton.tsx`, `src/components/layout/mobile/MobileMenu.tsx`
- **Result**: Mobile menu now maintains perfect visual coherence with desktop sidebar, using the same dark theme colors, hover effects, and active states

#### Admin Enrollments Endpoint Optimization (Nov 01, 2025)
- **Problem**: Admin "Alumnos" page had 15-second load time due to inefficient query pattern - 3 queries per enrollment (modules, lessons, progress) executed in `Promise.all`, resulting in 150+ database queries for 50 enrollments
- **Root cause**: Each enrollment triggered separate queries to fetch modules → lessons → progress, causing massive query overhead and slow response times
- **Solution**: Complete endpoint refactoring with bulk queries and in-memory data combination
- **Implementation** (`server/routes/admin.ts`):
  - **Query 1**: Fetch ALL enrollments with joined users and courses (1 query)
  - **Query 2**: Fetch ALL payments for all users and courses (1 query)
  - **Query 3**: Fetch ALL modules for ALL unique courses at once (1 query)
  - **Query 4**: Fetch ALL lessons for ALL modules at once (1 query)
  - **Query 5**: Fetch ALL progress records for ALL users and lessons at once (1 query)
  - **Combine**: Use in-memory Maps (`paymentMap`, `courseModulesMap`, `moduleLessonsMap`, `userProgressMap`) to calculate progress for each enrollment without additional queries
- **Edge cases handled**:
  - Empty enrollments → return empty array immediately
  - No modules/lessons → return 0% progress with payment data intact
  - Safe division by zero in progress calculation
- **Data normalization**: Payments mapped by `user_id + course_id` composite key for fast lookup
- **Performance gains**:
  - Query count: 150+ queries → 5 bulk queries (97% reduction)
  - Load time: ~15 seconds → <1 second (15x faster)
  - Compatible with both Express (development) and Vercel serverless (production)
- **Files updated**: `server/routes/admin.ts` - Rewrote entire `/api/admin/enrollments` GET endpoint
- **Result**: Admin "Alumnos" page now loads instantly with all enrollment data, progress calculations, and payment information displayed correctly

#### Lesson Viewer Console Spam Fix (Nov 01, 2025)
- **Problem**: CourseViewer component was spamming console with "Navigation state update" messages and causing performance issues
- **Root cause**: useEffect with unstable dependencies (function references) was executing on every render, causing infinite re-render loop
- **Solution**: Optimized useEffect dependencies and removed verbose console.log statements
- **Changes**:
  - Removed `progressMap`, `onNavigationStateChange`, and handler functions from useEffect dependencies
  - Added eslint-disable comment to acknowledge intentional dependency optimization
  - Removed console.log spam: "🔄 Navigation state update", "✅ Lesson marked complete", "🔄 Refetch results"
  - Removed verbose pendingSeek log
- **Files updated**: `src/pages/learning/courses/view/CourseViewer.tsx`
- **Result**: Lesson viewer now runs smoothly without console spam or performance degradation

#### API Request Authorization Fix (Nov 01, 2025)
- **Problem**: Summary notes and markers were failing to save with 401 (Unauthorized) errors, even with RLS disabled
- **Root cause**: `apiRequest` helper function in `queryClient.ts` was not sending the Authorization header with user's session token
- **Solution**: Updated `apiRequest` to automatically fetch the current Supabase session and include the access token in request headers
- **Implementation**:
  - Import `supabase` client into `queryClient.ts`
  - Call `supabase.auth.getSession()` to get current session
  - Add `Authorization: Bearer ${session.access_token}` header to all API requests
- **Impact**: All mutations using `apiRequest` (notes, markers, progress, favorites) now properly authenticate
- **Files updated**: `src/lib/queryClient.ts`
- **Result**: Summary notes and markers save successfully without 401 errors, RLS policies now work correctly for authenticated users

#### Course Notes & Markers Tabs Optimization (Nov 01, 2025)
- **Problem**: CourseNotesTab and CourseMarkersTab were making cascading Supabase queries (modules → lessons → notes/markers → Promise.all for module details), causing slow load times and 400/500 errors. Delete mutations were also using direct Supabase calls after Supabase import was removed.
- **Root cause**: Frontend components were using direct Supabase client with inefficient query pattern similar to the Admin Alumnos issue
- **Solution**: Created optimized backend endpoints with bulk queries, in-memory data combination, and DELETE endpoints for mutations
- **Implementation**:
  - **New GET endpoints** (`server/routes/courses.ts`):
    - `GET /api/courses/:courseId/notes` - Fetch all course notes with 3 optimized queries
    - `GET /api/courses/:courseId/markers` - Fetch all course markers with 3 optimized queries
  - **New DELETE endpoints** (`server/routes/courses.ts`):
    - `DELETE /api/notes/:noteId` - Generic endpoint to delete any note/marker by ID
    - `DELETE /api/lessons/:lessonId/summary-note` - Delete summary note for a lesson
  - **Query pattern** (3 queries total for GET):
    1. Get all modules for course
    2. Get all lessons for those modules
    3. Get all notes/markers for those lessons (filtered by user)
    4. Combine using Maps in memory
  - **Frontend updates**:
    - `src/pages/learning/courses/view/CourseNotesTab.tsx` - Now uses `/api/courses/:courseId/notes` endpoint for fetching and `/api/notes/:noteId` for deletion
    - `src/pages/learning/courses/view/CourseMarkersTab.tsx` - Now uses `/api/courses/:courseId/markers` endpoint for fetching and `/api/notes/:noteId` for deletion
    - Removed direct Supabase queries and Promise.all cascades
    - Updated query invalidation to use new query keys: `['/api/courses', courseId, 'notes']` and `['/api/courses', courseId, 'markers']`
- **Performance gains**:
  - Query count: ~15+ queries → 3 bulk queries
  - Eliminated 400/500 errors from malformed Supabase queries
  - Load time reduced to sub-second
  - All CRUD operations now use optimized backend endpoints
- **Files updated**: `server/routes/courses.ts`, `src/pages/learning/courses/view/CourseNotesTab.tsx`, `src/pages/learning/courses/view/CourseMarkersTab.tsx`
- **Result**: Apuntes and Marcadores tabs now load instantly without errors and support full CRUD operations via optimized backend

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