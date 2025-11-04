# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Dynamic Color System**: Comprehensive project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors, hover states, foreground colors, and background gradients. Implemented with `useProjectAccentColor` hook and CSS variables.
  - **Fase 3.1 - Visual Breathing System** (Nov 2024): All UI components automatically "breathe" the project color. Badge, Button, Input, Progress primitives use `var(--accent)` with smooth 700ms transitions. New utility classes: `card-accent-border`, `card-accent-bg`, `icon-accent` for Cards and icons. Inspired by mood slider UX where everything changes color based on selection.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile).
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub.
- **Component Standardization**: Standardized `StatCard` and custom `LoadingSpinner` components that use dynamic accent colors.
- **Home Page UX Flow**: Minimalist AI copilot interface with session-based conversation state, dynamic greetings, and a toggle for full history.
- **AI Disclaimer**: User-friendly disclaimer "Archub puede cometer errores. Comprueba la información importante" on the Home page.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views (e.g., `course_progress_view`) for efficient data fetching.

### Feature Specifications
- **Core Modules**: Home page (AI-powered), Project Management, Financial Management, Document Management, Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, progress tracking, note-taking, and Mercado Pago integration.
- **Admin Management**: Dedicated sections for Course Management and Payment Management.
- **Coupon System**: Discount coupon system for courses.
- **Payment Architecture**: Unified `payments` table supporting Mercado Pago (ARS), PayPal (USD), and bank transfers with admin approval.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive financial analysis capabilities, dynamic greetings, and conversational chat with persistent history.
  - **System Prompts**: Centralized AI directives for greetings and chat.
  - **Greeting Cache System**: `ia_user_greetings` table caches greetings to reduce GPT calls, independent of user prompt quota.
  - **AI Financial Analysis System**: 7 specialized function-calling tools for financial queries (e.g., `getTotalPaymentsByContactAndProject`, `getOrganizationBalance`, `getProjectFinancialSummary`). Includes detailed breakdown for `getContactMovements` to prevent GPT hallucination.
  - **Shared Utilities Module**: Natural language date parser, currency converter, and consistent Spanish response formatters.
  - **Query Optimization System**: Optimized queries for all 7 AI finance functions, selecting only required fields from `movements_view`.
  - **Anti-Hallucination System**: `getContactMovements` always returns individual movement details for the latest 15 movements.

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules.
- **Frontend Performance Optimizations**: Code-splitting and lazy loading for Admin, Learning, and Media pages.
- **Performance Optimizations (Gacela Mode)**: Sub-second page loads using database views, smart caching, and optimized backend endpoints.
- **Personnel Module Organization**: Reorganized into modular components for improved maintainability.
- **Personnel Assignment Modal Optimization**: Enhanced with real-time search filtering and optimized loading.
- **Database Table Updates**: Renamed `attendees` to `personnel_attendees` for consistency.
- **Personnel List Alphabetical Sorting**: Guaranteed alphabetical order through query-level sorting.

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