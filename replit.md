# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## Recent Changes (Nov 16, 2025)
- **Context-Aware Data Views**: Implemented organization-wide data viewing system with project selector.
- **Client Management Enhancement**: Fixed critical filtering bug where client tables now properly filter by active project using dynamic `selectedProjectId`.
- **Organization Context**: Added "Organización" option to project selector for viewing all data across projects.
- **Backend Organization Endpoints**: Created new endpoints for organization-wide client and payment data.
- **Performance Optimization - Fase 1 (Gacela Mode)**: Implemented intelligent prefetching for all client tabs with 3-minute staleTime, enabling instant tab switching after initial load. Dashboard, List, and Obligations tabs share the same `/clients/summary` query for maximum efficiency.
- **Client Payments `created_by` Field**: Added `created_by` field tracking to client payments modal, matching MovementModal pattern. Submit button is disabled until organization member data loads to ensure data integrity.
- **Organization Dashboard KPIs**: Added 4 KPI cards to Visión General dashboard showing organization-wide metrics: Clientes (total count), Pagos (payment records), Compromiso Total (total committed amount), and Balance Pendiente (outstanding balance). Cards link to specific client tabs with URL parameters. Mobile-responsive with 2 columns per row.
- **Clients Tab Navigation**: Enhanced Clients page to accept `?tab=` URL parameter for direct navigation to specific tabs (list, details, obligations, etc.).
- **Sidebar Feature Gating**: Blocked "Movimientos" button in organization sidebar with `coming_soon` restriction.
- **Client Commitments Feature**: Implemented complete CRUD functionality for client commitments with ClientCommitmentModal following standard modal pattern (FormModalLayout, RHF + Zod validation, React Query mutations). Backend includes comprehensive security layer with auth validation, organization access checks, project ownership verification, and client_id validation. REST endpoints: GET/POST/PATCH/DELETE `/api/projects/:projectId/client-commitments` with Supabase file upload support.
- **Database View Optimization**: Created `client_payments_view` for PAGOS tab with pre-computed JOINs across contacts, users, project_clients, currencies, wallets, commitments, schedules, and projects. Backend handlers now use single SELECT from view instead of manual JOINs for improved performance.
- **PAGOS Tab UX Enhancement**: Adjusted column widths (Cliente: 400px → 220px, Notas: auto → 400px) with text truncation for better space utilization and readability.
- **Client Tabs Performance Optimization**: Created `client_obligations_view` using ONLY base tables (project_clients, contacts, users, client_roles, currencies, client_commitments, client_payments) with pre-computed financial aggregations via CTEs. Includes basic client data + financial data by currency (compromiso total, pagado, saldo, fechas). Both LISTA and COMPROMISOS tabs use same optimized view. Handlers group results by client_id and build financialByCurrency arrays.
- **PAGOS Tab Direct Table Queries**: Modified client payments handlers (`server/lib/handlers/projects/clientPayments.ts` and `server/lib/handlers/organization/clientPayments.ts`) to query `client_payments` table directly with explicit LEFT JOINs instead of using `client_payments_view`. The view was hiding payments with NULL values in optional relationships (wallet_id, commitment_id, schedule_id) due to INNER JOIN logic. Direct queries ensure ALL payment data is visible regardless of optional fields.
- **LISTA & COMPROMISOS Tabs Direct Table Queries Fix**: Replaced problematic `client_obligations_view` usage with direct Supabase queries in both `server/lib/handlers/projects/projectClients.ts` (getClientsSummary) and `server/lib/handlers/organization/clients.ts` (getOrganizationClientsSummary). Root cause: The view's dependency chain (`cpa.currency_id = cca.currency_id` and `curr.id = cca.currency_id`) caused data loss when clients had payments but no commitments (cca.currency_id = NULL). Solution: Direct queries with independent LEFT JOINs for commitments and payments, then application-layer aggregation by currency using Map data structure. This ensures ALL client data is visible even when commitments or payments are missing. Includes fallback for NULL currency joins with `{ code: 'UNKNOWN', symbol: '?' }` to prevent payment-only currency data loss.
- **Home Page Simplification**: Removed AI greeting system from HOME page. Now displays simple "Hola, [first_name]" greeting without AI-powered dynamic greetings, suggestions, or chat functionality. Significantly reduced component complexity and eliminated unnecessary API calls to `/api/ai/home_greeting` and `/api/ai/chat`.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing, antialiased rendering, and consistent font weights.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients. All UI components automatically "breathe" the project color.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile) with a standardized development pattern using `FormModalLayout`, React Hook Form with Zod validation, and `useMutation` from React Query. Delete confirmation modal uses Vercel-style "type to confirm" pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Experimental layout features a two-level sidebar system: left sidebar (50px) for context navigation buttons and right sidebar (240px) for context-specific navigation on hover.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.
- **Content Theming System**: Unified CSS theming layer with `--content-bg` for solid backgrounds and `--content-gradient-from/to` for gradient backgrounds. The `useContentBackground` hook automatically switches between solid backgrounds for general pages and gradient backgrounds for project pages.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules). 100% Express architecture, no serverless.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views for efficient data fetching.

### Feature Specifications
- **Core Modules**: Home page (AI-powered), Project Management, Financial Management, Document Management, Learning Module, Community Map, and Notification System.
- **Community Map**: Global interactive map powered by React Leaflet showing all organization projects with location data, smart clustering, and simplified popups.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, progress tracking, note-taking, and Mercado Pago integration.
- **Admin Management**: Reorganized admin section with comprehensive analytics dashboard, date range filtering, global announcement system, and real-time active user status.
- **Real-Time Support System**: Bidirectional support conversation system with automatic read tracking and notification badges, powered by Supabase Realtime.
- **Coupon System**: Discount coupon system for courses.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago, PayPal, and bank transfers.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive analysis capabilities using 13 specialized function-calling tools, dynamic greetings, and conversational chat with persistent history.
- **User Presence & Analytics System**: Dual-layer tracking for real-time user presence and historical usage analytics.
- **Organization Membership Security System**: Comprehensive access control enforcement for secure access and invalid organization access.
- **Project Data Management**: Organized project information into logical tabs (Basic Data, Location, Client) with Google Maps integration and an auto-save system.
- **Mobile Action Bar**: Fully functional mobile action bars for Project Data and Project Management sections with dynamic filtering and shared state.
- **Project Client Management**: Tab-based interface using Table.tsx for managing project clients with add/edit/delete functionality. API endpoints implement complete security layer.
- **Client Roles Management**: Organizations can create and manage custom client roles in addition to system-provided global roles with full CRUD operations and server-side organization_id derivation.
- **Subscription System**: Complete organization subscription management with FREE, PRO, TEAMS, and ENTERPRISE plans, supporting multi-currency pricing via `plan_prices` table.

### System Design Choices
- **Backend Modular Architecture**: Express-only architecture with modularized domain-specific route modules. All code in `server/` folder.
- **Backend Structure**: Routes in `server/routes/`, controllers in `server/controllers/`, shared handlers in `server/lib/handlers/`. See `server/ARCHITECTURE.md` for details.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **Payment Endpoints Architecture**: Complete payment domain with centralized checkout architecture. Handlers in `server/lib/handlers/checkout/mp/` and `server/lib/handlers/checkout/paypal/` with shared helpers. Architecture includes critical security validations for server-side pricing, admin role verification, coupon validation, and authentication.

## 🚨 CRITICAL RULES - NEVER BREAK THESE

### Backend Architecture (Express-Only)
1. **All code in server/**: The `/api` folder was completely eliminated. All backend code lives in `server/`.
2. **Follow server/ARCHITECTURE.md**: Read and follow the documented architecture patterns.
3. **Business Logic Location**: Core logic is in `server/lib/handlers/`, controllers orchestrate the flow.
4. **No Vercel Dependencies**: Never add `@vercel/node` or any serverless-specific packages.
5. **Standard Auth Pattern**: Every endpoint uses Bearer token extraction via `server/lib/auth/helpers.ts`.
6. **Route Registration**: All routes registered in `server/routes.ts` with domain-specific route files.

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
- **Google Maps Platform**: For location services and interactive maps.