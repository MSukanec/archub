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
- **Project Selector**: Integrated in header on project pages, positioned right of member avatars. Uses `ProjectSelectorButton` component with popover dropdown showing project list with avatars and status. Accessible on both desktop (click) and mobile (touch). Enable in PageLayout with `showProjectSelector={true}` prop.
- **Support Modal System**: In the experimental layout, support chat functionality is implemented as a modal dialog instead of an expandable sidebar panel. The `SupportModal` component provides the same features (real-time messaging, unread badges, Supabase Realtime integration) in a cleaner, more focused modal format. Background Supabase subscription in LeftSidebar keeps unread badges updated even when modal is closed, supporting both admin and user roles.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Experimental layout features a two-level sidebar system: left sidebar (50px) for context navigation buttons (Home, Organization, Project, Capacitaciones, Comunidad, Administración) with user avatar at the bottom, and right sidebar (240px) for context-specific navigation on hover. User navigation level includes Mi Perfil, Página de Inicio, and Cerrar Sesión options.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.
- **Auto-Save System**: Centralized debounced auto-save hook with intelligent initial-load detection, using TanStack Query `isSuccess` flags to prevent false saves during data hydration.
- **Content Theming System**: Unified CSS theming layer with `--content-bg` for solid backgrounds and `--content-gradient-from/to` for gradient backgrounds. The `useContentBackground` hook automatically switches between solid backgrounds for general pages and gradient backgrounds for project pages (routes starting with `/project/`), providing theme-aware styling in both classic and experimental layouts.
- **Sidebar Button Component**: Reusable `SidebarIconButton` component (32x32px buttons with 20x20px icons, rounded-md) used across both experimental layout sidebars (left context sidebar and right user sidebar) with intelligent accent colorization system, badge support, and inline style injection to ensure consistent hover/active states across all icons including animated ones.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views for efficient data fetching.

### Feature Specifications
- **Core Modules**: Home page (AI-powered), Project Management, Financial Management, Document Management, Learning Module, Community Map, and Notification System.
- **Community Map**: Global interactive map powered by React Leaflet showing all organization projects with location data. Features organization logo-based markers, smart clustering, and simplified popups.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, progress tracking, note-taking, and Mercado Pago integration.
- **Admin Management**: Reorganized admin section with comprehensive analytics dashboard showing 5 KPI sections, date range filtering, global announcement system, and real-time active user status.
- **Real-Time Support System**: Bidirectional support conversation system with automatic read tracking and notification badges, powered by Supabase Realtime for instant message delivery via WebSocket subscriptions.
- **Coupon System**: Discount coupon system for courses.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago, PayPal, and bank transfers.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive analysis capabilities using 13 specialized function-calling tools (8 finance, 2 project, 3 organization), dynamic greetings, and conversational chat with persistent history.
- **User Presence & Analytics System**: Dual-layer tracking for real-time user presence and historical usage analytics.
- **Organization Membership Security System**: Comprehensive access control enforcement when users are deactivated, ensuring secure access and providing elegant UX for invalid organization access.
- **Project Data Management**: Organized project information into logical tabs (Basic Data, Location, Client) with Google Maps integration for enriched location data management and an auto-save system.
- **Mobile Action Bar**: Fully functional mobile action bars for Project Data and Project Management sections with dynamic filtering and shared state.
- **Project Client Management**: Tab-based interface using Table.tsx for managing project clients with add/edit/delete functionality via API endpoints `/api/projects/:projectId/clients`.
- **Subscription System**: Complete organization subscription management with FREE, PRO, TEAMS, and ENTERPRISE plans. Admin interface with two tabs: "Planes" for managing plan definitions (name, slug, features, billing_type, is_active) and "Precios" for managing multi-currency pricing (plan_prices table with monthly_amount, annual_amount, currency_code, provider). The legacy `price` field in the `plans` table is deprecated and should not be used; all pricing now managed through the `plan_prices` table which supports multiple currencies (ARS, USD, EUR) and payment providers (MercadoPago, PayPal).

### System Design Choices
- **Backend Modular Architecture**: Modularized domain-specific route modules.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **Personnel Module Organization**: Reorganized into modular components.
- **Personnel Assignment Modal Optimization**: Enhanced with real-time search filtering and optimized loading.
- **AI Code Architecture**: Dual-location AI code structure to support both development (Express) and production (Vercel serverless). The authoritative AI implementation lives in `api/_lib/ai/` for Vercel bundling. A mirror copy exists in `src/ai/` for Vite HMR compatibility during development. All AI-related changes must be made in `api/_lib/ai/`.

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