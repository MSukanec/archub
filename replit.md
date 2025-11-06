# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing, antialiased rendering, and consistent font weights.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and organic radial gradients. All UI components automatically "breathe" the project color.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile) with a standardized development pattern using `FormModalLayout`, React Hook Form with Zod validation, and `useMutation` from React Query.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. UserQuickAccess Popover is context-aware, hiding irrelevant selectors on specific pages.
- **Home Page UX Flow**: Minimalist AI welcome interface with dynamic greetings and quick action buttons.

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
- **Real-Time Support System**: Bidirectional support conversation system with automatic read tracking (`read_by_admin` and `read_by_user` columns), notification badges on sidebar for unread messages, auto-refresh every 2-3 seconds for real-time chat experience. Support tab prioritized first in admin section. Includes RLS policies for secure message updates and optimized queries with React Query.
- **Coupon System**: Discount coupon system for courses, with a workaround for Mercado Pago limitations when coupons are applied.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago, PayPal, and bank transfers with an automatic 5% discount for bank transfers.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive financial analysis capabilities using 7 specialized function-calling tools, dynamic greetings, and conversational chat with persistent history. Includes a greeting cache system and anti-hallucination measures. FloatingAIChat visibility is route-based and restricted by plan.
- **User Presence & Analytics System**: Dual-layer tracking for real-time user presence (`user_presence` table) and historical usage analytics (`user_view_history` table) for business intelligence, including time spent per view.

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