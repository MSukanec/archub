# Archub - Construction Management Platform

## Overview

Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs.

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
- **Coupon System**: Discount coupon system for courses with database-driven validation and payment integration.
- **Payment Processing**: Dual payment provider support (Mercado Pago for ARS, PayPal for USD) with webhook-based enrollment. Bank transfer payment method with receipt upload functionality - users can upload proof of payment (PDF/JPG/PNG) which enters "pending review" status until admin approval.
- **Subscription Duration**: `course_prices` table includes `months` field for subscription duration tracking.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.

### System Design Choices
- **Vercel Deployment**: Backend routes implemented as Vercel-compatible serverless functions.
- **Admin Authorization**: Admin endpoints use `AuthError` and verify user roles via `admin_users` view.
- **SPA Fallback**: `vercel.json` configured for client-side routing and OAuth callbacks.
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules (`reference`, `user`, `projects`, `subcontracts`, `courses`, `admin`, `payments`, `bank-transfer`) using a `RouteDeps` pattern for shared dependencies and consistent authentication. All modules use authenticated Supabase clients and RLS.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages to reduce initial bundle size and improve load times. Pages are lazy-loaded based on role-restriction, heavy dependencies, or infrequency of access.

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