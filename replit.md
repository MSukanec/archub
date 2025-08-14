# Archub - Construction Management Platform

## Overview

Archub is a modern construction management platform designed to streamline operations in the construction industry. It provides comprehensive tools for project tracking, team management, and budget monitoring, aiming to enhance efficiency and collaboration in construction projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS (with CSS variables)
- **State Management**: Zustand
- **Routing**: Wouter
- **Data Fetching**: TanStack Query (React Query)

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Session Management**: connect-pg-simple

### Authentication
- **Provider**: Supabase Auth (Email/password, Google OAuth)
- **Session Handling**: Supabase sessions
- **User Preferences**: Organization-specific `user_organization_preferences` table.

### Key Architectural Decisions
- **Shared Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Design System**: "new-york" style variant with neutral color palette and dark mode support. Emphasis on reusable UI components and centralized modal management.
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations. Extensive use of cache invalidation for real-time updates.
- **Project Management Features**: Includes a custom-built React-based Gantt chart with optimistic updates, a full Kanban board system with drag & drop, and a system for generating parametric tasks.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets, with multi-currency support. Budget system migrated to backend API endpoints for improved authentication and error handling.
- **Document Management**: Hierarchical document organization with versioning and file upload capabilities. Redesigned for file explorer-style navigation, and a modal-based preview system. Desktop features three-panel Bluebeam Revu-style layout with fixed proportions (2/3 viewer, 1/3 navigation/history). PDF viewer now uses fit-to-width scaling with overflow scroll to prevent content clipping during zoom operations. Main documentation interface is located at `/project/documentation` using `ProjectDocumentation.tsx` component, with simplified two-tier folder-document architecture.
- **Activity Logging**: Centralized activity tracking system for user actions.
- **Admin Features**: Material prices management, and user/task parameter administration.
- **Onboarding Process**: Streamlined to a single step, focusing on essential user and organization data.
- **UI/UX Enhancements**: Redesigned projects page, improved header component with dynamic height and aesthetic refinements for a clean, professional appearance. Consistent UI architecture with modern header system.
- **Navigation Restructure**: Moved project management from organization to profile section - "Gestión de Proyectos" now located in profile sidebar above "Gestión de Organizaciones" (August 2025).

## External Dependencies

- **Supabase**: Authentication, Database (PostgreSQL), Storage.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Radix UI**: Headless component primitives for UI components.
- **TanStack Query**: Server state management (React Query).
- **Drizzle**: Type-safe ORM for PostgreSQL.
- **Vite**: Frontend build tool and development server.
- **tsx**: TypeScript execution for Node.js development.
- **esbuild**: Production bundling for Node.js backend.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **date-fns**: Date manipulation utilities.
- **React Flow**: For visual parameter dependency editor.
- **Recharts**: Charting library for data visualization.