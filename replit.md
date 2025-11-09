# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## Recent Changes
**November 9, 2025**
- **Project Data Organization**: Organized project information into logical tabs (Datos Básicos, Ubicación, Cliente)
- **Projects Table Schema**: Added `projects` table definition to Drizzle schema (`shared/schema.ts`) with complete field mappings including `code`, `color`, `use_custom_color`, and other project metadata
- **Project Basic Data Tab**: Implemented with unified hydration pattern using `isHydrated` flag that waits for both `projectInfoSuccess` and `projectDataSuccess` before enabling auto-save, preventing unwanted saves on initial page load. Added `code` field with auto-formatting validation (uppercase, A-Z0-9-_, max 30 chars, optional)
- **Project Location Tab - Google Maps Integration**: Complete implementation with enriched location data management
  - Custom Google Maps components using CDN script loading (no npm packages): `useGoogleMapsScript`, `GooglePlacesAutocomplete`, `GoogleMap` with interactive marker
  - Google Places Autocomplete with auto-population of all location fields (address, city, state, country, zip code, coordinates, place_id, timezone)
  - Interactive map display showing project location with marker (only if coordinates exist)
  - Extended `project_data` table schema with location fields: `address_full`, `place_id`, `lat`, `lng`, `timezone`, `location_type` (enum: urban/rural/industrial/other), `accessibility_notes`
  - Unified hydration pattern with `isHydrated` reset on project change to prevent premature auto-save when switching projects
  - Conditional auto-save payload: only sends `location_type` if it's a valid enum value to prevent database constraint violations
  - UX indicators: coordinates status badge, API key configuration warning, loading states
  - Requires `VITE_GOOGLE_MAPS_API_KEY` environment variable (Google Cloud Console with Maps JavaScript API, Places API, and Geocoding API enabled)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing, antialiased rendering, and consistent font weights.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients. All UI components automatically "breathe" the project color.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile) with a standardized development pattern using `FormModalLayout`, React Hook Form with Zod validation, and `useMutation` from React Query. Delete confirmation modal uses Vercel-style "type to confirm" pattern with three sections: warning message, item details card showing contextual data, and text input requiring exact name match.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. UserQuickAccess Popover is context-aware, hiding irrelevant selectors on specific pages.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.
- **Auto-Save System**: Centralized debounced auto-save hook located in `src/components/save/` with intelligent initial-load detection. Uses TanStack Query `isSuccess` flags to prevent false saves during data hydration while supporting projects without existing data.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views for efficient data fetching.

### Feature Specifications
- **Core Modules**: Home page (AI-powered), Project Management, Financial Management, Document Management, Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, progress tracking, note-taking, and Mercado Pago integration. Includes improved UX for course navigation and mobile-specific floating lesson navigation.
- **Admin Management**: Reorganized admin section with comprehensive analytics dashboard (`/admin/dashboard`) showing 5 KPI sections: real-time active users, engagement by view with horizontal bar chart, top active users table with current/last visited page below username, drop-off analysis, and hourly activity line chart. Includes date range filtering (Today/7days/30days) and dedicated pages for administration and support. Global announcement system with audience targeting and dismissal tracking. Top Active Users table shows live status (📍 online / ⏸️ offline) with fallback to last visited page from history.
- **Real-Time Support System**: Bidirectional support conversation system with automatic read tracking (`read_by_admin` and `read_by_user` columns), notification badges on sidebar for unread messages. **🔥 Powered by Supabase Realtime** for instant message delivery with zero polling - PostgreSQL database changes trigger immediate UI updates via WebSocket subscriptions. RightSidebar (always mounted) maintains realtime subscriptions and invalidates all support queries ensuring messages update even when panels are closed. Support tab prioritized first in admin section. Includes RLS policies for secure message updates and optimized queries with React Query.
- **Coupon System**: Discount coupon system for courses, with a workaround for Mercado Pago limitations when coupons are applied.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago, PayPal, and bank transfers with an automatic 5% discount for bank transfers.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive analysis capabilities using 13 specialized function-calling tools (8 finance tools, 2 project tools, 3 organization tools), dynamic greetings, and conversational chat with persistent history. Organization tools enable queries about company info, member lists with roles, and real-time activity tracking. Includes a greeting cache system and anti-hallucination measures. FloatingAIChat visibility is route-based and restricted by plan.
- **User Presence & Analytics System**: Dual-layer tracking for real-time user presence (`user_presence` table) and historical usage analytics (`user_view_history` table) for business intelligence, including time spent per view.
- **Organization Membership Security System**: Comprehensive access control enforcement when users are deactivated (`is_active=false`). Backend endpoints filter by `is_active=true`, Supabase RPC `get_user()` excludes inactive memberships in three locations, and `OrganizationRemovedModal` provides elegant UX: detects invalid organization access, shows non-dismissible modal with two flows: (1) multi-org users see organization selector with avatars and can switch organizations, (2) zero-org users see forced logout modal with clear messaging. Ensures complete security when admins remove members.

### System Design Choices
- **Backend Modular Architecture**: Modularized domain-specific route modules.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **Personnel Module Organization**: Reorganized into modular components.
- **Personnel Assignment Modal Optimization**: Enhanced with real-time search filtering and optimized loading.

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