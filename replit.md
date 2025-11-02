# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

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
- **Core Modules**: Home page (AI-powered with personalized greetings and suggestions), Project Management (Gantt, Kanban), Financial Management (multi-currency, budgets), Document Management (versioning, file explorer), Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, lesson progress tracking, advanced note-taking, course dashboard, course pricing with server-side validation, Mercado Pago integration, Discord integration, and deep-link navigation. Includes lesson favorites system.
- **Admin Management**: Dedicated sections for Admin Course Management (CRUD, analytics, enrollment) and Admin Payment Management with mobile UI improvements, including "Transfers Tab" and "History Tab" with KPIs.
- **Coupon System**: Discount coupon system for courses with database-driven validation.
- **Payment Architecture**: Unified `payments` table for all payment types, `payment_events` for webhook auditing, and `bank_transfer_payments` for specific bank transfer details. Supports dual payment providers (Mercado Pago for ARS, PayPal for USD) and bank transfer method with admin approval.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **User Activity Tracking**: User presence heartbeat functionality for real-time activity status in admin panels.
- **AI Integration**: GPT-4o for dynamic, personalized greetings and actionable suggestions on the Home page, using user context from projects, courses, and budgets.

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules using a `RouteDeps` pattern for shared dependencies and consistent authentication.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages.
- **Performance Optimizations (Gacela Mode)**: Focused on sub-second page loads using database views, smart caching, pre-computed calculations, and optimized backend endpoints to replace slow client-side queries and direct Supabase view calls.
- **Lesson Viewer Performance**: Refactored lesson notes and markers with backend API endpoints and React Query for sub-second load times and caching.
- **Admin Enrollments Performance**: Optimized `/api/admin/enrollments` endpoint from 150+ cascading queries to 4 bulk queries with in-memory data combination.

## External Dependencies
- **Supabase**: Authentication.
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
- **OpenAI**: GPT-4o for AI-powered features.