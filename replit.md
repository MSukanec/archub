# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing, antialiased rendering, and consistent font weights.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile) with standardized development patterns using `FormModalLayout`, React Hook Form with Zod validation, and `useMutation` from React Query. Delete confirmation uses Vercel-style "type to confirm".
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Experimental two-level sidebar system for context navigation.
- **Content Theming System**: Unified CSS theming layer with `--content-bg` for solid backgrounds and `--content-gradient-from/to` for gradient backgrounds, dynamically switched by `useContentBackground` hook.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), 100% Express architecture with modular design (`server/lib/handlers/` for core logic, `server/routes.ts` for routing).
- **Database**: PostgreSQL with Drizzle ORM, utilizing optimized database views.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints for sub-second page loads.

### Module Architecture (Feature-Sliced Design)
- **CLIENTS Module**: Refactored with strict separation of concerns for services, hooks, types, mappers, pages, and modals. Services query Supabase tables directly with `organization_id` filtering for multi-tenancy.
- **COURSE-LANDING Module**: Scalable course landing page system with public services for courses, modules, lessons, and FAQs (no auth required). Includes React Query hooks for caching, mappers for business logic, and modular components. Features SEO-optimized public pages (`/cursos`, `/cursos/:slug`) with meta tags, JSON-LD, and Open Graph. Implements a dual routing pattern for public landing and private dashboard. Admin interface includes auto-save for landing page fields.
- **FINANCES Module**: Unified financial movements audit system. Services compose existing entity services (e.g., from CLIENTS module) for `getAllFinancialMovements`. Uses React Query hook `useFinancialMovements`. Defines a `FinancialMovement` interface to normalize various payment tables (e.g., client_payments, material_payments).

### Feature Specifications
- **Core Modules**: Home, Project Management, Financial Management, Document Management, Learning Module, Community Map, Notification System.
- **Community Map**: Global interactive map showing organization projects with clustering.
- **Learning Module ("Capacitaciones")**: Course management, video integration, progress tracking, payment integration.
- **Admin Management**: Reorganized admin section with analytics dashboard, date range filtering, global announcements, and real-time active user status.
- **Real-Time Support System**: Bidirectional support conversations with read tracking and notifications.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways, centralized checkout.
- **Access Control**: `PlanRestricted` component system with admin bypass; comprehensive access control for organization membership.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with function-calling tools.
- **User Presence & Analytics System**: Dual-layer tracking for real-time presence and historical usage.
- **Project Data Management**: Organized project info into tabs (Basic Data, Location, Client) with map integration and auto-save.
- **Mobile Action Bar**: Functional mobile action bars for Project Data and Project Management.
- **Project Client Management**: Tab-based interface for managing project clients.
- **Client Roles Management**: Custom client roles with full CRUD operations.
- **Subscription System**: Complete organization subscription management (FREE, PRO, TEAMS, ENTERPRISE plans) with multi-currency.
- **Media Uploads**: Standardized `UploadMediaField.tsx` for media uploads with progress bars and lightbox.
- **Sitelog Statistics & Filters**: Complete filtering system for construction site logs with Zustand state, statistics dashboard with 4 metric cards, 14-day timeline visualization, and client-side filtering.
- **Media Lightbox System**: Unified lightbox for viewing images and videos in sitelog entries, supporting both media types with gallery navigation.

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