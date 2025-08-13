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
- **Material Prices Management**: Complete admin system for managing organization-specific material prices with table organization_material_prices, filtering, sorting, and CRUD operations.
- **Task Management Fixes (2025-08-06)**: Fixed AdminGeneratedTasks page where editing created duplicates instead of updating existing tasks. Added delete button functionality with dangerous confirmation modal for non-system tasks. System tasks are clearly marked and cannot be deleted to maintain data integrity.
- **Project Deletion Optimization (2025-08-07)**: Completely rebuilt project deletion system with server-side endpoint and optimistic UI updates. Reduced deletion time from ~8 seconds to ~2 seconds by eliminating heavy RPC calls and using efficient auth token validation. Frontend now provides instant UI feedback while server handles actual deletion.
- **Onboarding Optimization (2025-08-07)**: Completely simplified onboarding process from 3 steps to just 1 step. Eliminated Step3Discovery.tsx and Step2FinancialSetup.tsx. Now consists of only: Step 1 (Basic User Data + Organization Name). Removed all unnecessary fields like country, birthdate, discovered_by, financial setup to minimize required information to absolute essentials: first name, last name, and organization name only. Fixed navigation flow from onboarding → select-mode → dashboard by implementing optimistic cache updates and allowing dashboard routes during onboarding completion to prevent redirects.
- **Projects Page Redesign (2025-08-07)**: Created new simplified ProjectItem.tsx component to replace ModernProjectCard.tsx with minimal design - removed hero image section, action buttons, and avatar circles. Changed layout from 3-column grid to single centered column for better focus. Added ProjectHeroCard above project list to highlight active project with hero banner design. Optimized toast dismissal speed to 500ms (2x faster) across entire application.
- **Contact Types System Enhancement (2025-08-07)**: Converted contact types from one-to-one to many-to-many relationship through contact_type_links intermediate table. Updated ContactFormModal to use ComboBoxMultiSelect for multiple type selection. Modified use-contacts hook to fetch related types via join queries. Enhanced user linking functionality to auto-populate contact fields (name, email) from linked user data and disable manual editing when user is linked, ensuring data consistency and reducing user input requirements.
- **Kanban Cache Optimization (2025-08-07)**: Completely eliminated network 400 errors in kanban operations by implementing precise cache invalidation with `exact: true` parameter. Optimized all kanban hooks (cards, lists, comments) to use exact cache key matching, preventing unnecessary background queries. Added direct boardId passing to hooks to avoid additional database lookups during cache invalidation. Results in cleaner console logs and improved performance for all kanban CRUD operations.
- **Movement Third Party Contributions System Optimization (2025-08-11)**: Completely removed the `movement_third_party_contributions` junction table and reverted to direct `contact_id` field in movements table for better simplicity and performance. Fixed critical issues in InstallmentFormModal where form validation was preventing submissions due to missing required fields. Set default values for `type_id` (Ingresos) and `category_id` (Aportes de Terceros) directly in form initialization. Resolved React key warnings by implementing proper `getItemId` functions for all Table components. InstallmentFormModal now works correctly for creating client contribution movements.
- **Budget System Authentication Fix (2025-08-11)**: Resolved critical authentication errors (JWT token issues) in ConstructionBudgets page by implementing automatic token refresh logic in use-current-user hook. Completely removed deprecated `last_budget_id` system and auto-activation mechanisms causing database errors. Eliminated all console logs from budget-related hooks for cleaner debugging. Fixed token validation issues that were causing 401/404 errors when accessing budget data from Supabase.
- **Budget System Migration to Backend API (2025-08-11)**: Successfully migrated entire budget system from direct Supabase calls to backend API endpoints. Created comprehensive budget CRUD endpoints (/api/budgets) in server/routes.ts. Updated use-budgets.ts and BudgetFormModal.tsx to use server endpoints instead of direct database access. This eliminates all JWT token validation errors and provides better error handling and authentication management. Backend endpoints are fully functional - budget creation, listing, updating, and deletion all working correctly.
- **Complete ActionBarDesktop Elimination (2025-08-11)**: Successfully eliminated ActionBarDesktop.tsx component entirely from the codebase. Migrated all remaining pages (ConstructionCostAnalysis, ConstructionAttendance, ProfileOrganizations, ProfileBasicData, ProfileSettings, DesignDashboard, AdminUsers, AdminTaskParameters) to modern Layout headerProps pattern. Fixed breadcrumb display issues by adding custom breadcrumb props showing "Section > Page Name" structure. All pages now use consistent UI architecture with proper navigation, eliminating legacy ActionBar patterns completely. This modernizes the entire application's header system and improves maintainability.
- **ActionBar Component Rename (2025-08-11)**: Renamed ActionBarDesktopRow.tsx to ActionBar.tsx for cleaner naming convention. Updated all component references (ActionBarDesktopRow → ActionBar) and import paths across OrganizationContacts, OrganizationProjects, OrganizationBoard, and ProjectGallery pages. This simplifies the component naming scheme and eliminates confusion about desktop-specific naming.
- **Header Component Rename (2025-08-11)**: Renamed HeaderDesktop.tsx to Header.tsx for simplified naming convention. Updated component export (HeaderDesktop → Header), interface name (HeaderDesktopProps → HeaderProps), and all import references across Layout.tsx and AdminTaskTemplates.tsx. Cleaned up console log references to reflect new component name. This continues the naming simplification initiative by removing desktop-specific suffixes.
- **Header pageTitle Enhancement (2025-08-11)**: Added pageTitle prop to Header component for displaying large page titles below breadcrumbs, inspired by modern UI patterns. Implemented dynamic header height calculation based on content (breadcrumb only: h-10, with pageTitle: h-30, with tabs: h-20, with both: h-40). Layout component automatically adjusts main content padding. Title displays in black for light theme and white for dark theme with uppercase styling. Fixed tab underline positioning to align properly with header border.
- **Documentation System Schema Migration (2025-08-13)**: Successfully migrated all documentation system tables (design_document_folders, design_document_groups, design_documents) to use organization_members.id instead of users.id for created_by fields. Updated all corresponding hooks (use-design-document-folders, use-design-document-groups, use-design-documents) to handle new FK relationships with proper joins to organization_members table. Fixed creation functions to query organization member ID before inserting records. Resolved all "foreign key relationship not found" errors in documentation system. Also updated design_gantt_tasks table with assigned_to (FK to contacts) and created_by (FK to organization_members) relationships, though no current hooks use this table.
- **Component Cleanup and Organization (2025-08-13)**: Moved ProjectContextInitializer.tsx from src/components/context/ to src/components/navigation/ for better organization. Removed obsolete UserPreferencesRecovery.tsx component which used deprecated user_preferences table instead of current user_organization_preferences system. Eliminated empty emergency and context folders. Updated import references in App.tsx to reflect new component locations.
- **Header Single-Row Redesign (2025-08-13)**: Completely restructured Header.tsx to match Gantt-style reference with unified single-row layout. Page title positioned on left (text-xl), tabs in center-left, action buttons + project selector on right. Eliminated three-row system (breadcrumb + pageTitle + tabs) in favor of unified h-14 header. Tab underline positioning adjusted to -bottom-[14px] for proper alignment. This creates a cleaner, more efficient header design similar to modern project management tools.
- **Header Aesthetic Refinement (2025-08-13)**: Enhanced header design for architecture industry elegance and minimalism. Changed page title from hardcoded black/white to theme-aware `text-foreground` with lighter font weight (`font-light`) and increased letter spacing (`tracking-wider`) for sophistication. Replaced harsh tab underlines with subtle rounded background highlights - active tabs now use `bg-accent/10` with soft shadow, hover states use `bg-accent/5`. Added padding and rounded corners to tabs for softer, more approachable design. This eliminates the rigid appearance in favor of a refined, professional aesthetic suitable for architecture applications.
- **Document Preview System Enhancement (2025-08-13)**: Completely redesigned document preview system from inline card to modal-based approach. Removed DocumentPreview.tsx component that showed persistent card above hierarchy. Created new DocumentPreviewModal.tsx with full-screen modal experience featuring zoom controls for images, secure PDF handling (opens in new tab to avoid browser security blocks), download/external link buttons, and status badges. Documents in DocumentHierarchy are now clickable with hover effects and open preview modal on click. Improved user experience with clear visual feedback and modal-based preview that doesn't interfere with document navigation.
- **Document Navigation System Redesign (2025-08-13)**: Replaced complex expandable DocumentHierarchy with simple DocumentExplorer featuring file explorer-style navigation. Root view shows only main folders as elegant cards, breadcrumb navigation allows jumping to any level, back button for returning to previous level. Eliminated complex expandible tree structure in favor of intuitive folder → content → back navigation pattern. Mobile users continue using modal preview while desktop features two-column layout.
- **Desktop Two-Column Document Layout (2025-08-13)**: Implemented split-screen document management for desktop (lg+ breakpoints). Left column (50%) displays real-time document viewer with PDF.js integration, image previews, and file info header. Right column (50%) contains DocumentExplorer for navigation. Clicking any document instantly displays in left viewer without modal interruption. Mobile maintains single-column layout with modal previews. Combines the convenience of side-by-side viewing with the simplicity of file explorer navigation.

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