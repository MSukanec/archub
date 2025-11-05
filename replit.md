# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified **Inter Variable Font** (100-900 weights) with Apple-style optical letter-spacing (-0.011em body, -0.022em headings), antialiased rendering, and consistent font weights across all components. Optimized line-heights (1.2-1.5) for modern, clean appearance similar to SF Pro Display.
- **Dynamic Color System**: Comprehensive project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients. Implemented with `useProjectAccentColor` hook and CSS variables.
  - **Fase 3.1 - Visual Breathing System** (Nov 2024): All UI components automatically "breathe" the project color. Badge, Button, Input, Progress primitives use `var(--accent)` with smooth transitions. Organic radial gradients with multiple color stops (5 levels), dual-layer blur effects (40px/60px), and breathing animations. Inspired by mood slider UX where everything changes color based on selection.
  - **Fase 3.3 - Project Visual Identity System** (Nov 2024): Complete dynamic color palette generation for each project. The `useProjectAccentColor` hook generates harmonic color schemes (--chart-1 through --chart-5, --accent-subtle/muted/intense, --border-accent) using analogous, complementary, and triadic color relationships. All values clamped to valid CSS ranges (0-100%) to prevent rendering errors with desaturated colors. Charts (ActivityChart, OrganizationActivityChart, ProjectActivityChart) updated to use dynamic variables, creating unified project branding across all visualizations.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile).
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub.
  - **UserQuickAccess Context-Aware Popover** (Nov 2024): Avatar popover in Main Header intelligently hides organization and project selectors on learning and profile pages to avoid mixing concepts for focused users. Uses route detection with `.includes()` to catch all variants (/learning, /admin/learning, /profile, etc.). Order: Ver Perfil button first, then conditional selectors, then plan info and logout. Clean separator management ensures consistent visual appearance whether selectors are shown or hidden.
- **Component Standardization**: Standardized `StatCard` and custom `LoadingSpinner` components that use dynamic accent colors.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and action suggestions. Chat input, disclaimer, and history toggle commented out (Nov 2024) - users interact with AI via FloatingAIChat. Home serves as a dashboard with AI-generated greeting and quick action buttons.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views (e.g., `course_progress_view`) for efficient data fetching.

### Feature Specifications
- **Core Modules**: Home page (AI-powered), Project Management, Financial Management, Document Management, Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, progress tracking, note-taking, and Mercado Pago integration.
  - **UX Improvements** (Nov 2024): Reordered course tabs for better UX flow (Visión General, Reproductor, Contenido, Apuntes, Marcadores). Renamed "Lecciones" to "Reproductor" for clarity. Enhanced CourseContentTab with direct lesson navigation button (icon-only, left of "..." menu). Moved favorite functionality to popover menu for cleaner interface. Renamed CourseViewer component to CoursePlayerTab for consistency with tab naming convention.
- **Admin Management**: Dedicated sections for Course Management, Payment Management, and Global Announcements.
  - **Global Announcements System** (Nov 2024): Admin tab for creating platform-wide announcements with audience targeting (all, free, pro, teams), type-based gradients (info, warning, error, success), date range control, smart links (mailto:, https:, tel:, wa.me/), primary/secondary buttons, and localStorage-based dismissal tracking. Visual banner appears below MainHeader in Layout.
- **Coupon System**: Discount coupon system for courses.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago (ARS), PayPal (USD), and bank transfers with admin approval.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive financial analysis capabilities, dynamic greetings, and conversational chat with persistent history.
  - **System Prompts**: Centralized AI directives for greetings and chat.
  - **Greeting Cache System**: `ia_user_greetings` table caches greetings to reduce GPT calls, independent of user prompt quota.
  - **AI Financial Analysis System**: 7 specialized function-calling tools for financial queries (e.g., `getTotalPaymentsByContactAndProject`, `getOrganizationBalance`, `getProjectFinancialSummary`). Includes detailed breakdown for `getContactMovements` to prevent GPT hallucination.
  - **Shared Utilities Module**: Natural language date parser, currency converter, and consistent Spanish response formatters.
  - **Query Optimization System**: Optimized queries for all 7 AI finance functions, selecting only required fields from `movements_view`.
  - **Anti-Hallucination System**: `getContactMovements` always returns individual movement details for the latest 15 movements.
  - **FloatingAIChat Visibility System** (Nov 2024): Route-based allowlist controls where AI assistant appears. Shows on work routes (/home, /dashboard, /projects, /movements, /construction, /admin, etc.), hidden on learning, profile, landing, and pricing pages. Desktop-only with FREE plan restrictions (blur preview). Implemented in Layout.tsx with comprehensive 19-route allowlist including Home.

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading for Admin, Learning, and Media pages.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **Personnel Module Organization**: Reorganized into modular components for improved maintainability.
- **Personnel Assignment Modal Optimization**: Enhanced with real-time search filtering and optimized loading.
- **Database Table Updates**: Renamed `attendees` to `personnel_attendees` for consistency.
- **Personnel List Alphabetical Sorting**: Guaranteed alphabetical order through query-level sorting.

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