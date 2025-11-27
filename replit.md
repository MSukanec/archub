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
- **Layout Architecture**: Experience-based layouts (`src/layouts/`) including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming System**: Unified CSS theming layer with dynamic background switching via `useContentBackground` hook.

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
- **Core Feature Management**: Comprehensive CRUD operations for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout.
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component for image and multi-file uploads using a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture.
- **Image Compression System**: Client-side automatic image compression with predefined presets.
- **Date Utilities (CRITICAL)**: All date handling MUST use `src/lib/date-utils.ts` to avoid timezone issues:
  - `parseLocalDate(input)`: Convert database date strings to Date objects (prevents day shift)
  - `formatDateForDB(date)`: Convert Date objects to YYYY-MM-DD for database storage
  - `formatDate/formatDateShort/formatDateCompact`: Display dates to users
  - **NEVER use** `new Date("YYYY-MM-DD")` directly - it causes timezone shift issues!
- **3-Bucket Storage Architecture**: Organized file storage across three Supabase buckets (public-assets, private-assets, social-assets) with automatic routing and metadata persistence.
- **Public Media Access**: `is_public` flag in `media_links` for controlled public accessibility.
- **Project Selector Filtering**: Header project selector displays only `active` projects.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **HeroLayout Pattern**: Specialized `HeroLayout` component for pages with full-width hero sections.
- **Modal Naming Standard**: Modals follow `<Entity>Form.tsx` naming convention, stored in `forms/` folders, and support CREATE/EDIT/VIEW modes within a single component.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality, enabling zero-downtime deletion with data migration.
- **Universal Import System**: 5-step wizard (Preview → Mapping → Validation → Conflicts → Summary) with reusable hooks for parsing, auto-mapping, validation, and AI-powered suggestions. Includes AI-Powered Column Mapping using OpenAI gpt-4o-mini and organizational memory.
- **Client Unit Migration**: Architecture change to one client per project, with unit information now commitment-specific (`unit_name`, `unit_description` in `client_commitments`).
- **Lab Neural Network Renderer System**: Extensible node rendering architecture for neural network graphs, including `SphereNodeRenderer` and `AvatarNodeRenderer` with type-specific styling and image caching.

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
- **browser-image-compression**: Client-side image compression for optimized uploads.