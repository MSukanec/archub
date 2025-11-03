# Archub - Construction Management Platform

## Overview
Archub is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Archub aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, and reusable UI components, leveraging `shadcn/ui` and Tailwind CSS.
- **Modals**: Responsive Dialog component (right-side panel on desktop, fullscreen on mobile).
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub. Mobile menu mirrors desktop sidebar.
- **Button Design**: Default button variant uses a yellow to green gradient matching logo colors.
- **Badge Design**: Default Badge variant uses `bg-accent` and `text-accent-foreground` colors. **CRITICAL**: When user requests `--accent` color, ALWAYS use Tailwind classes `bg-accent` and `text-accent-foreground`, NEVER use `bg-[hsl(var(--accent))]` syntax.
- **Onboarding Flow**: Streamlined onboarding sets users to 'professional' mode and navigates directly to /home.
- **Component Standardization**: Standardized `StatCard` and custom `LoadingSpinner` components.
- **Checkout UX**: Replaced billing info Accordion with Switch control for improved user experience.
- **Home Page UX Flow**: Minimalist AI copilot interface with session-based conversation state. The top area is "where the AI speaks" and shows either greeting OR last response (never both). Fresh load/navigation: Saludo (large text) → Input → Sugerencias. During active session: Última respuesta IA (smaller text) → Input → Toggle historial → (Sugerencias hidden). Returning from another page resets to greeting. "Ver historial completo" toggle reveals full message history (newest first) below input. Uses `hasActiveConversation` local state flag to distinguish active session messages from loaded history.
- **AI Disclaimer**: Added user-friendly disclaimer "Archub puede cometer errores. Comprueba la información importante" to Home page for AI response transparency.
- **PageLayout Header Typography**: Page descriptions use `text-xs` sizing (smaller than tabs) to maintain clear visual hierarchy and prevent confusion with tab navigation.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules), deployed as Vercel serverless functions.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Database Views**: Extensive use of optimized database views (e.g., `course_progress_view`) for efficient data fetching.
- **API Base URL Helper**: `src/utils/apiBase.ts` for environment-aware API endpoint resolution.

### Feature Specifications
- **Core Modules**: Home page (AI-powered with personalized greetings and suggestions), Project Management (Gantt, Kanban), Financial Management (multi-currency, budgets), Document Management (versioning, file explorer), Learning Module, and Notification System.
- **Learning Module ("Capacitaciones")**: Course management, Vimeo integration, lesson progress tracking, advanced note-taking, course dashboard, course pricing with server-side validation, Mercado Pago integration, Discord integration, and deep-link navigation. Includes lesson favorites system.
- **Admin Management**: Dedicated sections for Admin Course Management (CRUD, analytics, enrollment) and Admin Payment Management with mobile UI improvements, including "Transfers Tab" and "History Tab" with KPIs.
- **Coupon System**: Discount coupon system for courses with database-driven validation.
- **Payment Architecture**: Unified `payments` table for all payment types, `payment_events` for webhook auditing, and `bank_transfer_payments` for specific bank transfer details. Supports dual payment providers (Mercado Pago for ARS, PayPal for USD) and bank transfer method with admin approval.
- **Access Control**: `PlanRestricted` component system with admin bypass.
- **Cost System**: Three-tier cost system (Archub Cost, Organization Cost, Independent Cost) for budget items.
- **User Activity Tracking**: User presence heartbeat functionality for real-time activity status in admin panels.
- **AI Integration**: GPT-4o-powered intelligent assistant with comprehensive financial analysis capabilities. Features include dynamic personalized greetings, actionable suggestions based on user context (projects, courses, budgets), and conversational chat with persistent history (latest 50 messages). Usage limits by plan: free users (3 prompts/day), pro/teams users (unlimited).
  - **System Prompts** (`src/ai/systemPrompt.ts`): Centralized AI directives, restrictions, and context definitions. Exports `getGreetingSystemPrompt()` for home greetings and `getChatSystemPrompt()` for conversational chat. Includes security restrictions (no system info disclosure), cost optimization guidelines, and comprehensive capability descriptions.
  - **Greeting Cache System** (`ia_user_greetings` table): Greetings cached by period (morning 5-13h, afternoon 13-19h, evening 19-5h) to reduce GPT calls from hundreds to max 3/day. When cached greeting exists, system skips GPT call and usage limit increment while generating dynamic suggestions from current context.
  - Advanced **AI Financial Analysis System** with 7 specialized function-calling tools:
    - **getTotalPaymentsByContactAndProject**: Calculates total payments to a specific contact in a project across all roles (partner, subcontractor, personnel, client, member)
    - **getOrganizationBalance**: Computes overall organization balance (income - expenses) with optional currency filtering and multi-currency conversion support
    - **getProjectFinancialSummary**: Provides complete project financial overview including balance, income, expenses, and optional breakdown by top 3 spending categories
    - **getRoleSpending**: Analyzes spending by role (subcontractors, personnel, partners) with filters for projects, date ranges, and currencies
    - **getContactMovements**: Retrieves ALL movements (income and expenses) for a contact with net balance calculation, supporting project/date/currency filters. **Now includes detailed breakdown** of individual movements (up to 15) with date, amount, description, and wallet (e.g., "Efectivo", "Banco Galicia") to prevent GPT hallucination when users request payment details. Enhanced function description ensures GPT calls this function when users ask for "detalle", "desglose", "listado", or "qué pagos".
    - **getDateRangeMovements**: Advanced query for movements within date ranges with multiple filters (projects, categories, wallets, types, roles) and grouping capabilities
    - **getCashflowTrend**: Temporal cashflow analysis with daily/weekly/monthly intervals, showing income, expenses, net flow, accumulated balance, and trend identification (improving/worsening/stable)
  - **Shared Utilities Module** (`src/ai/utils/`): Natural language date parser (supports "hoy", "este mes", "último trimestre"), currency converter using exchange rates, and consistent response formatters for Spanish output
  - **Query Optimization System** (`src/ai/tools/finances/helpers/movementQueryBuilder.ts`): All 7 AI finance functions now use optimized queries that select only required fields from `movements_view`, allowing PostgreSQL to automatically optimize JOIN execution. Functions reduced from 10 universal LEFT JOINs to function-specific JOINs: getTotalPayments (7 joins), getContactMovements (9 joins with description and wallet), getRoleSpending (3-4 joins), getOrganizationBalance (2 joins), getProjectFinancialSummary (3 joins), getCashflowTrend (2-3 joins), getDateRangeMovements (10 joins - most complete). Uses MovementRow interface for type safety with dynamic field selection.
  - **Anti-Hallucination System**: `getContactMovements` ALWAYS returns individual movement details (date, amount, description) for the latest 15 movements, preventing GPT from fabricating payment breakdowns in all scenarios. For contacts with >15 movements, shows the 15 most recent with a note indicating how many additional historical movements exist.
  - All functions enforce single-currency validation before aggregation, handle special characters in names safely via JavaScript filtering, use optimized `movements_view` queries with specific field selection, and provide descriptive error messages for edge cases (multiple currencies, missing data, invalid ranges)
  - **CRITICAL**: The `movements_view` database view MUST include the `subcontract_contact` field (subcontractor's contact name, distinct from subcontract title). Update instructions available in `INSTRUCCIONES_SQL_VISTA.md`

### System Design Choices
- **Backend Modular Architecture**: Monolithic `server/routes.ts` modularized into domain-specific route modules using a `RouteDeps` pattern for shared dependencies and consistent authentication.
- **Frontend Performance Optimizations**: Implemented code-splitting and lazy loading for Admin, Learning, and Media pages.
- **Performance Optimizations (Gacela Mode)**: Focused on sub-second page loads using database views, smart caching, pre-computed calculations, and optimized backend endpoints to replace slow client-side queries and direct Supabase view calls.
- **Lesson Viewer Performance**: Refactored lesson notes and markers with backend API endpoints and React Query for sub-second load times and caching.
- **Admin Enrollments Performance**: Optimized `/api/admin/enrollments` endpoint from 150+ cascading queries to 4 bulk queries with in-memory data combination.
- **Personnel Module Organization**: Reorganized from monolithic `ConstructionPersonnel.tsx` to modular structure in `src/pages/professional/personnel/` with separated tab components (Personnel.tsx, PersonnelListTab.tsx, PersonnelAttendanceTab.tsx) following established tab separation pattern for improved code maintainability.
- **Personnel Assignment Modal Optimization**: Enhanced `PersonnelFormModal.tsx` with real-time search filtering, optimized loading (filters out already assigned personnel), proper avatar display using `avatar_attachment_id` + `contact_attachments`, and corrected name display logic (uses `full_name` when `first_name`/`last_name` unavailable, never shows email as primary name).
- **Database Table Updates**: Renamed `attendees` table to `personnel_attendees` across all codebase references for consistency with personnel management architecture.
- **Personnel List Alphabetical Sorting**: Guaranteed alphabetical order through query-level sorting (computed `displayName` field with `localeCompare`) + all Table columns marked `sortable: false` to prevent client-side re-ordering. Eliminates Table's internal sort state to preserve Supabase-provided order.

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