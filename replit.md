# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, reusable UI components using `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors and organic radial gradients.
- **Modal Architecture**: Enterprise SaaS-level modal system with stacking, dirty form blocking, size variants, portal rendering, and a registry pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system.
- **Unified Mobile Menu Architecture**: Single `MobileMenu` component in `src/layouts/dashboard/components/MobileMenu/` serves both marketing and dashboard contexts. Uses `useMobileMenuStore` with mode-aware rendering ('marketing' vs 'dashboard'). Wrapper-based architecture with `MarketingMenuContent` (lightweight: only useAuthStore + useLocation) and `DashboardMenuContent` (full dashboard hooks) to prevent unnecessary data fetching in marketing mode. Marketing mode includes smooth scroll for hash anchors. Open via `openMenu('marketing')` or `openMenu('dashboard')`.
- **Layout Architecture**: Experience-based layouts including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming System**: Unified CSS theming layer with dynamic background switching.
- **Smart Filtering**: Period filters disable options without data, preventing empty state confusion.
- **Dropdown/Select Components**: All use consistent CSS variables from theme system.
- **Financial Indicator Colors**: ALL positive/negative/neutral indicators MUST use Tailwind chart color utilities (`text-chart-positive`, `text-chart-negative`, `text-chart-neutral`, `bg-chart-positive/10`, etc.) which map to CSS variables `--chart-positive`, `--chart-negative`, `--chart-neutral`. NEVER use hardcoded colors like `text-green-600` or `text-red-600` for financial indicators.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, CAPITAL, LEARNING, MEDIA, SITELOG, MOODBOARD, etc.).
- **Page Architecture (3-Layer Pattern)**: Clean separation between **Page** (orquestación + layout selection + tab state), **Layout** (estructura: header, sidebar, toolbar), and **View** (contenido: tablas, KPIs, gráficos). Documented in `prompts/PAGE-REFACT.md`. Examples:
  - Projects page: `Projects.tsx` (Page) → `LabLayout`/`DashboardLayout` (Layout) → `ProjectActivesView`/`ProjectListView`/`ProjectSettingsView` (Views)
  - Project Dashboard: `Project.tsx` (Page) → `LabLayout`/`DashboardLayout` (Layout) → `ProjectVisionGeneralView` (View)
  - Learning Dashboard: `LearningDashboard.tsx` (Page) → `LabLayout`/`DashboardLayout` (Layout) → `LearningDashboardView` (View)
  - Course List: `CourseList.tsx` (Page) → `LabLayout`/`DashboardLayout` (Layout) → `CourseListView` (View)
- **Lab Layout (3-Level Mega-Menu)**: Enterprise navigation with context switcher (Organización/Proyecto/Learning), page selector (Gestión de Proyectos), and tab selector (Vista) via hover-based full-width dropdowns.
- **Moodboard Module**: Pinterest-style inspiration board accessible at `/project/moodboard`. Located in "DISEÑO" navigation section between "GESTIÓN" and "CONSTRUCCIÓN". Uses shared Gallery component to display pins from Chrome extension. Feature code in `src/features/moodboard/` and page in `src/pages/moodboard/`. Backend endpoint at `GET /api/pins`. Note: Current pins table is global (no project_id column), so pins are shared across all projects.
- **Finances Module (Dual-Context)**: Accessible from both Organization sidebar (`/finances`) and Project sidebar (`/project/finances`). When accessed from Project context, movements auto-assign `project_id`. From Organization context, modal shows project selector only for types that require it. Movement types WITH project: `client_payment`, `material_payment`, `personnel_payment`. Movement types WITHOUT project: `partner_contribution`, `partner_withdrawal`, `general_cost_payment`.
- **Capital Module**: Manages capital participants (formerly "partners/socios"). Database tables: `capital_participants` (main), `partner_contributions`, `partner_withdrawals`. Located at `/organization/capital` with feature code in `src/features/capital` and pages in `src/pages/capital`.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities.
- **Core Feature Management**: Comprehensive CRUD for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout, including PayPal and Mercado Pago subscription flows. Features proration for upgrades and a unified coupon system.
- **Founders Program**: Annual subscribers receive permanent founder status and lifetime access to a bonus course, with enrollment suspension/reactivation logic.
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component for image and multi-file uploads using a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture, with client-side image compression and a 3-bucket storage architecture.
- **Date Utilities**: All date handling uses `src/lib/date-utils.ts` to avoid timezone issues.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **Modal Naming Standard**: Modals follow `<Entity>Form.tsx` naming convention, stored in `forms/` folders, and support CREATE/EDIT/VIEW modes.
- **Drawer Architecture**: Enterprise SaaS-level drawer system mirroring the modal architecture.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality.
- **Universal Import System**: 5-step wizard with reusable hooks for parsing, auto-mapping, validation, and AI-powered suggestions.
- **Subscription Expiry Notification System**: Scheduled daily job for multi-recipient email notifications.
- **Soft-Lock System**: Plan limit enforcement via `is_over_limit` flags on `projects` and `organization_members`.
- **Automated Downgrade Execution**: Hourly cron job processes expired subscriptions and scheduled downgrades.
- **Downgrade Impact Calculation**: `DowngradeModal` fetches usage stats and calculates resources to be locked.
- **Lab Neural Network Renderer System**: Extensible node rendering architecture for neural network graphs.
- **Organization Activity Tracking System**: Comprehensive audit logging for organization actions.
- **Founders Portal**: Private area for founder organizations with a directory, events, voting, and forum features, protected by access control.
- **Multicurrency System**: Centralized handling via `/lib/money.ts` with `amount_in_base = amount * exchange_rate` and explicit conversion functions.
- **KPI System (Headless)**: Centralized calculation logic in `/lib/kpis.ts` for monetary, count, percentage, and text KPIs, with automatic refetching on currency changes.
- **Subscription & Billing System**: Comprehensive management of plans, subscriptions, payments, billing cycles, proration, seat-based billing, coupons, soft-locks, and cron jobs for expiry and downgrades.
- **Internationalization (i18n) System**: Lightweight locale system in `src/lib/i18n/` with `I18nProvider`, `useI18n` hook, and typed translations (es/en). Table component labels use `getTableLabels(locale)` for dynamic language switching. Default locale is Spanish with browser detection fallback.
- **Table Component Architecture**: Modular table system in `src/components/shared/table/` with separate components (TableDesktop, TableMobile, TableRow, TableGroup) and hooks (useTableSort, useTableFilter, useTablePagination, useTableSelection). Original monolithic Table.tsx in `tables-and-trees/` maintained for backward compatibility.
- **Operations Center (Admin Ops)**: Enterprise-grade monitoring and incident management at `/admin/ops`. Features automated health checks (payment/plan mismatches, stuck webhooks, failed jobs, system integrity), persistent alerts with deduplication, preventive flow blocking (`useFlowBlocking` hook + `FlowBlockedBanner`), guided repair actions (acknowledge, resolve, apply_plan_to_org, create_missing_subscription, retry_webhook_processing), and runbooks. Tables: `ops_alerts`, `ops_check_runs`, `ops_runbooks`. Pending: `ops_repair_logs` table for repair action audit logging.
- **Badge Semantic Architecture**: All badges use a **semantic color system**. Each badge variant (success, error, warning, pending, info, neutral, plan-free, plan-pro, plan-teams, plan-enterprise, status-*) maps to a CSS variable. Badges automatically render with: TEXT COLOR = 100% opacity of variant color, BACKGROUND = 10% opacity of variant color using CSS `color-mix()`. **NEVER use inline styles like `style={{ backgroundColor, color: 'white' }}`** - this breaks the semantic system. Always use `<Badge variant="plan-free">` or `<Badge variant="success">` and let the component handle opacity/colors via CSS variables defined in `src/index.css`.
- **Data Health Micro Rules Architecture**: Modular validation rule system in `src/core/data-health/rules/micro/`. **Micro rules** are atomic, reusable validation checks (missing-exchange-rate, future-date, missing-relation, missing-wallet). **Feature rules** compose micro rules via `createFeatureRule()` adapter, specifying legacy `ruleId` for backward compatibility. The `registry.ts` maps all ruleIds to icons/severity for consistent visuals. When adding new data health checks: (1) Create or reuse a micro rule, (2) Create feature rule with explicit `ruleId` matching legacy patterns, (3) Register the ruleId in the registry.

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