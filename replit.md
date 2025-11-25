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
- **Modal Architecture v2.0 (Nov 25, 2024)**: Enterprise SaaS-level modal system inspired by Linear, Vercel, Notion, and Airtable. Features include: (1) Modal stacking with `pushModal`/`popModal`/`closeAll` for nested modals and confirmations, (2) Size variants (`sm`/`md`/`lg`/`xl`/`full`) for responsive sizing, (3) Portal rendering via `createPortal` for proper z-index, (4) Linear-style animations (scale+fade), (5) Registry pattern replacing switch/case with type-safe dictionary, (6) DrawerBase component for mobile slide-up sheets with drag-to-dismiss. Organized in `src/components/modal/` with `foundation/` (ModalLayout, ModalHeader, ModalFooter, ModalBody, DrawerBase), `state/` (globalModalStore with stack, panelStore), `factory/` (ModalFactory, registry, registerModals, types), and `utils/`. 70+ modals registered with category metadata. Legacy aliases maintained for backwards compatibility.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system.
- **Layout Architecture**: Migrated to experience-based layouts (`src/layouts/`) including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
- **Content Theming System**: Unified CSS theming layer with dynamic background switching via `useContentBackground` hook.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design adopted for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, LEARNING, MEDIA, SITELOG, etc.), ensuring strict separation of concerns.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities with all SELECT queries filtering `is_deleted = false`.
- **Core Feature Management**: Comprehensive CRUD operations for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities using Feature-Sliced Design.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration with a split data architecture (`COURSES`, `COURSE_DETAILS`) and soft delete.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses using specialized tools.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout.
- **Access Control**: `PlanRestricted` component system provides comprehensive access control for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified `UploadImageAndShowField` component for project image uploads and `UploadMultiFileField` for general attachments. Uses a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture.
- **Image Compression System**: Client-side automatic image compression using `browser-image-compression` with 6 predefined presets.
- **3-Bucket Storage Architecture**: Organized file storage across three Supabase buckets (public-assets, private-assets, social-assets) with automatic routing and metadata persistence for on-demand signed URL generation.
- **Public Media Access**: `is_public` flag in `media_links` allows public accessibility for course images while protecting organizational media.
- **Project Selector Filtering**: Header project selector displays only `active` projects.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically when projects are selected or newly created via a fire-and-forget backend API endpoint.
- **Hooks Consolidation**: Systematic consolidation of React hooks according to Feature-Sliced Design principles.
- **HeroLayout Pattern**: Specialized `HeroLayout` component for pages with full-width hero sections, used in Learning Dashboard and Project Dashboard.
- **Sitelog Attachments Migration**: Migrated sitelog photo/video attachments to unified `media_files` + `media_links` system with signed URLs.
- **General Costs Payment Storage (Nov 25, 2024)**: Fully integrated general costs payment attachments with unified 3-bucket storage, signed URLs, and proper referential integrity. Fixed critical Table component event handling issue where DropdownMenuItem clicks were propagating to `onRowClick`, causing wrong modals to open. Added `e.stopPropagation()` in 3 locations (grouped data desktop, desktop fallback, mobile card view). Implemented proper media loading with `getGeneralCostPaymentFiles` service for signed URL generation and cache management.

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