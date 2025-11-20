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
- **Module Architecture**: Feature-Sliced Design adopted for modules like CLIENTS, COURSE-LANDING, FINANCES, CONTACTS, ORGANIZATION, and LEARNING, ensuring strict separation of concerns.
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities like contacts and contact types.
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
- **Media Uploads**: Standardized component for media uploads with progress bars and lightbox.
- **Sitelog Statistics & Filters**: Complete filtering system for construction site logs with statistics dashboard and timeline visualization.
- **Media Lightbox System**: Unified lightbox for viewing images and videos in sitelog entries.

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