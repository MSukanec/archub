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
- **Layout Architecture**: Experience-based layouts including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming System**: Unified CSS theming layer with dynamic background switching.
- **Smart Filtering**: Period filters disable options without data, preventing empty state confusion.
- **Dropdown/Select Components**: All use consistent CSS variables from theme system.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, LEARNING, MEDIA, SITELOG, etc.).
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