# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing, antialiased rendering, and consistent font weights.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients. All UI components automatically "breathe" the project color.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile) with a standardized development pattern using `FormModalLayout`, React Hook Form with Zod validation, and `useMutation` from React Query. Delete confirmation modal uses Vercel-style "type to confirm" pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Experimental layout features a two-level sidebar system: left sidebar (50px) for context navigation buttons and right sidebar (240px) for context-specific navigation on hover.
- **Content Theming System**: Unified CSS theming layer with `--content-bg` for solid backgrounds and `--content-gradient-from/to` for gradient backgrounds. The `useContentBackground` hook automatically switches between solid backgrounds for general pages and gradient backgrounds for project pages.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules). 100% Express architecture, no serverless. All backend code resides in the `server/` directory, following a modular design where core logic is in `server/lib/handlers/` and controllers orchestrate flow. All routes are registered in `server/routes.ts` with domain-specific files.
- **Database**: PostgreSQL with Drizzle ORM. Extensive use of optimized database views for efficient data fetching.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, and optimized backend endpoints. Sub-second page loads ("Gacela Mode").

### Module Architecture (Feature-Sliced Design)
- **CLIENTS Module** (November 2025): Complete refactor following Feature-Sliced Design architecture with strict separation of concerns:
  - **Services** (`src/features/clients/services/`): Pure async functions that query Supabase tables directly (NO VIEWS), all queries filter by `organization_id` for multi-tenant security. Services include: projectClients, clientCommitments, clientPayments, clientPaymentSchedule, clientRoles, contacts, dashboard.
  - **Hooks** (`src/features/clients/hooks/`): React Query hooks for caching and mutations. Hooks include: use-project-clients, use-client-commitments, use-client-payments, use-client-payment-schedule, use-client-roles, use-contacts, use-client-dashboard.
  - **Types** (`src/features/clients/types/`): All interfaces use serializable data structures (arrays and plain objects, NO Maps) to ensure React Query caching compatibility.
  - **Mappers** (`src/features/clients/mappers/`): Business logic and KPI calculations isolated from UI. Functions include: mapToClientSummaries, calculateDashboardKPIs, calculateObligationsKPIs, formatCurrencyAmount.
  - **Pages** (`src/pages/clients/`): UI orchestration ONLY, no business logic or calculations. Pages include: Clients (main), ClientListTab, ClientDashboardTab, ClientObligationsTab, ClientPaymentsTab, ClientSettingsTab, ClientPaymentPlans.
  - **Modals** (`src/components/modal/modals/clients/`): ClientCommitmentModal, ClientPaymentsModal using feature hooks.
  - **Security**: All services enforce organization_id filtering. Future enhancement: Row Level Security (RLS) policies recommended for contacts and client_roles tables.
  - **Data Quality**: All queries use TABLES directly (project_clients, client_commitments, client_payments, client_payment_schedule, client_roles, contacts), not SQL views.

- **COURSE-LANDING Module** (November 2025): Scalable course landing page system following Feature-Sliced Design architecture:
  - **Services** (`src/features/course-landing/services/`): Public async functions that query courses, modules, lessons, and FAQs from Supabase (NO AUTH required for public landing pages). Filters by `is_active` and `visibility='public'` for security. Includes `getAllPublicCourses()` for catalog listing.
  - **Hooks** (`src/features/course-landing/hooks/`): React Query hooks: `useCourseLanding(slug)` for individual landing data, `useAllCourses()` for catalog listing. Both with 1-minute cache (landing pages rarely change).
  - **Types** (`src/features/course-landing/types/`): `CourseLandingData`, `ModuleWithLessons`, `CourseStats` - all serializable for React Query caching.
  - **Mappers** (`src/features/course-landing/mappers/`): Business logic isolated from UI. Functions: `mapModulesWithLessons`, `calculateCourseStats`, `formatMinutesToTime`, `formatDuration`.
  - **Components** (`src/features/course-landing/components/`): Modular landing sections (HeroSection, InstructorSection, ModulesSection, FeaturesSection, FAQSection, CTAFooter) replicating Domestika-style design. Catalog components: CourseCard, CourseGrid with responsive layouts and loading states.
  - **Pages**: SEO-optimized public pages at `/cursos` (catalog) and `/cursos/:slug` (individual landing) with meta tags, JSON-LD structured data, and Open Graph tags for social sharing.
  - **Dual Routing Pattern**: Public landing `/cursos/:slug` for marketing/SEO + Private dashboard `/learning/courses/{id}` for enrolled users. Catalog page `/cursos` lists all available courses with navigation to individual landings.
  - **SEO Strategy**: Replicating user's WordPress site (ranks #2 on Google for "curso de archicad") with comprehensive SEO including structured data, keywords, and social meta tags.
  - **SEO Pattern (CRITICAL)**: All meta tags MUST be passed via PublicLayout's `seo` prop (keywords, ogImage, twitterImage) to ensure they render in document `<head>`. Never inject meta tags directly in JSX body - crawlers and social scrapers will miss them.
  - **Architecture Goal**: Template system where admins create courses → landing pages auto-generate (scalable like Domestika).
  - **Admin Interface**: CourseFormModal updated with 9 marketing fields (instructor, marketing, SEO sections) with array handling for highlights and keywords.
  - **Complete User Flow**: Catalog (/cursos) → Individual landing (/cursos/:slug) → Enrollment → Private dashboard (/learning/courses/{id}) with seamless navigation between all pages.

### Feature Specifications
- **Core Modules**: Home page, Project Management, Financial Management, Document Management, Learning Module, Community Map, and Notification System.
- **Community Map**: Global interactive map showing all organization projects with location data, smart clustering, and simplified popups.
- **Learning Module ("Capacitaciones")**: Course management, video integration, progress tracking, note-taking, and payment integration.
- **Admin Management**: Reorganized admin section with comprehensive analytics dashboard, date range filtering, global announcement system, and real-time active user status.
- **Real-Time Support System**: Bidirectional support conversation system with automatic read tracking and notification badges.
- **Coupon System**: Discount coupon system for courses.
- **Payment Architecture**: Unified `payments` table supporting multiple payment gateways. Centralized checkout architecture with critical security validations.
- **Access Control**: `PlanRestricted` component system with admin bypass; comprehensive access control enforcement for organization membership security.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive analysis capabilities using specialized function-calling tools.
- **User Presence & Analytics System**: Dual-layer tracking for real-time user presence and historical usage analytics.
- **Project Data Management**: Organized project information into logical tabs (Basic Data, Location, Client) with map integration and an auto-save system.
- **Mobile Action Bar**: Fully functional mobile action bars for Project Data and Project Management sections with dynamic filtering and shared state.
- **Project Client Management**: Tab-based interface for managing project clients with add/edit/delete functionality.
- **Client Roles Management**: Organizations can create and manage custom client roles with full CRUD operations.
- **Subscription System**: Complete organization subscription management with FREE, PRO, TEAMS, and ENTERPRISE plans, supporting multi-currency pricing.
- **Media Uploads**: Standardized `UploadMediaField.tsx` component for media uploads, featuring integrated upload buttons, vertical card display with progress bars, and lightbox functionality.
- **Sitelog Statistics & Filters**: Complete filtering system for construction site logs with Zustand-powered filter state (creator, date range, type, search), statistics dashboard with 4 metric cards (Total Logs with sparkline, Events, Personnel, Files), 14-day timeline visualization using MiniTrendChart, and client-side filtering optimized with useMemo.
- **Media Lightbox System**: Unified lightbox for viewing images and videos in sitelog entries. Uses `yet-another-react-lightbox` with Video plugin to support both media types seamlessly. Video thumbnails display with Play badge overlay, clicking opens full-screen player with native controls. Gallery navigation works across all media types.

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
- **Mercado Pago**: Payment gateway.
- **PayPal**: Payment gateway.
- **Vimeo**: Video hosting and integration.
- **OpenAI**: GPT-4o for AI-powered features.
- **Google Maps Platform**: For location services and interactive maps.
- **yet-another-react-lightbox**: Unified media lightbox supporting images and videos with gallery navigation.