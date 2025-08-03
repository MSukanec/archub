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
- **User Preferences**: Migrated from global `user_preferences.last_project_id` to organization-specific `user_organization_preferences` table for better scalability

### Key Architectural Decisions
- **Shared Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Design System**: "new-york" style variant with neutral color palette and dark mode support.
- **Modals**: Centralized modal management (`ModalFactory`) for consistent UI/UX.
- **Component Reusability**: Emphasis on reusable UI components (e.g., `ActionBarDesktop`, `CustomTable`, `FormModalLayout`).
- **Data Flow**: React Query for server state management, Express.js for REST APIs, Drizzle ORM for database operations.
- **Real-time Updates**: Extensive use of cache invalidation for immediate UI synchronization (e.g., after task/parameter/movement modifications).
- **Gantt Chart**: Custom-built React-based Gantt chart with SVG dependency arrows and optimistic updates for smooth UX.
- **Kanban**: Full Kanban board system with drag & drop, comments, and attachments.
- **Parametric Tasks**: System for generating tasks based on predefined parameters and templates.
- **Financial Management**: Comprehensive system for tracking movements, conversions, transfers, and budgets, with multi-currency support.
- **Document Management**: Hierarchical document organization with versioning and file upload capabilities.
- **Activity Logging**: Centralized activity tracking system for user actions across the platform.
- **User Preferences Migration**: Replaced global `user_preferences.last_project_id` with organization-specific `user_organization_preferences` table. Each user now has a separate last project per organization, improving data accuracy and multi-organization support. Backend functions `archub_get_user()` and `archub_new_user()` updated accordingly.

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