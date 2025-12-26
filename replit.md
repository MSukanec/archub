# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.
**CRITICAL PERFORMANCE REQUIREMENT:** System must be INSTANTANEOUS. All cache invalidations must be scoped (no `featureKeys.lists()`/`all()`). Auto-save delays ≤500ms.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, reusable UI components using `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors and organic radial gradients.
- **Modal Architecture**: Enterprise SaaS-level modal system with stacking, dirty form blocking, size variants, portal rendering, and a registry pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system.
- **Unified Mobile Menu Architecture**: Single `MobileMenu` component serving both marketing and dashboard contexts, with mode-aware rendering.
- **Layout Architecture**: Experience-based layouts including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming System**: Unified CSS theming layer with dynamic background switching.
- **Financial Indicator Colors**: All positive/negative/neutral indicators MUST use Tailwind chart color utilities (`text-chart-positive`, `text-chart-negative`, etc.) which map to CSS variables.
- **Chart Components (AGNOSTIC NORM)**: Charts in `src/components/charts/` must be COMPLETELY AGNOSTIC to features - no feature-specific names or content. Generic charts receive data via props; views transform feature data to generic formats. Example: `CategoryBalanceTable` (generic) vs `WalletCurrencyBalanceTable` (feature-specific, wrong).
- **Chart Library Architecture**: Type-based folder structure (`line/`, `bar/`, `pie/`, `radial/`, `composed/`, `heatmap/`, `sparkline/`) with unified theme system (`theme.ts`) and centralized exports (`index.ts`). All charts follow Nivel 1 pattern: pure visualization, no Card wrappers, no business logic. Chart Gallery at `/admin/design-system` for visual catalog. Key charts: TrendLineChart, MultiLineChart, VerticalBarChart, HorizontalBarChart, GroupedBarChart, SegmentedBarChart, DonutChart, ProgressRingChart, ComposedBarLineChart, FinancialFlowChart, BalanceTimelineChart, HeatmapGrid, SparklineChart.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, CAPITAL, LEARNING, MEDIA, SITELOG, MOODBOARD, etc.).
- **Page Architecture (3-Layer Pattern)**: Clean separation between **Page**, **Layout**, and **View**. Pages end with `*Page.tsx` and Views with `*View.tsx`.
- **Lab Layout (3-Level Mega-Menu)**: Enterprise navigation with context switcher, page selector, and tab selector via hover-based full-width dropdowns.
- **Lab Layout Drawer System**: Right-side drawer component (`LabDrawer`) for forms and page-specific content, managed via `useLabDrawerStore`.
- **Moodboard Module**: Pinterest-style inspiration board at `/project/moodboard`, accessible via "DISEÑO" navigation.
- **Finances Module (Dual-Context)**: Accessible from both Organization and Project sidebars, with movements auto-assigning `project_id` when in project context.
- **Capital Module**: Manages capital participants, contributions, and withdrawals at `/organization/capital`.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities.
- **Core Feature Management**: Comprehensive CRUD for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways (PayPal, Mercado Pago), centralized checkout, proration, and a unified coupon system.
- **Founders Program**: Annual subscribers receive permanent founder status and lifetime access to a bonus course.
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component for image and multi-file uploads using a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture, with client-side image compression.
- **Date Utilities**: All date handling uses `src/lib/date-utils.ts` to avoid timezone issues.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality.
- **Universal Import System**: 5-step wizard with reusable hooks for parsing, auto-mapping, validation, and AI-powered suggestions.
- **Subscription Expiry Notification System**: Scheduled daily job for multi-recipient email notifications.
- **Soft-Lock System**: Plan limit enforcement via `is_over_limit` flags on `projects` and `organization_members`.
- **Automated Downgrade Execution**: Hourly cron job processes expired subscriptions and scheduled downgrades.
- **Multicurrency System**: Centralized handling via `/lib/money.ts` with explicit conversion functions.
- **KPI System (Headless)**: Centralized calculation logic in `/lib/kpis.ts` for various KPI types, with automatic refetching on currency changes.
- **Subscription & Billing System**: Comprehensive management of plans, subscriptions, payments, billing cycles, proration, seat-based billing, coupons, soft-locks, and cron jobs.
- **Internationalization (i18n) System**: Lightweight locale system in `src/lib/i18n/` with `I18nProvider`, `useI18n` hook, and typed translations.
- **Table Component Architecture**: Modular table system in `src/components/shared/table/` with separate components and hooks for sorting, filtering, pagination, and selection.
- **Operations Center (Admin Ops)**: Enterprise-grade monitoring and incident management at `/admin/ops`, featuring automated health checks, persistent alerts, preventive flow blocking, guided repair actions, and runbooks.
- **Badge Semantic Architecture**: All badges use a semantic color system, mapping variants to CSS variables for consistent styling.
- **Data Health Micro Rules Architecture**: Modular validation rule system in `src/core/data-health/rules/micro/` for atomic, reusable checks.
- **Save Engine (Centralized Saving)**: Enterprise-grade saving system in `/core/save-engine/` with optimistic updates, automatic rollback, and debounced auto-save. Hooks: `useSaveEngine` for auto-save forms (delay ≤500ms), `useOptimisticMutation` for point actions. Documentation at `/docs/save-architecture.md`.
- **Performance Standards (CRITICAL)**: 
  - Auto-save delays: 500ms MAX (NOT 1500ms)
  - Cache invalidations: SCOPED to organizationId/id (NEVER use `featureKeys.lists()` or `featureKeys.all()`)
  - Query keys: ALWAYS use centralized factory from `/core/query-keys/`
  - Optimistic updates: MUST work without backend dependency
  - Rule: If a change takes >500ms, it's too slow - audit cache invalidations
  - Audit guideline in `prompts/FEATURE-AUDIT.md` section 5.3

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
- **yet-another-react-lightbox**: Unified media lightbox.
- **browser-image-compression**: Client-side image compression.
- **@dnd-kit**: Modern drag-and-drop toolkit.
- **node-cron**: Scheduled tasks.