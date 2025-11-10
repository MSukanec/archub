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
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.
- **Auto-Save System**: Centralized debounced auto-save hook with intelligent initial-load detection, using TanStack Query `isSuccess` flags to prevent false saves during data hydration.

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
- **Google Maps Platform**: For location services and interactive maps.