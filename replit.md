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
- **Backend**: Node.js, Express.js, TypeScript (ES modules), 100% Express architecture with modular design.
- **Database**: PostgreSQL with Drizzle ORM, utilizing optimized database views.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design adopted for modules like PROJECTS (with nested project-types and project-modalities sub-features), SUBCONTRACTS, PERSONNEL, CLIENTS, COURSE-LANDING, FINANCES, CONTACTS, ORGANIZATION, LEARNING, MEDIA, and SITELOG, ensuring strict separation of concerns.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities like organizations, contacts, contact types, projects, project types, and project modalities. All SELECT queries filter `is_deleted = false` to prevent deleted entities from appearing in the system.
- **Projects Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 9 services, 9 hooks, 3 components, and ProjectModal. Services use Express API for mutations (CREATE/UPDATE/DELETE) with authentication and validation, and Supabase direct for read operations. Supports project creation, updating, soft deletion, statistics, activity tracking, and image uploads. All consuming files use barrel exports from @/features/projects.
- **Subcontracts Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 18 services, 15 hooks, 4 components, and 4 modals. Services use Express API for mutations (CREATE/UPDATE/DELETE/AWARD) with authentication and validation, and Supabase/API endpoints for read operations. Backend controllers created for subcontracts CRUD following exact pattern of projects. Supports subcontract creation, updating, deletion, bidding system, task management, award process, movement-subcontract relationships, and financial analysis. All consuming files use barrel exports from @/features/subcontracts.
- **Personnel Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 25+ services, 25+ hooks, 4 components, and 4 modals. Services use Express API for mutations (CREATE/UPDATE/DELETE) with authentication and validation, and Supabase/API endpoints for read operations. Backend controllers created for personnel CRUD following exact pattern of projects and subcontracts. Supports personnel creation, updating, deletion, labor types management, currency handling, personnel details, pay rates management, attendance tracking, and contact attachments integration. All modals (Add, Data, Attendance, Rates) are fully presentational components consuming only feature hooks with no inline queries/mutations. All consuming files use barrel exports from @/features/personnel. Note: Attendance services currently use Supabase directly (backend endpoints pending) but follow FSD pattern with proper services/hooks separation.
- **Materials Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 36 files including 10 services, 15 hooks, 2 modals, and 2 sub-features (material-categories, material-prices). Main feature exports unified materials CRUD, construction materials aggregator with computed avg_price data, and comprehensive type system. Sub-features handle hierarchical category management with parent-child relationships and price history tracking. All services use Supabase direct queries, hooks wrap services with React Query, toast notifications, and cache invalidation. MaterialModal and MaterialCategoryModal are 100% presentational components using feature hooks with CascadingSelect for category selection. All consuming files use barrel exports from @/features/materials. Type definitions centralized in feature/types prevent duplication across sub-features. Legacy hooks (use-materials.ts, use-material-categories.ts, use-material-prices.ts) removed.
- **Financial Management**: Unified financial movements audit system with multi-currency conversion, KPI calculation, and detailed transaction views.
- **Contacts Management**: Comprehensive CRUD operations for contacts and contact types, including attachment management and avatar uploads.
- **Organization Dashboard**: Provides an overview of organization members, stats, activity logs, and wallets.
- **Core Modules**: Encompass Home, Project Management, Financial Management, Document Management, Learning Module, Community Map, and Notification System.
- **Learning Module (REFACTORED)**: Complete Feature-Sliced Design implementation with 26 services, 27 hooks, 7 components. Supports course management, video integration (Vimeo), progress tracking with favorites, notes/markers system, course enrollment, pricing, and payment integration. All pages are "dumb" orchestrators using only feature hooks, following strict ARCHITECTURE.MD patterns.
- **Admin Management**: Reorganized section with analytics, announcements, and real-time user status.
- **Real-Time Support**: Bidirectional support conversations with read tracking and notifications.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout.
- **Access Control**: `PlanRestricted` component system with comprehensive access control for organization membership and subscription plans (FREE, PRO, TEAMS, ENTERPRISE).
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **AI Assistant (REFACTORED)**: Complete Feature-Sliced Design implementation with clean frontend/backend separation. **Frontend** (`src/features/ai/`): 2 API services (getAIHistory, sendAIChatMessage), 2 React Query hooks (useAIHistory, useAIChat), 2 presentational components (AIPanel, MessageContent), types and constants. **Backend** (`server/lib/ai/`): orchestrator (cache, pipeline, entity resolver, intent classifier), chat handlers (chatHandler, homeGreetingHandler, historyHandler), specialized tools for finance queries (cashflow trends, balances, project summaries), organization data (members, activity, info), and project details, plus utilities (currency converter, date parser, response formatter, text normalizer). Powered by GPT-4o with context-aware system prompts. Frontend uses barrel exports from @/features/ai (hooks/components only), backend logic stays in server with proper Node.js module support.
- **User Presence & Analytics**: Dual-layer tracking for real-time presence and historical usage.
- **Project Data Management**: Organized project information with map integration and auto-save.
- **Media Uploads**: Unified `UploadImageAndShowField` component for project image uploads with dual-mode support (normal upload mode for existing projects, preview mode for new projects), 2MB size limit, drag-and-drop, and inline editing capabilities.
- **Sitelog Management (UPDATED)**: Feature-Sliced Design implementation for construction site logs. **Site Log Types**: Simplified schema with only `name` and `description` fields (removed code, icon, color). Implements soft delete pattern for site_log_types with automatic `created_by` tracking using organization_member.id pattern. System types (organization_id = null) are immutable and cannot be deleted by users. SiteLogTypeModal is a presentational component with simplified form (2 fields only). SitelogSettings tab follows ProjectSettingsTab pattern with inline "Agregar Tipo" button, compact card layout, and unified DeleteConfirmationModal for consistent delete UX. **Site Logs**: Complete filtering system for construction site logs with statistics dashboard, timeline visualization, and unified media lightbox for viewing images and videos in sitelog entries. Tab "Multimedia" is disabled when no entries exist (`isDisabled` prop in tabs). All services and components updated to use `site_log_type.name` instead of deprecated `code` and `icon` fields. All consuming files use barrel exports from @/features/sitelog.
- **Project Types Management (UPDATED)**: Feature-Sliced Design implementation nested within PROJECTS feature at `src/features/projects/project-types/`. System includes global types (organization_id = null) and organization-specific custom types. Accessible via ProjectSettingsTab with support for creating, editing, and soft-deleting custom project types. Services validate organizationId and prevent operations on system types. **CRITICAL**: ProjectTypeModal correctly implements `created_by` pattern using `useOrganizationMembers` hook to obtain organization_member.id (NOT user.id). The `createdBy` field is REQUIRED in createProjectType service.
- **Project Modalities Management (UPDATED)**: Feature-Sliced Design implementation nested within PROJECTS feature at `src/features/projects/project-modalities/`. System includes global modalities (organization_id = null) and organization-specific custom modalities. Accessible via ProjectSettingsTab with services (getProjectModalities, createProjectModality, updateProjectModality, deleteProjectModality) following same pattern as project types with soft delete support. **CRITICAL**: ProjectModalityModal correctly implements `created_by` pattern using `useOrganizationMembers` hook to obtain organization_member.id (NOT user.id). The `createdBy` field is REQUIRED in createProjectModality service.
- **Project Selector Filtering (CRITICAL)**: Header project selector (`ProjectSelectorButton` via `useProjectsLite` hook) exclusively displays projects with status='active' (En Proceso). Projects marked as 'completed', 'inactive', or 'paused' are hidden from the selector to prevent overwhelming users with historical projects. This filtering is essential for organizations with large project portfolios. Filter implemented at: `src/hooks/use-projects-lite.ts` with `.eq('status', 'active')`.
- **Project Activity Tracking**: `last_active_at` timestamp field tracks when a project was last selected. Updated automatically when user activates a project in ProjectListTab or ProjectActivesTab. ProjectActivesTab sorts projects by last activity (active project first, then by most recent activity). ProjectListTab displays "Última Actividad" column showing last activation timestamp or "Nunca" for never-activated projects.

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