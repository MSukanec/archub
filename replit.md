# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.
CRITICAL PERFORMANCE REQUIREMENT: System must be INSTANTANEOUS. All cache invalidations must be scoped (no `featureKeys.lists()`/`all()`). Auto-save delays ≤500ms.

**CRITICAL - DO NOT TOUCH DATABASE**: NEVER modify or query the database directly. All feature flags and data ALREADY EXIST in the database. The user manages them via admin panel. Only modify frontend/backend code to READ existing data correctly.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, reusable UI components using `shadcn/ui` and Tailwind CSS.
- **Typography**: Unified Inter Variable Font with Apple-style optical letter-spacing.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors and organic radial gradients.
- **Modal Architecture**: Enterprise SaaS-level modal system with stacking, dirty form blocking, size variants, portal rendering, and a registry pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system. Unified `MobileMenu` component for marketing and dashboard contexts.
- **Layout Architecture**: Experience-based layouts including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming**: Unified CSS theming layer with dynamic background switching.
- **Financial Indicators**: All positive/negative/neutral indicators MUST use Tailwind chart color utilities.
- **Chart Components**: Completely agnostic to features, receiving data via props, following a Nivel 1 pattern (pure visualization, no wrappers, no business logic).
- **Card Component**: `AppCard` in `src/components/shared/AppCard.tsx` is the ONLY card component, with subcomponents for KPI-style cards.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, CAPITAL, LEARNING, MEDIA, SITELOG, MOODBOARD, TASKS, etc.).
- **TASKS Module**: Consolidated feature with barrel exports, agnostic forms, and container modals.
- **Technical Catalog**: Page for task, materials, and labor cost analysis.
- **Page Architecture**: 3-Layer Pattern (Page, Layout, View).
- **Lab Layout**: Enterprise navigation with context switcher, page selector, tab selector, and a right-side drawer component (`LabDrawer`).
- **Moodboard Module**: Pinterest-style inspiration board at `/project/moodboard`.
- **Finances Module**: Dual-context (Organization and Project sidebars) with automatic `project_id` assignment.
- **Capital Module**: Consolidated feature for managing capital participants, contributions, withdrawals, and adjustments.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities.
- **Core Feature Management**: Comprehensive CRUD for key entities.
- **Learning Module**: Supports course management, video integration, progress tracking, and payment integration.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways, centralized checkout, and a unified coupon system.
- **Founders Program**: Annual subscribers receive permanent founder status and lifetime bonus course access.
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component using `MEDIA_FILES` + `MEDIA_LINKS` architecture with client-side image compression.
- **Date Utilities**: All date handling uses `src/lib/date-utils.ts`.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality.
- **Universal Import System**: 5-step wizard with reusable hooks for parsing, auto-mapping, validation, and AI suggestions.
- **Subscription Expiry Notification System**: Scheduled daily job for multi-recipient email notifications.
- **Soft-Lock System**: Plan limit enforcement via `is_over_limit` flags.
- **Automated Downgrade Execution**: Hourly cron job processes expired subscriptions and scheduled downgrades.
- **Multicurrency System**: Centralized handling via `/lib/money.ts` with explicit conversion functions.
- **KPI System (Headless)**: Centralized calculation logic in `/lib/kpis.ts` with automatic refetching.
- **Subscription & Billing System**: Comprehensive management of plans, payments, billing cycles, proration, and cron jobs. Supports MercadoPago (ARS) and PayPal (USD) gateways, plus Bank Transfer for courses. Includes proration for upgrades and seat additions, and a Founders Program for annual subscribers.
- **Payment Gateway Test Mode**: Dynamic environment-based test/production switching:
  - **PayPal**: Uses `PAYPAL_ENV_SANDBOX` to activate sandbox credentials. When set, uses `PAYPAL_CLIENT_ID_SANDBOX`, `PAYPAL_CLIENT_SECRET_SANDBOX`, and `PAYPAL_WEBHOOK_ID_SANDBOX`. Automatically switches to `https://api-m.sandbox.paypal.com` endpoint.
  - **MercadoPago**: Uses `MP_ACCESS_TOKEN_TEST` to activate test credentials. When set, uses test token instead of production `MP_ACCESS_TOKEN`. Shares `MP_WEBHOOK_SECRET` between test and production.
- **Internationalization (i18n) System**: Lightweight locale system in `src/lib/i18n/` with `I18nProvider`, `useI18n` hook, and typed translations.
- **User Acquisition Tracking**: Captures UTM parameters at app load, stored in localStorage, and integrated with Supabase Auth for signup.
- **Table Component Architecture**: Modular table system in `src/components/shared/table/` with separate components and hooks for sorting, filtering, pagination, and selection.
- **Operations Center (Admin Ops)**: Enterprise-grade monitoring and incident management at `/admin/ops`. ADVISORY ONLY - never blocks user flows, only reports alerts for visibility.
- **Badge Semantic Architecture**: All badges use a semantic color system.
- **Data Health Micro Rules Architecture**: Modular validation rule system for atomic, reusable checks.
- **Save Engine**: Enterprise-grade saving system in `/core/save-engine/` with optimistic updates, automatic rollback, and debounced auto-save (delay ≤500ms).
- **Inactivity Logout**: Global session security feature via `src/hooks/useInactivityLogout.ts` - automatically logs out users after 60 minutes of inactivity.
- **Signup Boot Gate**: Global app gate via `src/layouts/initializers/BootGate.tsx` and `src/stores/appBootStore.ts` - blocks the app shell until `users.signup_completed = true`. Polls indefinitely every 1.5s until Supabase trigger completes. Prevents premature presence/heartbeat/organization queries.
- **View Name Translation System**: Centralized translator at `src/lib/view-name-translator.ts` for consistent page names across analytics and admin dashboard.
- **Course Landing Pages**: Consolidated into 2 pages sharing the same view logic via `useCourseLandingView()` hook. Page-specific layouts determine presentation (public marketing layout vs. dashboard layout). Routes: `/cursos/:slug` (public) and `/learning/courses/:slug/info` (authenticated dashboard).
- **Founders Landing Pages**: Dual-context pattern (public vs. private) using shared `FoundersContent` and `HeroSection` components from `@/features/shared-content/founders`. Routes: `/founders` (public marketing layout) and `/settings/founders` (dashboard layout). Components receive `mode="public"` or `mode="dashboard"` to control navigation behavior.
- **Activity Logging System**: Comprehensive activity tracking via `src/utils/logActivity.ts` (frontend) and `server/lib/handlers/organization/logActivity.ts` (backend). Logs to `organization_activity_logs` table with user, action, target_table, target_id, and metadata. Covers: movements, projects, site_logs, contacts, construction_tasks, organization_members, project_clients, subcontracts, personnel, materials, material_purchases. Backfill script at `scripts/backfill-activity-logs.sql`.

## External Dependencies
- **Supabase**: Authentication & User Acquisition tracking.
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
- **yet-another-react-lightbox**: Unified media lightbox.
- **browser-image-compression**: Client-side image compression.
- **@dnd-kit**: Modern drag-and-drop toolkit.
- **node-cron**: Scheduled tasks.