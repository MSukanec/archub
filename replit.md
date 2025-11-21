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
- **Soft Delete**: Implemented for key entities like contacts, contact types, projects, project types, and project modalities.
- **Projects Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 9 services, 9 hooks, 3 components, and ProjectModal. Services use Express API for mutations (CREATE/UPDATE/DELETE) with authentication and validation, and Supabase direct for read operations. Supports project creation, updating, soft deletion, statistics, activity tracking, and image uploads. All consuming files use barrel exports from @/features/projects.
- **Subcontracts Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 18 services, 15 hooks, 4 components, and 4 modals. Services use Express API for mutations (CREATE/UPDATE/DELETE/AWARD) with authentication and validation, and Supabase/API endpoints for read operations. Backend controllers created for subcontracts CRUD following exact pattern of projects. Supports subcontract creation, updating, deletion, bidding system, task management, award process, movement-subcontract relationships, and financial analysis. All consuming files use barrel exports from @/features/subcontracts.
- **Personnel Management (REFACTORED)**: Complete Feature-Sliced Design implementation with 25+ services, 25+ hooks, 4 components, and 4 modals. Services use Express API for mutations (CREATE/UPDATE/DELETE) with authentication and validation, and Supabase/API endpoints for read operations. Backend controllers created for personnel CRUD following exact pattern of projects and subcontracts. Supports personnel creation, updating, deletion, labor types management, currency handling, personnel details, pay rates management, attendance tracking, and contact attachments integration. All modals (Add, Data, Attendance, Rates) are fully presentational components consuming only feature hooks with no inline queries/mutations. All consuming files use barrel exports from @/features/personnel. Note: Attendance services currently use Supabase directly (backend endpoints pending) but follow FSD pattern with proper services/hooks separation.
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
- **AI Integration**: GPT-4o-powered intelligent assistant with function-calling tools.
- **User Presence & Analytics**: Dual-layer tracking for real-time presence and historical usage.
- **Project Data Management**: Organized project information with map integration and auto-save.
- **Media Uploads**: Unified `UploadImageAndShowField` component for project image uploads with dual-mode support (normal upload mode for existing projects, preview mode for new projects), 2MB size limit, drag-and-drop, and inline editing capabilities.
- **Sitelog Statistics & Filters**: Complete filtering system for construction site logs with statistics dashboard and timeline visualization.
- **Media Lightbox System**: Unified lightbox for viewing images and videos in sitelog entries.
- **Project Types Management**: Feature-Sliced Design implementation nested within PROJECTS feature at `src/features/projects/project-types/`. System includes global types (organization_id = null) and organization-specific custom types. Accessible via ProjectSettingsTab with support for creating, editing, and soft-deleting custom project types with color, icon, and category support. Services validate organizationId and prevent operations on system types.
- **Project Modalities Management**: Feature-Sliced Design implementation nested within PROJECTS feature at `src/features/projects/project-modalities/`. System includes global modalities (organization_id = null) and organization-specific custom modalities. Accessible via ProjectSettingsTab with services (getProjectModalities, createProjectModality, updateProjectModality, deleteProjectModality) following same pattern as project types with soft delete support.

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