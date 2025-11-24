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
- **Modals**: Responsive Dialog component with standardized patterns using `FormModalLayout`, React Hook Form with Zod validation.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub, including an experimental two-level sidebar system.
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
- **Soft Delete**: Implemented for key entities (organizations, contacts, projects, etc.) with all SELECT queries filtering `is_deleted = false`.
- **Core Feature Management**: Comprehensive CRUD operations and related functionalities are implemented using Feature-Sliced Design for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities. This includes mutation services via Express API and read operations via Supabase/API, ensuring authentication, validation, and consistent design patterns.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration following a strict architectural pattern.
  - **Course Data Architecture**: Split between `COURSES` table (core data: title, price, visibility) and `COURSE_DETAILS` table (marketing data: instructor info, SEO, badges). Backend's `splitCourseData()` handles automatic data distribution.
  - **Course Soft Delete**: Implemented with `is_deleted` and `deleted_at` columns. All queries filter `is_deleted=false`, DELETE operations use UPDATE to set `is_deleted=true`.
  - **Course Media Management**: Course images (cover, instructor photo, OG image) managed exclusively via `MEDIA_LINKS` table. Legacy URL columns removed from schema.
  - **Course Mutations**: Admin course create/update operations route through `/api/admin/courses` REST endpoint (not direct Supabase) to ensure proper data splitting between tables.
- **AI Assistant**: Implemented with a clean frontend/backend separation. The frontend uses API services and React Query hooks for chat interaction, while the backend orchestrates context-aware GPT-4o powered responses using specialized tools for finance, organization, and project data.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout.
- **Access Control**: `PlanRestricted` component system provides comprehensive access control for organization membership and subscription plans (FREE, PRO, TEAMS, ENTERPRISE).
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified `UploadImageAndShowField` component for project image uploads with dual-mode support, size limits, drag-and-drop, and inline editing. Client payments now use a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture for attachments.
- **Image Compression System**: Client-side automatic image compression using `browser-image-compression` with 6 predefined presets (project-cover, sitelog-photo, course-cover, avatar, document, default). Reduces bandwidth by ~60-80%, speeds up uploads, and cuts storage costs. Implemented across all upload components with robust error handling and size validation. See `prompts/Upload.md` for full documentation.
- **3-Bucket Storage Architecture**: Organized file storage across three Supabase buckets (public-assets, private-assets, social-assets) with automatic routing by entity type. Metadata persistence (bucket + path) enables on-demand signed URL generation, preventing URL expiration issues. Centralized uploadFile() function handles compression, routing, and database transactions. All project images now use metadata-based storage with automatic URL refresh. See `prompts/Upload.md` for complete architecture documentation.
- **Public Media Access**: Course images (cover, instructor, OG) use `is_public` flag in `media_links` for public accessibility. Course media automatically marked as public, enabling display on unauthenticated landing pages while keeping organizational media protected.
- **Project Selector Filtering**: The header project selector (`ProjectSelectorButton`) exclusively displays projects with `status='active'` to enhance usability in large portfolios.
- **Project Activity Tracking**: `last_active_at` timestamp tracks when a project was last selected, influencing project sorting in active lists.
- **Hooks Consolidation (Nov 2024)**: Systematic consolidation of React hooks according to Feature-Sliced Design principles. Status: 43% consolidated (21 global hooks + 15 migrated to features), 57% documented for future migration. Eliminated 2 duplicate hooks, migrated hooks to existing features (contacts, projects, materials, personnel, general-costs). Remaining ~50 hooks documented for future feature creation (finances, tasks, design, construction, budgets, kanban, partners). All feature-specific hooks converted to re-exports from their respective features, maintaining backward compatibility. See `/tmp/resumen-consolidacion-hooks.md` for complete documentation.

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