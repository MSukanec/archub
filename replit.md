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
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.
- **Content Theming System**: Unified CSS theming layer with `--content-bg` for solid backgrounds and `--content-gradient-from/to` for gradient backgrounds. The `useContentBackground` hook automatically switches between solid backgrounds for general pages and gradient backgrounds for project pages.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
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
- **Backend Modular Architecture**: Modularized domain-specific route modules.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **AI Code Architecture**: Dual-location AI code structure to support both development (Express) and production (Vercel serverless). All AI-related changes must be made in `api/lib/ai/` (NOT `api/_lib/ai/`).
- **Payment Endpoints Architecture**: Complete refactor of payment domain with centralized checkout architecture. New structure: `/api/checkout/mp/` and `/api/checkout/paypal/` with shared handlers and helpers. Architecture includes critical security validations for server-side pricing, admin role verification, coupon validation, and authentication.
- **Vercel API Endpoints Architecture**: Complete documentation in `api/ARCHITECTURE.md`. ALL business logic in `api/lib/handlers/`, endpoints are thin wrappers. Mandatory checklist in `ENDPOINT_CHECKLIST.md` prevents regressions.

## 🚨 CRITICAL RULES - NEVER BREAK THESE

### Vercel Endpoints (Production)
1. **NO Dynamic Route Conflicts**: Never create `api/something/[id].ts` and `api/something/[id]/nested.ts` together. Use `api/something/[somethingId]/index.ts` pattern instead.
2. **ALWAYS Use api/lib/**: NEVER import from `api/_lib/` in production endpoints. The correct path is `api/lib/handlers/`.
3. **Handler-First Pattern**: ALL business logic MUST be in `api/lib/handlers/`. Endpoints are thin authentication + validation wrappers.
4. **Standard Auth Pattern**: Every endpoint MUST use the exact same Bearer token extraction pattern (see `api/ARCHITECTURE.md`).
5. **Mandatory Checklist**: ALWAYS follow `ENDPOINT_CHECKLIST.md` before creating ANY new endpoint. No exceptions.
6. **Documentation First**: READ `api/ARCHITECTURE.md` completely before touching any endpoint code.

### Development vs Production
- **Development**: Express.js server in `server/` with routes in `server/routes/`
- **Production**: Vercel serverless functions in `api/` folder
- **Shared Logic**: Business logic in `api/lib/handlers/` used by BOTH environments
- **Critical**: Changes to `api/lib/` affect both dev and prod. Test thoroughly.

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