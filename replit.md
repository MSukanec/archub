# Archub - Construction Management Platform

## Overview

Archub is a modern construction management platform built with a React frontend and Express.js backend. The application provides tools for tracking projects, managing teams, and monitoring budgets in the construction industry. It features a responsive design with authentication, dashboard analytics, and a comprehensive UI component library.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: Zustand for global state (auth, navigation, theme)
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query (React Query) for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions
- **Development**: Hot reload with tsx and Vite middleware integration

### Authentication Strategy
- **Primary**: Supabase Auth for user management
- **Providers**: Email/password and Google OAuth
- **Session Handling**: Supabase sessions with persistent storage
- **State Management**: Zustand store with authentication state

## Key Components

### Data Layer
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Shared between frontend and backend (`shared/schema.ts`)
- **Migrations**: Managed through Drizzle Kit
- **Storage Interface**: Abstracted storage layer with in-memory fallback

### UI Components
- **Design System**: shadcn/ui with "new-york" style variant
- **Theme**: Neutral color palette with dark mode support
- **Components**: Comprehensive set including forms, data display, navigation
- **Accessibility**: Built on Radix UI for ARIA compliance

### State Management
- **Authentication**: User session, loading states, sign-in/out methods
- **Navigation**: Sidebar state, current page tracking, menu items
- **Theme**: Dark/light mode with persistence

### Development Tools
- **Hot Reload**: Vite with runtime error overlay
- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: ESLint integration (implicit)
- **Path Aliases**: Absolute imports for components and utilities

## Data Flow

1. **Authentication Flow**:
   - User authenticates via Supabase Auth
   - Session stored in Zustand with persistence
   - Protected routes redirect to auth modal if unauthenticated
   - Auth state initialized on app load

2. **API Communication**:
   - Frontend uses React Query for server state
   - Custom query client with authentication handling
   - Express backend provides REST API endpoints
   - Shared types between frontend and backend

3. **Database Operations**:
   - Drizzle ORM handles database queries
   - Storage interface abstracts database operations
   - In-memory storage for development/testing
   - PostgreSQL for production data persistence

## External Dependencies

### Core Dependencies
- **Supabase**: Authentication and potentially additional services
- **Neon Database**: Serverless PostgreSQL hosting
- **Radix UI**: Headless component primitives
- **TanStack Query**: Server state management
- **Drizzle**: Type-safe ORM for PostgreSQL

### Development Dependencies
- **Vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production build bundling
- **Tailwind CSS**: Utility-first styling

### UI Libraries
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities
- **class-variance-authority**: Component variant management
- **clsx + tailwind-merge**: Conditional class merging

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles Node.js server to `dist/index.js`
- **Development**: Concurrent frontend/backend with hot reload
- **Production**: Static frontend serving with Express API

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **Supabase**: API URL and anonymous key for authentication
- **Replit**: Configured for autoscale deployment target
- **Port Configuration**: Server runs on port 5000, external port 80

### Development Workflow
- **Local Development**: `npm run dev` starts both frontend and backend
- **Database Management**: `npm run db:push` syncs schema changes
- **Type Checking**: `npm run check` validates TypeScript
- **Build**: `npm run build` creates production assets

## Changelog

```
Changelog:
- July 3, 2025. Implemented SiteLogCard mobile component and MobileActionBar integration for bitácora page
  • Created SiteLogCard.tsx component in src/components/cards/ following MovementCard pattern with comprehensive site log display
  • Integrated MobileActionBar with 5 action slots: Home, Search, Create Entry (green button), Filters, Clear Filters
  • Added conditional rendering in ConstructionLogs.tsx: SiteLogCard for mobile, Collapsible for desktop
  • Fixed modal scrolling issues by removing duplicate overflow-y-auto from CustomModalBody and enhancing CustomModalLayout
  • Applied scrollbar-thin styling to modal body container for visible scrollbars
  • Completed grid-cols-2 to grid-cols-1 conversion in NewSiteLogModal.tsx ensuring single column layout on all devices
  • SiteLogCard displays entry type badge, date/weather, creator avatar, comments, and related items count
  • MobileActionBar auto-configures on mobile with contextual actions and clears on component unmount
  • Mobile users can now create, filter, and manage site logs through bottom action bar interface
- July 3, 2025. Enhanced CustomModalBody component with dynamic column layout control
  • Added columns prop (1 | 2) with default value of 2 for backward compatibility
  • Implemented responsive grid system: columns=1 uses grid-cols-1, columns=2 uses grid-cols-1 md:grid-cols-2
  • Added grid layout with gap-4 spacing to base component classes
  • Enables centralized column control without manual grid classes in individual modals
  • Mobile-first approach: always single column on mobile, optional two columns on desktop (md+)
  • Maintains existing modal functionality while providing flexible layout options
- July 3, 2025. Implemented Google Tasks-style completed tasks system for Kanban and Design Phase Tasks
  • Created TaskListWithCompleted.tsx component with active/completed task separation and accordion interface for completed tasks
  • Added is_completed and completed_at fields to KanbanCard and DesignPhaseTask interfaces for completion tracking
  • Implemented useToggleKanbanCardCompleted and useToggleDesignPhaseTaskCompleted mutation hooks for database persistence
  • Enhanced CustomKanban component with completion checkboxes (CheckCircle/Circle icons) and visual completion states
  • Tasks auto-sort with active tasks first, completed tasks last, plus visual separators between sections
  • Completed tasks display with line-through text, reduced opacity, and completion date information
  • Added hover states and smooth transitions for completion status changes with toast notifications
  • Maintained drag & drop functionality while adding completion features without breaking existing Kanban workflow
  • Both Kanban cards and Design Phase tasks now support Google Tasks-style completion with consistent UX patterns
- July 3, 2025. Enhanced Kanban mobile UX with snap scrolling and fixed user data display
  • Implemented mobile-first snap scrolling for Kanban lists: each list centers on screen with snap-x snap-mandatory CSS
  • Lists now use full viewport width minus margin on mobile (calc(100vw-2rem)) and snap to center when scrolling
  • Fixed Kanban user data display by adding JOIN queries to fetch creator information from users table
  • Enhanced useKanbanCards and useKanbanLists hooks to include creator data with proper TypeScript interfaces
  • Cards and lists now display actual user names and avatars instead of showing "Usuario" for all items
  • Updated KanbanCard and KanbanList interfaces to include optional creator object with user details
  • Mobile Kanban navigation now provides Instagram-style horizontal scrolling that snaps between lists
  • Desktop maintains standard smooth scrolling while mobile gets optimized snap-to-center user experience
  • All user avatars and names throughout Kanban system now display authentic data from Supabase database
  • Fixed TypeScript issues with nullable avatar URLs and proper optional chaining for user data access
- July 1, 2025. Implemented responsive financial cards system with currency selection and optimized layouts
  • Created FinancialCards component with responsive behavior: desktop shows max 3 cards full-width, mobile shows single card with currency selector
  • Desktop adaptive grid: 1 card uses grid-cols-1, 2 cards use grid-cols-2, 3+ cards use grid-cols-3 for optimal space utilization
  • Mobile interface features currency dropdown selector defaulting to organization's default currency setting
  • Integrated useOrganizationDefaultCurrency hook to fetch organization's preferred currency from Supabase database
  • Financial cards automatically adapt layout: desktop maximizes available width, mobile prioritizes single-card clarity with selection capability
  • Replaced fixed grid layout with dynamic responsive system maintaining professional Lemon Squeezy aesthetic
- July 1, 2025. Created MovementCard component for professional mobile movement display
  • Built MovementCard.tsx in src/components/cards/ following MercadoLibre-style design reference
  • Horizontal layout: avatar (left) + movement data (center) + amount with currency (right)
  • Avatar shows creator image or initials fallback with circular design (w-10 h-10)
  • Category display in format "Tipo / Categoría / Subcategoría" with proper text sizing
  • Description truncated to 30 characters with full tooltip on hover for better UX
  • Amount formatting with thousands separators using Intl.NumberFormat for Argentine locale
  • Color-coded amounts: green for Ingresos (+), red for Egresos (-) following financial conventions
  • Professional styling with white background, subtle borders, shadow-sm, and proper padding/spacing
  • Component designed for integration with CustomTable renderCard prop for mobile financial movement display
- July 1, 2025. Complete mobile optimization implementation with professional navigation system and directional animations
  • Created comprehensive mobile navigation system with MobileMenu component and useMobileMenuStore Zustand store
  • Modified Layout.tsx to hide sidebar on mobile devices (md:hidden) with responsive margin adjustments
  • Moved hamburger button to right side of header for better mobile UX and accessibility
  • Enhanced Header.tsx with proper mobile responsiveness - logo hidden on mobile, breadcrumb hidden on mobile
  • MobileMenu covers 100% of screen height and width using proper CSS variables for Lemon Squeezy aesthetic
  • Fixed navigation to use wouter router (navigate()) instead of window.location.href to prevent white screen issues
  • Applied consistent styling with --menues-bg, --menues-fg, --menues-border CSS variables throughout mobile components
  • Navigation buttons use hover:opacity-80 for smooth interaction feedback without complex event handlers
  • Mobile menu includes complete navigation to all major sections: Organization, Projects, Contacts, Timeline, Finances, Construction, Tasks
  • Footer with quick access to Administration, Tasks, and Profile sections in grid layout
  • All mobile components maintain Lemon Squeezy design consistency with proper spacing and professional typography
  • Implemented directional animation system: left slide for advancing in hierarchy (organization→project→design), right slide for returning
  • Fixed menu structure to match desktop sidebar EXACTLY: correct accordion organization, proper navigation order
  • Added "General" section in all menu contexts with Profile, Tasks, and Administration buttons for consistent access
  • Simplified mobile header: only title (left) + hamburger button (right) without problematic border elements
- July 1, 2025. Fixed financial movements to use movement_date instead of created_at for all date operations
  • Corrected NewMovementModal schema to use movement_date as primary date field, removed created_at references
  • Fixed all form reset operations to default to movement_date with current date
  • Updated form field mapping to properly bind movement_date in edit mode
  • Simplified creator field SelectItems to remove avatars for consistent input heights following Lemon Squeezy aesthetic
  • Enhanced CustomTable with defaultSort prop for configurable initial sorting (movements now sort by date descending)
  • Fixed movement save operations to store movement_date in database correctly
  • Cleaned up debug logging for production-ready console output
  • All date displays in movements table now use movement_date as primary source with created_at fallback
- July 1, 2025. Complete Gantt chart refinement with Jira-style professional features and optimized timeline display
  • Rebuilt entire Gantt system with modular architecture: Gantt.tsx, GanttGrid.tsx, GanttRow.tsx, GanttBar.tsx
  • Implemented fixed left column (250px) with sticky positioning for phase/task names, separate scrollable timeline area
  • Added dynamic timeline range calculation based on project phase dates with automatic padding
  • Created sophisticated date header system: month labels on top row, day numbers with weekday abbreviations below
  • Built "HOY" (today) indicator system: blue background highlighting and vertical line across entire timeline height
  • Enhanced view mode switcher (Días/Semanas/Meses) with proper column width calculations (40px/100px/160px)
  • Added "Ir a HOY" button for automatic scroll centering on current date
  • Implemented drag & resize handles on task bars with hover visibility and visual feedback
  • Created comprehensive utility functions: getTimelineRange, getDateArray, getWeekday, isToday for date management
  • Built Zustand store for view mode state management with persistence
  • Applied professional Jira-style colors: blue for phases, gray for tasks, subtle hover effects
  • Timeline automatically adapts to actual project date ranges instead of fixed monthly view
  • Prepared foundation for Supabase integration with proper TypeScript interfaces
- July 1, 2025. Enhanced design timeline with comprehensive task management and improved accordion interface
  • Updated header title from "Cronograma de Diseño" to "Cronograma" and button text to "Nueva Fase de Diseño"
  • Replaced manual empty state with CustomEmptyState component for consistency
  • Eliminated non-existent database column references (is_active, position) from design_phases queries
  • Created NewPhaseTaskModal.tsx for task creation within design phases with proper field structure
  • Added comprehensive form fields: Creador (defaults to current user), Asignada a (optional), name, description, dates, status, priority
  • Built backend endpoint /api/design-phase-tasks for creating tasks with automatic position handling
  • Enhanced CustomDesignGantt with edit/delete/add task action buttons in accordion headers
  • Redesigned phase cards as full-width accordions with all content contained within
  • Action buttons now positioned in header right side: "Agregar Tarea", Edit, Delete with proper click event handling
  • Integrated drag handle, edit functionality, and task creation workflow
  • Added edit mode support to NewPhaseModal with editingPhase prop for phase modification
  • All database operations use correct table structure: design_phase_tasks with proper foreign key relationships
  • Modal system follows established pattern with CustomModalLayout components and proper form validation
- June 30, 2025. Enhanced Organization Preferences with auto-save functionality, improved UI consistency, and movement concepts management
  • Implemented automatic save with 1.5-second debounce delay eliminating the need for manual save button
  • Added page title "Configuración de la Organización" and description following reference design pattern
  • Enhanced form sections with horizontal Separator components for better visual organization
  • Updated CustomMultiComboBox styling to match input component aesthetics exactly (height, padding, colors, borders)
  • Created wrapper functions for all state setters to trigger auto-save on every change
  • Added subtle toast notifications for auto-save feedback ("Cambios guardados automáticamente")
  • Improved error handling with descriptive messages for auto-save failures
  • Removed save button from header as part of streamlined auto-save implementation
  • Fixed visual separators between sections using hr elements with explicit border styling for better visibility
  • Increased column spacing from gap-8 to gap-12 for better content distribution between title/description and form fields
  • Created comprehensive Movement Concepts management section with hierarchical display and CRUD operations
  • Added MovementConcept interface and queries to load system concepts (organization_id null) and organization-specific concepts
  • Implemented create/delete mutations for movement concepts with proper parent-child relationships (only children can be created by organizations)
  • Built visual hierarchy showing parent concepts (EGRESOS, INGRESOS, CONVERSION) with their child concepts organized and labeled as "Sistema" or "Personalizado"
  • Added form controls for creating new child concepts with parent selection and name input, plus delete buttons for organization-owned concepts only
  • Enhanced UX with immediate visual feedback and seamless preference management
- June 30, 2025. Complete Kanban board system implementation with Supabase integration
  • Created comprehensive Kanban system using kanban_boards, kanban_lists, kanban_cards, kanban_comments, and kanban_attachments tables
  • Built useKanban hooks for all CRUD operations with proper React Query integration and error handling
  • Implemented Zustand store (useKanbanStore) for managing current board state with persistence
  • Created CustomKanban component with drag & drop functionality using react-beautiful-dnd
  • Built complete modal system: CardDetailsModal (view/edit cards with comments/attachments), NewCardModal, NewBoardModal, NewListModal
  • Tasks page now supports multiple boards with board selector, list management, and card creation
  • Drag & drop moves cards between lists with automatic position updates in Supabase
  • Card details show assigned users, due dates, comments count, and attachments count
  • Comment system allows adding/viewing comments with user avatars and timestamps
  • File attachment system with Supabase Storage integration for uploading/downloading files
  • Complete responsive design with Trello/Linear-style interface following Archub aesthetic
  • Added "Gestión de Tareas" navigation item to organization sidebar for easy access
  • Full error handling with optimistic updates and rollback on failure
  • Auto-selects first board when user has no current board selection
- June 29, 2025. Fixed AdminTaskParameters database schema integration and data transformation issues
  • Corrected database query structure to use proper JOIN operations between task_template_parameters and task_parameters tables
  • Fixed data transformation logic to handle junction table relationships correctly, preserving parameter details (name, label, type)
  • Updated CRUD operations to work with correct table structure: task_template_parameters for parameter associations, task_parameters for parameter definitions
  • Enhanced query performance with proper foreign key relationships and nested data fetching
  • Resolved SelectItem validation errors by using proper form default values (undefined instead of empty strings)
  • System now displays real parameter data with options correctly grouped and associated
  • Maintained accordion interface with expandable parameter sections showing associated options
  • All database operations (create, read, update, delete) now function correctly with authentic Supabase data
- June 29, 2025. Complete AdminTaskParameters system with accordion interface for parameter and option management
  • Created comprehensive AdminTaskParameters.tsx page with accordion-based interface for managing task_template_parameters and task_template_parameter_options
  • Built NewTaskParameterModal.tsx and NewTaskParameterOptionModal.tsx with full form validation and CRUD operations
  • Implemented useTaskParametersAdmin hook with complete Supabase integration for parameters and options management
  • Accordion interface displays parameters with expandable sections showing their options, following single-accordion behavior
  • Parameter creation supports text, number, select, and boolean types with optional units and required field settings
  • Option management allows creating, editing, and deleting parameter options with position-based ordering
  • Added statistics cards showing total parameters, select-type parameters, total options, and required parameters
  • Integrated with admin sidebar under "Tareas > Parámetros" navigation with proper AdminProtectedRoute wrapper
  • Modal system uses feature-based organization in /modals/tasks/ with consistent CustomModalFooter pattern
  • Complete delete confirmation dialogs for both parameters and options with cascade deletion handling
- June 29, 2025. Complete modal reorganization into feature-based structure with systematic TypeScript error resolution
  • Organized all modals into feature-based folders: /modals/admin, /modals/budget, /modals/contact, /modals/material, /modals/movement, /modals/organization, /modals/project, /modals/site, /modals/tasks
  • Updated all import paths across 50+ files to use new modal structure with @/modals/ prefix
  • Implemented single-accordion sidebar behavior ensuring only one accordion opens at a time
  • Enhanced CustomModalFooter to support both onSave and onSubmit props for flexible modal handling
  • Fixed NewTaskTemplateModal to properly handle preselectedCategoryId prop with correct form initialization
  • Resolved Header component TypeScript errors by updating icon prop interface to accept both ComponentType and ReactNode
  • Systematically fixed all TypeScript errors across the application for stable compilation
  • Modal architecture now follows clean separation of concerns with feature-based organization
- June 29, 2025. Created TemplateNameBuilder component and fixed modal accordion structure
  • Built comprehensive TemplateNameBuilder.tsx component in src/components/ui-custom/misc for visual template construction
  • Replaced traditional textarea with visual component allowing parameter chips and text elements
  • Component supports inserting parameters from dropdown, editing text inline, removing elements
  • Includes preview with example values showing how template will render
  • Converts visual elements to {{parameter}} string format internally for database storage
  • Fixed NewTaskTemplateModal.tsx schema to match actual task_templates table structure (removed parent_category_id references)
  • Reorganized modal into accordion sections: Categoría (hierarchical selection) and Plantilla (visual builder)
  • Added mock parameters for demonstration of visual template building functionality
  • Fixed TypeScript errors related to form field validation and database column mismatches
- June 29, 2025. Complete AdminGeneratedTasks system, Task Templates management, and improved admin sidebar navigation
  • Created AdminGeneratedTasks.tsx page duplicating AdminTasks functionality with real Supabase data integration
  • Built complete NewAdminGeneratedTaskModal.tsx with dynamic form generation based on task templates
  • Implemented useTaskTemplates, useTaskTemplateParameters, and useGeneratedTasks hooks for full Supabase integration
  • Dynamic parameter rendering supports text, number, select, and boolean field types with validation
  • Select fields automatically load options from task_template_parameter_options table
  • Form validation enforces required fields (is_required = true) with custom error messages
  • RPC function create_generated_task handles parametric task creation with duplicate detection using input_organization_id parameter
  • Existing task detection shows code/description instead of creating duplicates
  • Modal supports template dropdown, parameter loading, form validation, and success/error handling
  • Added /admin/generated-tasks route to App.tsx with proper AdminProtectedRoute wrapper
  • Complete parametric task generation system ready for production use with generated_tasks table
  • Created comprehensive AdminTaskTemplates.tsx page with full CRUD operations for task_templates table
  • Built NewTaskTemplateModal.tsx with form validation for name, code_prefix, name_template, and category_id fields
  • Implemented useTaskTemplatesAdmin hook with complete CRUD functionality and proper Supabase integration
  • Template creation validates code_prefix uniqueness (2-4 uppercase letters) and name_template contains {{param}} placeholders
  • Statistics cards show total templates, recent templates, categories with templates, and templates with parameters
  • Table displays creation date, prefix, name, category, template structure, and action buttons (view parameters, edit, delete)
  • Added /admin/task-templates route with proper AdminProtectedRoute wrapper
  • Restructured admin sidebar to use accordion sections: Resumen de Administración, Comunidad (Organizaciones, Usuarios), Tareas (Tareas, Tareas Generadas, Plantillas de Tareas), Materiales (Materiales, Categorías de Materiales)
  • Enhanced admin navigation with accordion functionality matching project sidebar pattern for improved UX
- June 28, 2025. Fixed Personnel page navigation and standardized empty states across all pages
  • Fixed Personnel page routing issue by adding proper Link component from wouter for "Ir a Bitácora" button
  • Added CustomEmptyState to Activity page without action button as requested
  • Fixed Personnel and Bitácora pages to hide statistics cards when no data exists - now only CustomEmptyState shows
  • Enhanced mobile responsiveness of CustomEmptyState to be vertically centered and occupy 70% of viewport height
  • Fixed desktop width to use 100% available space while maintaining mobile constraints for optimal readability
  • Verified both Bitácora and Personal pages now show CustomEmptyState when no data exists (like projects/contacts pages)
  • Simplified CustomEmptyState design removing complex animated shapes for improved performance and cleaner aesthetic
  • Replaced complex animations with simple diagonal hatch background pattern using repeating-linear-gradient
  • Fixed CustomEmptyState positioning issue on contacts page by removing min-h wrapper div
  • Component now uses 100% width and 70% height of its container with proper vertical centering
  • Standardized header button sizes across all pages using CSS selectors in Header.tsx
  • All action buttons now consistently use h-8 px-3 text-sm font-medium sizing
  • Enhanced modal layout to be full-screen on mobile and full-height on desktop
  • Maintained rounded corners and proper spacing on desktop while ensuring mobile compatibility
- June 28, 2025. Complete OrganizationDashboard redesign and header dropdown modifications
  • Completely redesigned OrganizationDashboard.tsx with clean, professional layout following standard component styling
  • Changed page title from "Dashboard de la Organización" to "Resumen de la Organización"
  • Removed all hardcoded colors and gradients - now uses default shadcn/ui Card components
  • Implemented wide layout for better content display across full viewport
  • Added CustomEmptyState components for sections without data (projects, activity)
  • Created three-column layout: Proyectos Recientes, Actividad Reciente, Acciones Rápidas
  • Organization info card at top shows name, status badges, plan info, and foundation date
  • All action buttons have correct URLs: /proyectos, /organization/contactos, /finanzas/movimientos, /obra/bitacora, /construction/budgets
  • Modified header dropdowns: removed "Nueva Organización" button, changed "Nuevo Proyecto" to "Gestión de Proyectos"
  • Header project dropdown now links to /proyectos page for project management
  • All navigation properly configured with working routes and authentication flow
- June 28, 2025. Complete Personnel page enhancement with dynamic cards and month headers
  • Fixed Personnel page filtering bug - now correctly filters by project and organization instead of showing all data
  • Updated usePersonnelAttendance hook to use new organization_id column in site_logs table
  • Added organization_id to site log creation mutation ensuring new bitácoras save organization data
  • Replaced hardcoded statistics cards with dynamic data-driven cards showing real attendance metrics
  • Enhanced CustomEmptyState with "Ir a Bitácora" button that navigates to construction logs page
  • Added month headers above days in CustomGradebook timeline for better date navigation
  • Implemented two-row header structure: month names (25px) + day numbers/names (40px) for 65px total
  • All Personnel attendance data now properly scoped to current project and organization context
  • Statistics cards now calculate: Total Personal, Días Activos, Jornadas Completas, and Tasa Completa from real data
- June 28, 2025. Complete profile page redesign and sidebar functionality fixes
  • Fixed sidebar toggle switch in Profile page - now properly syncs with sidebar button and saves to database
  • Removed Theme and Panel buttons from sidebar footer as requested - only Profile button remains
  • Completely redesigned Profile page following user reference image with two-column layout
  • Added plan information card at top showing current plan status with "Chatear con nosotros" and "Actualizar" buttons
  • Left column: section titles and descriptions, right column: form fields
  • Added Separator components between all sections for clean visual division
  • Profile sections: Profile (avatar, name, email), Personal Information (names, country, birthdate), Preferences (theme, sidebar), Danger Zone (sign out)
  • Used max-w-4xl constraint for optimal profile page width instead of default layout width
  • Profile page now uses "Configuración de la cuenta" as title - fully translated to Spanish
  • All text translated to Spanish following user requirements
  • Changed danger zone border to use border-destructive color instead of muted gray
  • Switch controls save immediately to database when toggled

- June 28, 2025. Complete dashboard redesign with spectacular visual and functional improvements
  • Completely rebuilt ProjectDashboard.tsx with real data integration and advanced visual design
  • Added comprehensive project statistics: financial metrics (income, expenses, balance), site logs count, and progress tracking
  • Implemented gradient-based header with project information, status badges, and progress indicator
  • Created color-coded metric cards with gradients: green for income, red for expenses, blue for balance, purple for site logs
  • Added quick action buttons for navigation to Presupuestos, Bitácora, Finanzas, and Personal pages
  • Built recent activity feed showing real site log entries with proper data visualization
  • Enhanced project summary section with detailed breakdown of budgets, movements, and progress calculation
  • Completely redesigned OrganizationDashboard.tsx with authentic Supabase data and professional interface
  • Added organization health score calculation based on active projects, contacts, site logs, and financial balance
  • Implemented comprehensive organization statistics with real-time data from multiple tables
  • Created gradient-based organization header with plan badges, activity metrics, and health progress indicator
  • Built financial overview cards showing total income, expenses, net balance with proper color coding
  • Added project status breakdown displaying active, planning, and completed project counts
  • Enhanced recent activity feed with color-coded activity items and proper timestamp formatting
  • Implemented clickable project cards for easy navigation between organization and project dashboards
  • Both dashboards now use authentic data from Supabase with proper error handling and loading states
  • Applied Lemon Squeezy design aesthetic with gradients, proper spacing, and professional typography

- June 28, 2025. Fixed site logs modal and Personnel timeline alignment issues
  • Made "Comentarios" field optional in site logs modal - no longer required for entry creation
  • Enhanced timeline cache invalidation - Personnel attendance now updates immediately after site log modifications
  • Fixed horizontal line alignment in Personnel timeline - synchronized row heights between personnel column and timeline data
  • Timeline preserves exact visual continuity with proper border logic between contact type groups
  • Site log updates now trigger immediate refresh of Personnel page attendance visualization

- June 28, 2025. Enhanced Personnel timeline with drag functionality and auto-centering
  • Timeline now automatically centers on "today" ONLY on initial page load and when clicking "Hoy" button
  • Fixed drag-and-drop behavior - timeline maintains position after dragging without returning to "today"
  • Replaced click buttons with invisible hover areas for smooth continuous scrolling (2px increments at 60fps)
  • Navigation areas are nearly transparent with no borders, only visible on hover (opacity 0 → 30%)
  • Contact type grouping headers reduced to 20px height with xs text for compact display
  • Enhanced "today" visual indicator with 50% accent background color plus left/right borders
  • Timeline preserves user navigation position during all interactions except explicit "today" centering
  • Improved UX with hover-based navigation that doesn't interfere with drag functionality

- June 28, 2025. Fixed sidebar accordion behavior and enhanced Personnel page layout with today indicator
  • Fixed sidebar accordion collapse issue - accordions now stay open when clicking sub-items (Finanzas accordion stays open when clicking Movimientos)
  • Made Personnel page use wide layout for better viewing of attendance data across full viewport
  • Completely redesigned CustomGradebook layout with separate columns for personnel names and timeline
  • Personnel names column (264px width) has fixed background and doesn't scroll with timeline data
  • Timeline column scrolls independently with horizontal scrollbar only affecting attendance grid
  • Enhanced visual separation between personnel list and attendance tracking timeline
  • Fixed height alignment between personnel column and timeline - exact 65px height for all rows and headers
  • Personnel header and timeline header now have identical heights with proper vertical centering
  • All personnel rows match timeline row heights perfectly for seamless visual continuity
  • Hidden horizontal scrollbar while maintaining touch/mouse wheel scroll functionality
  • Added left/right navigation buttons positioned over timeline for easy date range navigation
  • Navigation buttons have backdrop blur and border styling for clear visibility over content
  • Added "Hoy" (Today) button in navigation controls to quickly center view on current date
  • Implemented vertical indicator line showing today's date across entire timeline
  • Default date range now centers on today (15 days before and after) instead of starting from today
  • Today's column highlighted with --accent color background and bold text for clear identification
  • Replaced month navigation with continuous timeline using start/end date selectors
  • Today indicators now use --accent CSS variable with left/right borders only (no center line)
  • Added date input controls for precise timeline range selection with "Desde" and "Hasta" labels
  • Continuous timeline allows infinite scrolling through any date range without month restrictions
  • Navigation buttons redesigned as circular icons with backdrop blur and shadow styling
  • Full workday attendance now uses --accent CSS variable color instead of hardcoded green
  • Added contact type filtering functionality to Personnel page with dropdown selector
  • Contact type filtering integrates with contacts table and contact_types for dynamic personnel grouping
  • Enhanced filtering UI includes contact type selector and weekend toggle in header dropdown
  • Personnel attendance data properly filtered by contact type (albañil, arquitecto, etc.)

- June 28, 2025. Complete Personnel page implementation with attendance tracking
  • Created ConstructionPersonnel.tsx page following ai-page-template.md structure with WIDE layout
  • Built usePersonnelAttendance hook to fetch attendance data from site_log_attendees table with contact and site_log joins
  • Added Personnel page to construction section sidebar navigation under "Obra" accordion below "Bitácora"
  • Integrated CustomGradebook component to display worker attendance in professional gradebook format
  • Transform attendance data from database into gradebook format with worker names and attendance status
  • Added filtering system with month/year selectors and search functionality for personnel management
  • Personnel attendance automatically populated from site log entries with related contact data
  • Added /construction/personnel route to App.tsx with proper routing configuration
  • Shows visual attendance tracking with full day/half day indicators from site_log_attendees records
  • Empty state displays when no personnel attendance data exists with helpful guidance messages

- June 28, 2025. Site logs UI optimization with compact layout and auto-expansion
  • Optimized collapsed site log cards to single row format: Fecha y Hora - Clima - Creador - Tipo de Entrada
  • Added border to creator avatar for better visual definition (border border-primary/20)
  • Implemented auto-expansion of most recent site log entry when page loads
  • Removed status indicator icons for cleaner interface design
  • Fixed database queries to fetch related data (events, personnel, equipment) using separate calls
  • Enhanced expanded view with individual cards for each event, personnel, and equipment item
  • Each related data item displays as colored card with proper spacing and typography
  • Events show blue cards, personnel show green cards, equipment shows orange cards
  • All related data properly integrated with site log creation and display functionality

- June 28, 2025. CustomGradebook component for visual attendance tracking and Personnel accordion completion
  • Created CustomGradebook.tsx component in src/components/ui-custom/misc/ with professional gradebook-style interface
  • Component displays workers as rows, days (01-30) as columns, with colored circles for attendance status
  • Green circles for full day attendance, yellow circles for half day, empty cells for no attendance
  • Includes responsive design with horizontal scroll, sticky worker names column, and hover effects
  • Added export functionality, attendance legend, and summary statistics cards
  • Fixed Personnel accordion in site logs modal with proper contact type filtering and database integration
  • Resolved database column naming error (changed site_log_id to log_id for site_log_attendees table)
  • Personnel accordion now properly saves contact selections with attendance type and description fields

- June 28, 2025. Site logs modal fixes and Events accordion implementation
  • Fixed site logs modal database schema issues by removing problematic foreign key relationships and organization_id column
  • Added Events accordion to site logs modal with full site_log_events and event_types integration
  • Created useEventTypes hook to fetch event types from Supabase database
  • Enhanced site log creation mutation to handle both site logs and associated events
  • Fixed creator field to properly default to current user organization member
  • Added complete Events management with add/remove functionality and proper form validation
  • Events accordion shows event count in header and allows dynamic event creation with type, date, and description
  • Site log modal now supports both basic information and related events in unified interface

- June 28, 2025. Materials management system and budget selector interface implementation
  • Created ConstructionMaterials.tsx page following ai-page-template.md structure with WIDE layout and CustomTable
  • Built useConstructionMaterials hook to aggregate materials from task_materials table based on budget tasks
  • Added "Materiales" button to project sidebar Obra accordion positioned between "Presupuestos" and "Bitácora"
  • Materials table displays: Categoría, Nombre, Cantidad Computada (auto-sum), Cantidad Comprada, Cantidad A Comprar
  • Transformed budget system from accordion-based to single card with budget selector dropdown interface
  • Auto-selects first budget when page loads, single table updates based on selected budget
  • Implemented complete CRUD operations: edit and delete tasks work with selected budget
  • Added /construction/materials route to App.tsx with proper routing configuration
  • Materials data aggregated from multiple budget tasks showing computed quantities per material

- June 28, 2025. Complete budget management system and project structure improvements
  • Created ConstructionBudgets.tsx page with accordion-based budget management following ai-page-template.md structure
  • Built NewBudgetModal.tsx with form fields matching Supabase budgets table: name, description, status, project_id
  • Added useBudgets hook for complete CRUD operations on budgets with proper Supabase integration
  • Added "Presupuestos" button to project sidebar Obra accordion positioned between "Resumen de Obra" and "Bitácora"
  • Each budget displays in accordion with CustomTable for tasks, "+ Agregar Tarea" and delete buttons in header
  • Moved SiteLogs.tsx to ConstructionLogs.tsx in src/pages/construction/ and removed src/pages/site/ folder
  • Updated all route references from SiteLogs to ConstructionLogs in App.tsx for cleaner project structure
  • Added CustomEmptyState to OrganizationProjects.tsx - shows when no projects exist with "Crear Primer Proyecto" action button
  • Fixed AdminTasks page import error - added missing useTasks hook import to resolve white screen issue
  • Tasks table now displays real data from Supabase tasks table with proper organization filtering
  • Hierarchical category system with three-level cascading dropdowns: Categoría → Subcategoría → Elemento (Categoría)
  • Accordion modal with single-section behavior - only one section can be open at a time with "Datos Básicos" expanded by default
- June 27, 2025. Complete Tasks admin system and plan button transparency fixes
  • Fixed plan button background - removed white/colored backgrounds, now transparent in both collapsed and expanded states
  • Created complete AdminTasks.tsx page with comprehensive table interface, statistics cards, and CRUD operations
  • Built NewAdminTaskModal.tsx with form fields for name, description, unit labor price, and unit material price
  • Added Tasks navigation button to admin sidebar positioned below Users with CheckSquare icon
  • Implemented useTasks hook with full CRUD operations: create, read, update, delete with proper Supabase integration
  • Added /admin/tasks route to App.tsx routing system with proper component import
  • Tasks page follows established admin patterns: wide layout, CustomTable, filtering system, action buttons
  • All task data sourced from authentic Supabase tasks table with proper error handling and loading states

- June 27, 2025. Complete admin system standardization and material categories table fixes
  • Fixed AdminMaterialCategories table layout issue - adjusted column widths to 15%, 70%, 15% to prevent action column overflow
  • Standardized ALL 6 admin pages to use wide layout: AdminDashboard, AdminOrganizations, AdminUsers, AdminTasks, AdminMaterials, AdminMaterialCategories
  • Removed all hardcoded card styling from admin pages - now use consistent p-3, text-xs, text-lg font-semibold structure
  • Eliminated all colored icon variations in statistics cards - all icons now use text-muted-foreground
  • Material categories table now displays correctly with proper headers, columns, and inline action buttons
  • All admin pages now have identical card styling following Lemon Squeezy aesthetic with ultra-compact spacing

- June 27, 2025. Complete material categories admin system and enhanced sidebar functionality
  • Created AdminMaterialCategories.tsx page with comprehensive table interface and statistics cards
  • Built NewAdminMaterialCategoryModal.tsx for creating and editing categories with proper form validation
  • Added "Categorías de Materiales" navigation button to admin sidebar positioned above "Materiales"
  • Implemented complete CRUD operations: create, edit, delete with confirmation dialogs and error handling
  • Enhanced filtering system with sort options and search functionality for category management
  • Updated Administration button icon from Settings to Shield for better visual identification
  • Fixed plan button to read actual organization plan data from userData.plan instead of hardcoded values
  • Plan button now always visible above divider with circular design matching reference aesthetic
  • Collapsed: circular button with colored background and white icon for clear visibility
  • Expanded: professional card with light blue background, circular icon badge, and proper typography
  • Plan button correctly displays FREE/PRO/TEAMS plans with appropriate styling and upgrade prompts
  • All material categories data sourced from authentic Supabase database with proper error handling

- June 27, 2025. Enhanced table action buttons and materials table layout improvements
  • Fixed button hover effects across all tables to use --button-ghost-hover-bg CSS variable for consistent styling
  • Updated materials table column order to: Fecha de Creación, Material, Categoría, Unidad, Costo, Acciones
  • Applied proper column width distribution: 5% for Fecha de Creación, Unidad, Costo, and Acciones; remaining width split between Material and Categoría
  • Replaced dropdown action menus with individual action buttons (edit, delete, favorite) displayed side by side
  • Enhanced favorite functionality with Heart icon that toggles is_favorite column in movements table
  • Improved CustomModalFooter component to support disabled states and loading indicators with proper prop handling
  • All action buttons now use consistent hover styling with --button-ghost-hover-bg CSS variable

- June 27, 2025. Complete materials management system implementation with professional admin interface
  • Created AdminMaterials.tsx page with comprehensive materials management functionality and statistics cards
  • Built NewAdminMaterialModal.tsx for creating and editing materials with proper form validation
  • Added "Materiales" navigation button to admin sidebar with Package icon for materials administration
  • Implemented materials table with custom column specifications: 5% width for all columns except "Material" (remaining width)
  • Applied specific column ordering: Fecha de Creación, Material, Costo, Unidad, Categoría, Acciones
  • Statistics cards show Total Materials, Average Cost, High Value Materials, and Recent Materials counts
  • Added complete CRUD operations: create, edit, delete with confirmation dialogs and proper error handling
  • Enhanced filtering system with sort options (name, cost, date), category filters, and search functionality
  • Modal includes fields: name (required), cost, unit selection, and category selection with predefined options
  • All data sourced from authentic Supabase database with proper error handling and loading states
  • Fixed Package icon import and added materials route to App.tsx with proper routing configuration

- June 27, 2025. Complete user management system implementation with professional table interface
  • Created AdminUsers.tsx page with comprehensive user management functionality and statistics cards
  • Added "Usuarios" navigation button to admin sidebar for full user administration (renamed from "Gestión de Usuarios")
  • Implemented user table with custom column specifications: 5% width for all columns except "Usuario" (remaining width)
  • Applied specific column ordering: Fecha de Registro, Última Actividad, Usuario, Organizaciones, Estado, Acciones
  • Removed "Sistema" column and "Nuevo usuario" button as requested, cleaned interface for viewing only
  • Fixed edit button functionality with simple modal displaying user information for review
  • Enhanced filtering system with sort options, status filters, and search functionality for user management
  • Statistics cards show Total Users, Active Users, Inactive Users, and Recent Registrations counts
  • All data sourced from authentic Supabase database with proper error handling and loading states

- June 27, 2025. Fixed critical modal issues after 15-day movement modal debugging session
  • FIXED: Admin organization modal Plan field timing issue - now waits for plans data before setting values
  • FIXED: Movement modal creator field now defaults to current user automatically on modal open
  • FIXED: Movement modal field clearing issue - removed aggressive form resets that caused data loss
  • Enhanced data loading sequence: currency/wallet fields now access correct nested properties
  • Added proper form state management with shouldValidate: false to prevent field conflicts
  • Movement modal successfully pre-populates all fields: creator, currency, wallet without clearing
  • Admin modal Plan field now displays selected plan correctly with proper database column names
  • Both modals now work completely with authentic Supabase data and proper error handling

- June 27, 2025. Complete admin functionality with statistics cards and optimized table layout
  • Enhanced AdminOrganizations.tsx with statistics cards showing Total Organizations, Free Plan, Pro Plan, and Teams Plan counts
  • Implemented wide layout setting for better table display across full viewport width
  • Updated table column widths: all columns 5% except Organization (35%) and Creator (30%) for optimal space distribution
  • Added Actions column with Edit/Delete dropdown functionality for complete organization management
  • Added Crown icons with color coding for different plan types in statistics cards
  • Statistics cards automatically calculate organization counts by plan type from real Supabase data
  • Table now provides optimal viewing experience with proper column proportions for data display

- June 27, 2025. Complete admin functionality implementation with sidebar navigation and organization management
  • Created AdminDashboard.tsx with system statistics and recent organizations overview
  • Built AdminOrganizations.tsx with complete table interface following ai-page-template.md structure
  • Implemented NewAdminOrganizationModal.tsx for creating new organizations with plan selection
  • Added admin sidebar context with "Resumen de Administración" and "Gestión de Organizaciones" navigation
  • Updated Sidebar.tsx to include admin context switching from Settings button
  • Added admin routes in App.tsx for /admin/dashboard and /admin/organizations
  • Admin functionality includes organization creation, filtering, and management capabilities

- June 27, 2025. Complete card backgrounds standardization and organization navigation improvements
  • Replaced all hardcoded card backgrounds (bg-white, bg-gray-50) with --card-bg CSS variable in CustomRestricted and OrganizationDashboard
  • Fixed organization switching navigation to properly redirect to organization sidebar context and OrganizationDashboard.tsx
  • Enhanced dropdown organization selection to set sidebar context and navigate automatically
  • All cards now consistently use CSS variable system for backgrounds instead of hardcoded Tailwind classes
  • Organization selection workflow: select organization → switch to organization sidebar → navigate to dashboard

- June 27, 2025. Fixed sidebar context switching and movements table layout improvements
  • Fixed project navigation from Organization Dashboard - now properly switches to project sidebar context
  • Added useEffect in ProjectDashboard.tsx to ensure correct sidebar context on page load
  • Merged Type, Category, and Subcategory columns in movements table into single stacked "Tipo" column
  • Enhanced project selection flow: click recent project → select project → switch to project sidebar → navigate to project dashboard
  • Added fade animations for sidebar navigation button transitions during context changes
  • All sidebar context switching now works correctly across organization and project navigation

- June 26, 2025. Complete modal system refinement with ultra-compact Lemon Squeezy aesthetic
  • Applied padding: 3 to all CustomModal components (Header, Body, Footer) for consistent spacing
  • Updated Button primary variant to use --button-primary-text CSS variable for proper text color
  • Enhanced Accordion titles to use text-sm font-medium matching modal title typography
  • Fixed dropdown backgrounds with proper --popover-bg and --card-border CSS variables 
  • Changed modal cancel button from ghost to secondary variant using proper button styling
  • Added Secondary Cards CSS variables (--secondary-card-bg, --secondary-card-fg) for accordion backgrounds
  • Applied Secondary Cards styling to Accordion components with background and text variables
  • All changes apply globally to modal system - no hardcoded individual modal modifications
  • Enhanced both light and dark mode support for all new CSS variables

- June 26, 2025. Complete UI refinement with Lemon Squeezy professional aesthetic
  • Refined Input.tsx: compact sizing (text-sm, py-2 px-3), ring-1 ring-accent focus, transition-all duration-150
  • Enhanced Label.tsx: text-xs, muted-foreground coloring, mb-1 spacing for vertical forms
  • Updated Textarea.tsx: matching Input styles with resize-none min-h-[120px] for consistent form fields
  • Redesigned Select.tsx: compact SelectTrigger, semantic colors for SelectContent/SelectItem
  • Rebuilt Button.tsx: text-sm font-medium px-4 py-2, bg-accent hover:bg-accent/80, duration-150 transitions
  • Refined Accordion.tsx: py-2 triggers, text-sm font-medium, pt-3 pb-4 content with space-y-3
  • All components now follow modern SaaS design with reduced visual footprint and professional appearance
  • Changes automatically apply across all modals, forms, and pages throughout the application

- June 26, 2025. Site logs enum system completely fixed and operational
  • Fixed critical weather enum validation errors by correcting to exact database enum values (sunny, cloudy, rainy, stormy, windy, snowy, hot, cold)
  • Updated all 9 entry types from database schema: avance_de_obra, visita_tecnica, problema_detectado, pedido_material, nota_climatica, decision, inspeccion, foto_diaria, registro_general
  • Corrected helper functions and filter options in SiteLogs.tsx to match database enum values exactly
  • Modal now saves entries without database enum constraint violations using proper organization_member_id for created_by field
  • Entry type icons and labels properly mapped for all enum values with visual consistency
  • Weather field properly handles null values and validates against exact database enum constraints

- June 26, 2025. Complete movement modal data loading and save functionality fix
  • Fixed currency display issue - now shows "Peso Argentino" and "Dólar Estadounidense" instead of "Sin nombre (N/A)"
  • Updated useCurrencies hook with proper JOIN query structure to fetch nested currency details correctly
  • Resolved table name mismatch - changed from "financial_movements" to "movements" table for saves
  • Added enhanced error logging and proper Supabase error handling in save mutations
  • Separated hook logic: useOrganizationWallets for modal vs useWallets for preferences to resolve data conflicts
  • Movement creation now works completely - saves to database and updates interface immediately
  • Cache invalidation properly configured to refresh data after successful saves
  • All form fields (currencies, wallets, types, categories) now display real data from Supabase

- June 26, 2025. Movement modal and table styling improvements completion
  • Fixed NewMovementModal to select current user by default in creator field automatically
  • Added ENTER key submit functionality to movement modal for faster data entry
  • Enhanced CustomTable styling to match reference design with sidebar-colored headers and card-styled rows
  • Updated table headers to use --menues-bg, --menues-fg, and --menues-border CSS variables
  • Applied --card-bg, --card-border, and --card-hover-bg variables to table rows for consistent theming
  • Marked FinancesMovements page as wide layout for optimal table display across full viewport
  • Table now provides professional invoice-style appearance matching provided visual reference

- June 26, 2025. CustomPhoneInput integration and two-column contact layout completion
  • Created professional CustomPhoneInput.tsx component with country selector and Unicode flag emojis
  • Replaced PhoneInput with CustomPhoneInput in NewContactModal.tsx for professional phone number input
  • Component shows only dial codes (+54, +1) without country abbreviations as requested
  • Applied clean design with CSS variables and no hover effects for consistent styling
  • Completed two-column layout in OrganizationContacts.tsx (33% left list, 67% right details)
  • Integrated CustomEmptyState when no contacts exist with proper action button

- June 26, 2025. Contact modal validation fixes and global required field styling
  • Made email and phone fields optional in NewContactModal - only name fields are required
  • Fixed contact schema validation to properly handle empty/optional email and phone values
  • Added global CSS styling for required field asterisks using --accent color
  • Updated contact creation and editing to save null values for empty optional fields
  • Applied required-asterisk class to form labels for visual consistency across application

- June 26, 2025. Complete CustomEmptyState visual enhancement and bitácora filtering fixes
  • Enhanced CustomEmptyState component with advanced floating particle animations
  • Improved dimensions: full width, min-height 300px, perfect centering with flexbox
  • Added sophisticated particle system: floating circles, geometric shapes, pulse effects
  • Fixed bitácora filtering by adding JOIN with projects table to validate organization membership
  • Added PROJECT button to header breadcrumb - now always visible between ORGANIZATION and STAGE
  • Bitácora now correctly filters by both project_id and organization_id preventing cross-organization data leakage

- June 25, 2025. Fixed action buttons and header navigation issues
  • Fixed project card action buttons (Edit/Delete) to prevent selection and navigation
  • Added stopPropagation to dropdown menu items to prevent triggering parent card clicks
  • Modified header to hide project breadcrumb when in organization context
  • Header now shows "ORGANIZATION > Page" in organization context instead of "ORGANIZATION > PROJECT > Page"
  • Action buttons across all pages now consistently aligned to left with proper event handling

- June 25, 2025. Added plan-based restrictions to "Nuevo Proyecto" buttons
  • Wrapped "Nuevo Proyecto" buttons in CustomRestricted component with max_projects feature check
  • Applied restrictions both in OrganizationProjects page header and Header dropdown menu
  • Buttons now respect organization plan limits and show upgrade prompts when limits are reached
  • Current project count is compared against plan's max_projects limit for proper restriction enforcement

- June 25, 2025. Fixed multiple project management and modal issues
  • Fixed project deletion functionality - now properly deletes from Supabase with confirmation
  • Corrected modal "creador" field to show current user member and load organization members properly
  • Fixed typology and modality dropdowns to load data from Supabase with proper fallback options
  • Enhanced Profile page layout: Mail field inline with Nombre Completo, both read-only
  • Reorganized Profile form: Fecha de nacimiento now inline with País for better visual balance

- June 25, 2025. Final UX improvements for contact modal and profile page
  • Made Email and Phone fields optional in NewContactModal (removed required validation)
  • Removed preferences card completely from Profile page for cleaner interface
  • Contact creation now accepts empty email/phone values without validation errors
- June 18, 2025. Initial setup - Complete SPA base structure implemented
  • React + Vite + TypeScript frontend with shadcn/ui components
  • Supabase authentication (email + Google OAuth)
  • Zustand stores for auth, navigation, and theme management
  • Responsive sidebar navigation (Supabase-style)
  • Header with project selector and user menu
  • PageHeader component for consistent page layouts
  • Protected routes with authentication modal
  • Dashboard page with construction management UI
  • Dark/light theme support with persistence

- June 18, 2025. Layout improvements and Organizations page
  • Removed Header component from Layout - full screen for content
  • Sidebar now collapses to icons-only (Supabase-style hover expansion)
  • Created Organizations.tsx page with real Supabase data integration
  • React Query implementation for organization and membership data
  • Proper error handling and loading states
  • Fixed DOM nesting warnings in navigation components
  • Added Organization navigation item with Building icon

- June 18, 2025. Data architecture refactoring with useCurrentUser hook
  • Created useCurrentUser hook calling archub_get_user RPC function
  • Centralized all user, organization, role and plan data in single query
  • Refactored Organizations.tsx to use only useCurrentUser (no direct table queries)
  • Added plan information display with Crown icon and features
  • Clean error states and validation for missing data fields
  • All UI components from design system, no custom divs or styles

- June 18, 2025. Complete UI constants refactoring and SidebarButton component
  • Created centralized UI constants in client/src/lib/constants/ui.ts
  • All visual measurements (SIDEBAR_WIDTH, BUTTON_SIZE, ICON_SIZE) now use constants
  • Created reusable SidebarButton component with standardized sizing
  • Completely refactored Sidebar.tsx to eliminate hardcoded styles
  • Removed Header.tsx completely as it's no longer used in layout
  • All sidebar elements now use consistent padding and transition timing
  • Visual structure is now scalable and maintainable from single constants file

- June 18, 2025. Enhanced SidebarButton with full clickable areas and proper text handling
  • Refactored SidebarButton to accept children and isExpanded props
  • Entire button area (icon + text) now clickeable as single component
  • Text properly hidden when collapsed, shown when expanded
  • Added subtle hover effects (shadow and scale) to buttons
  • Logo, navigation items, and settings all use same SidebarButton component
  • Eliminated group-hover patterns in favor of internal button state management
  • All buttons maintain exact BUTTON_SIZE dimensions with consistent behavior

- June 18, 2025. Complete SidebarButton redesign with precise visual structure
  • Rebuilt SidebarButton with conditional rendering (collapsed vs expanded states)
  • Collapsed: exact BUTTON_SIZE (40x40px) centered icons, no padding, no text
  • Expanded: full width buttons with icon + text, proper left alignment
  • Adjusted SIDEBAR_EXPANDED_WIDTH to 200px for better proportions
  • Implemented exact 8px spacing between navigation items using PADDING_SM
  • All sections (header, nav, footer) use consistent 8px padding
  • Eliminated all unnecessary margins and external spacing
  • Single button structure transforms cleanly between states

- June 18, 2025. Fixed session persistence and authentication state management
  • Refactored authStore to properly handle session persistence across page refreshes
  • Added initialized state to prevent premature auth modal display
  • Improved ProtectedRoute to show loading spinner while authentication initializes
  • Fixed Supabase null checks throughout authentication flow
  • Enhanced error handling and logging for auth state changes
  • Sessions now persist correctly when user refreshes the page
  • Eliminated unwanted logout behavior on page reload

- June 18, 2025. Added theme toggle button with database synchronization
  • Added theme toggle button to sidebar footer above Settings button
  • Enhanced themeStore to sync theme changes with user_preferences table
  • Integrated with useCurrentUser hook to get user preferences ID
  • Theme persists across sessions by loading from database on app start
  • Button shows Moon/Sun icon based on current theme state
  • Uses same SidebarButton component for consistent styling
  • Layout component syncs theme from database when user data loads

- June 18, 2025. Sidebar visual refinements to match Supabase style exactly
  • Reduced BUTTON_SIZE from 40px to 36px and SIDEBAR_WIDTH from 40px to 48px
  • Changed button text size from text-sm to text-xs for more compact appearance
  • Reduced horizontal padding from px-3 to px-2 for tighter button alignment
  • Applied gap-1 spacing in footer and navigation sections for minimal visual gaps
  • Consistent 8px padding throughout all sidebar sections
  • Sidebar now matches Supabase's lightweight and compact design language

- June 18, 2025. Created CustomPageHeader component replacing PageHeader
  • Built new CustomPageHeader.tsx in client/src/components/ui-custom/ folder
  • Exact 76px total height split into two 38px rows as specified
  • First row: icon + title (left) and action buttons (right)
  • Second row: full-width search input, filters dropdown, and clear button
  • Props: icon, title, actions, search functionality, and configurable filters array
  • Replaced PageHeader in Dashboard.tsx and Organizations.tsx
  • All visual elements use text-sm/text-base sizing with 16-18px icons
  • Filters dropdown automatically hides when filters array is empty
  • Component is fully reusable across all application pages

- June 18, 2025. Complete page layout architecture restructuring with three-component system
  • Created CustomPageBody.tsx with configurable padding (none, sm, md, lg) and debug border
  • Redesigned CustomPageHeader.tsx to single 38px row with left title and right controls
  • Controls ordered: filters, clear filters, sort button, secondary buttons, primary actions
  • Modified CustomPageLayout.tsx to use p-4 wrapper padding and CustomPageBody integration
  • Applied new architecture to Dashboard.tsx and Organizations.tsx with padding="none"
  • Eliminated hardcoded padding from page content - now centrally controlled via CustomPageBody
  • Debug borders: red (layout container), orange (header), blue (body) for visual verification
  • System provides consistent, scalable layout structure across all application pages

- June 18, 2025. Implemented clean circular icon interface for page headers (Linear/Supabase style)
  • Created CustomSearchButton.tsx with expandable input that appears on hover/click
  • Search input expands left from button with smooth transitions and proper focus management
  • Redesigned CustomPageHeader controls as 40x40px circular ghost buttons (variant="ghost" size="icon")
  • Three main controls: search (expandable), filters (dropdown), clear (single action)
  • All buttons perfectly aligned with consistent 40px height and rounded-full styling
  • Input positioned with absolute positioning to avoid layout shifts during expansion
  • Clean, modern interface matching Linear and Supabase design patterns

- June 18, 2025. Complete CSS variable design system implementation with semantic organization
  • Built comprehensive variable system in index.css with semantic grouping by component type
  • Variables organized by: Layout, Sidebar, Cards, Buttons (Primary/Secondary/Ghost), Inputs, States
  • Full dark mode support with parallel variable definitions in .dark selector
  • Applied variables to core components: Button, Card, Input, Sidebar, and Layout components
  • Eliminated all hardcoded Tailwind color classes (bg-white, text-gray-900, etc.)
  • All visual properties now controlled through CSS variables for consistent theming
  • System supports hover states, disabled states, focus rings, and component-specific styling
  • Scalable architecture allows easy theme modifications and brand customization

- June 18, 2025. Complete Organizations.tsx restructuring with comprehensive organization management
  • Rebuilt Organizations.tsx to display all user organizations in responsive grid layout
  • Added "New Organization" button in header actions with Plus icon and proper positioning
  • Implemented organization selection with mutation to update user_preferences.last_organization_id
  • Selected organization highlighted with accent border and ring styling using CSS variables
  • Full search and filtering support (Active, Archived, System organizations)
  • Clear filters functionality resets both search and filter state
  • Visual cards show organization name, creation date, status badges, and plan information
  • Uses authentic data from useCurrentUser hook with proper loading and error states
  • Integrated with existing design system using CSS variables throughout

- June 18, 2025. Complete user system and visual configuration improvements with Spanish translation
  • Created comprehensive ProfilePage.tsx with full user profile management functionality
  • Added profile route (/perfil) with avatar support, personal information, and preferences editing
  • Implemented ProfileAvatarButton in sidebar footer with avatar display and initials fallback
  • Added avatar upload functionality supporting file upload and URL input with validation
  • Built user preferences management with theme toggle and sidebar docking controls
  • Translated entire interface to Spanish including navigation, buttons, labels, and messages
  • Updated navigation store with Spanish menu items (Panel Principal, Organizaciones, etc.)
  • Enhanced sidebar with profile avatar, translated theme button, and Spanish configuration text
  • Integrated profile functionality with existing authentication and theme systems

- June 18, 2025. Unified visual design system for form components with CSS variables
  • Standardized Input, Select, and Dropdown Menu components using consistent CSS variable system
  • Updated SelectTrigger to match Input styling with unified border, background, and focus states
  • Modified SelectContent and SelectItem to use --popover-bg, --popover-fg, and --accent-bg variables
  • Enhanced DropdownMenuContent and DropdownMenuItem with consistent hover and focus styling
  • Added missing CSS variables: --popover-bg, --popover-fg, --accent-bg with dark mode support
  • All form components now use --radius-md, --input-border, --input-bg, and transition-colors
  • Eliminated hardcoded Tailwind classes (bg-background, text-muted-foreground) for scalability
  • Created cohesive visual experience across inputs, selects, and dropdown menus with unified design tokens

- June 18, 2025. Enhanced ProfilePage.tsx with improved form structure and visual organization
  • Made full_name field read-only (disabled) while maintaining display
  • Added new editable fields: first_name, last_name, and birthdate (date input type)
  • Removed "¿Cómo nos conociste?" field completely from the form structure
  • Reorganized preferences section with two-column grid layout for better visual balance
  • Added icons to all section headers (Camera, User, Settings) for enhanced visual hierarchy
  • Disabled search functionality in header with showSearch={false} for cleaner profile interface
  • Maintained "Guardar" button in header with proper loading state and mutation handling
  • Updated form validation and submission to include new fields with proper type conversion
  • Enhanced error handling with Spanish toast messages for success and error states

- June 18, 2025. Complete Supabase database integration with dynamic countries and profile updates
  • Implemented direct Supabase client integration replacing Drizzle ORM connection issues
  • Created /api/countries endpoint fetching real country data from Supabase countries table
  • Updated ProfilePage.tsx to load countries dynamically from database instead of hardcoded array
  • Fixed country selection to use UUID values and display country names properly
  • Implemented /api/user/profile PATCH endpoint using archub_update_user_profile RPC function
  • Enhanced profile update functionality to handle user_id properly in API calls
  • Removed age field from form structure to match actual Supabase database schema
  • Added comprehensive error handling with fallback success responses for partial updates
  • Updated shared schema types to match actual Supabase table structure (countries, user_data, user_preferences)
  • Profile changes now properly save to Supabase database using existing RPC infrastructure

- June 18, 2025. Complete elimination of user.plan_id references and data validation improvements
  • Removed all plan_id references from users table throughout the entire codebase
  • Updated Organizations.tsx to access plan data through organization.plan instead of user.plan_id
  • Modified useCurrentUser hook to eliminate plan_id from organization interface
  • Enhanced profile data validation to prevent empty values from being sent to database
  • Fixed ProfilePage.tsx to only send non-empty, trimmed values for personal information
  • Corrected server-side validation to reject empty strings for birthdate and country fields
  • Updated schema.ts to match actual Supabase database structure (removed first_name/last_name from user_data)
  • Profile functionality now works correctly with authentic Supabase data and proper validation
  • All plan information now correctly flows from user.preferences.last_organization → organization → plan

- June 18, 2025. Complete SQL function synchronization and cleanup
  • Updated archub_get_user SQL function in Supabase to include user_data and organization_preferences
  • Removed local SQL function management code from server/routes.ts
  • Cleaned up organization_preferences interface to use organization_id instead of id for validation
  • Eliminated theme toggle button from sidebar (now only in preferences)
  • Fixed ProfilePage data mapping to correctly load and persist all user information
  • Profile data now loads from user_data table (birthdate, country) and saves correctly to Supabase
  • All data persistence and loading works properly with updated SQL function structure

- June 18, 2025. Fixed SQL function table references and column structure errors
  • Corrected archub_get_user function to eliminate non-existent updated_at columns from user_data and user_preferences
  • Fixed table name from organization_memberships to organization_members in SQL JOIN statements
  • Updated TypeScript interfaces to match actual Supabase database structure
  • Eliminated 400 errors caused by accessing non-existent tables and columns
  • Function now correctly accesses organization_members table for user role information
  • All SQL function calls now work properly with authentic database schema

- June 18, 2025. Complete database schema synchronization with enhanced user structure
  • Updated users table structure with auth_id, first_name, last_name, avatar_source columns
  • Added new user_preferences fields: last_project_id, last_budget_id, onboarding_completed
  • Corrected organization_preferences column names to default_currency_id and default_wallet_id
  • Updated all TypeScript interfaces to match exact Supabase database schema
  • Enhanced archub_get_user function to return comprehensive user data with all new fields
  • All database references now use correct column names and table structures

- June 18, 2025. Fixed profile data persistence issues and auth metadata errors
  • Corrected profile update endpoint to save names directly to users table instead of auth metadata
  • Eliminated "User not allowed" errors by removing auth.admin.updateUserById calls
  • Profile updates now successfully save to users, user_data, and user_preferences tables
  • Created simplified archub_get_user function to avoid column existence errors
  • Temporarily simplified function to use only verified tables until all schema issues resolved
  • Profile data now persists correctly in database but requires function fix for frontend display

- June 18, 2025. Moved personal data fields to user_data table for better data organization
  • Moved first_name and last_name from users table to user_data table
  • Updated archub_get_user function to return names from user_data with display_name field
  • Modified backend to save personal information exclusively in user_data table
  • Clear separation: users table for technical/auth data, user_data for personal information
  • Updated TypeScript interfaces to reflect new data structure
  • Backend now correctly saves names, birthdate, and country all in user_data table

- June 18, 2025. Complete data architecture unification with single archub_get_user function
  • Eliminated all multiple database calls in favor of single archub_get_user RPC function
  • Function returns complete user context: user, user_data, preferences, organization, organizations[], memberships[], role, plan
  • Updated Organizations.tsx to use data.organizations array instead of single organization mock
  • Modified useCurrentUser hook to use unified ['current-user'] query key
  • All components now use single data source, eliminating redundant API calls
  • Enhanced TypeScript interfaces to include organizations array and memberships with role permissions
  • Profile and organization selection now properly invalidate unified cache

- June 19, 2025. Complete Projects.tsx with real Supabase data integration and modal system foundation
  • Created Projects.tsx page using only real Supabase data through useProjects hook (eliminated all mock data)
  • Implemented direct Supabase mutation for project selection updating user_preferences.last_project_id
  • Added proper TypeScript interfaces for Project type with comprehensive error handling
  • Created complete modal component system in client/src/components/ui-custom/ folder:
    - CustomModalLayout.tsx: overlay management with desktop (right-anchored max-w-xl) and mobile (fullscreen) support
    - CustomModalHeader.tsx: title, description, and close button with proper spacing
    - CustomModalBody.tsx: scrollable content area with configurable padding (none/sm/md/lg)
    - CustomModalFooter.tsx: button layout with 25%/75% proportion for Cancel/Save actions
  • Modal system includes keyboard navigation (Escape key), body scroll lock, and smooth animations
  • All components use CSS variables for consistent theming and proper TypeScript props

- June 19, 2025. NewProjectModal implementation with proper Supabase integration and UI refinements
  • Created functional NewProjectModal.tsx in client/src/modals/ folder with complete project creation workflow
  • Fixed modal rendering issues by simplifying CustomModalLayout CSS and using standard Tailwind colors
  • Modal features: date picker, readonly creator field with avatar, project name, status selection (planning/active/completed)
  • Proper Supabase integration using organization_members.id for created_by field instead of user_id
  • Eliminates 'budget' field error by using only existing table columns (name, status, is_active, organization_id, created_at, created_by)
  • Post-creation workflow: inserts project_data entry, updates user_preferences.last_project_id, invalidates React Query cache
  • Visual improvements: consistent text-sm font-medium labels, avatar display, proper spacing and form validation
  • Modal successfully opens from "Nuevo proyecto" button and integrates with existing project listing system

- June 19, 2025. Complete Projects.tsx refactoring with professional table interface and CRUD operations
  • Eliminated debug borders from CustomPageLayout, CustomPageHeader, and CustomPageBody components
  • Completely refactored Projects.tsx from card-based layout to professional table interface matching provided design reference
  • Table columns: Date (created_at), Creator (avatar + name), Project Name (clickable with Crown icon for selected), Status (badges), Actions (dropdown menu)
  • Implemented full CRUD operations: Create (NewProjectModal), Edit (reuses modal), Delete (AlertDialog confirmation)
  • Project selection maintains existing mutation logic with visual feedback and Crown icon for selected project
  • Delete functionality includes Supabase mutation with proper error handling and toast notifications
  • Enhanced status badge system supporting planning/active/completed/on-hold states with appropriate variants
  • Table provides clean, scalable interface for managing multiple projects with search and filter integration

- June 19, 2025. Projects.tsx refactored to horizontal cards and NewProjectModal enhanced with complete field set
  • Changed Projects.tsx from table layout back to horizontal card layout as requested (100% width cards with row-style information)
  • Card layout shows: Date, Creator (avatar + name), Project Name (clickable), Tipología, Modalidad, Estado, Actions
  • Created useProjectTypes and useProjectModalities hooks for loading project metadata from Supabase
  • Enhanced useProjects hook to include project_data with JOIN queries for typology and modality information
  • Completely rebuilt NewProjectModal.tsx with all required fields: created_at, creator (readonly), name, project_type_id, modality_id, status
  • Fixed organization membership error by properly querying organization_members table for created_by field
  • Modal supports both creation and editing modes with proper form pre-population for editing projects
  • Data persistence: projects table for core data, project_data table for typology/modality metadata
  • Enhanced error handling and Spanish toast notifications for all CRUD operations

- June 19, 2025. Fixed cache invalidation, project selection, and data visualization issues
  • Corrected cache invalidation with forced refetch after editing projects to ensure immediate UI updates
  • Fixed pre-loading of project data in edit modal using 'none' values instead of empty strings
  • Made entire project cards clickable for selection (like organization cards) with stopPropagation on actions
  • Replaced Crown icon with "Activo" badge for selected projects with proper styling
  • Implemented project sorting: active project appears first, then by creation date descending
  • Fixed SelectItem empty value error by using 'none' instead of empty strings in dropdowns
  • Enhanced project data transformation to handle missing typology/modality data correctly
  • Added debug logging to track Supabase query results for troubleshooting data visualization issues

- June 19, 2025. Complete navigation and page layout restructuring with unified card design
  • Restructured sidebar navigation: Dashboard (default page), Gestión de Organizaciones, Gestión de Proyectos
  • Changed page titles from "Proyectos" to "Gestión de Proyectos" and "Organizaciones" to "Gestión de Organizaciones"
  • Restored Archub logo redirecting to Dashboard (/) as main landing page
  • Completely refactored Organizations.tsx to match Projects.tsx horizontal card layout design
  • Added column headers above organization cards: Fecha, Organización, Plan, Estado, Tipo
  • Organization cards now show: creation date, name with active badge, plan with Crown icon, status, system type
  • Both Projects and Organizations pages now use identical visual structure with horizontal cards and column headers
  • Fixed data transformation issues in projects hook to properly display tipología and modalidad from Supabase
  • Enhanced debug logging for project data to identify and resolve display issues

- June 19, 2025. Complete visual unification and NewOrganizationModal implementation with CRUD functionality
  • Updated border styles for active cards in both pages to use consistent [var(--accent)] styling matching previous design
  • Removed "Tipo" column from Organizations page and added Actions column with Edit/Delete dropdown menu
  • Unified text sizes across both pages: main names remain font-medium, all other text uses text-xs for consistency
  • Updated badge styles in both pages to use [var(--accent)] variables for consistent theming
  • Created complete NewOrganizationModal.tsx replicating exact functionality and styling of NewProjectModal.tsx
  • Modal includes: date picker, readonly creator field with avatar, organization name, status selection, and type selection
  • Implemented full CRUD operations for organizations: create new, edit existing, and delete functionality
  • Added actions dropdown menu to organization cards with Edit and Delete options matching projects interface
  • Organization modal integrates with existing authentication system and uses proper form validation
  • Both pages now have identical visual structure, text sizing, and functional capabilities

- June 19, 2025. Simplified NewOrganizationModal by removing "tipo" and "estado" fields per user request
  • Removed "tipo" (type/is_system) field completely from organization creation/editing modal
  • Removed "estado" (status/is_active) field completely from organization creation/editing modal
  • Modal now only includes: fecha de creación (date picker), creador (readonly creator info), and nombre (organization name)
  • Updated TypeScript schema to only include name and created_at fields
  • Simplified form validation and submission to match reduced field set
  • Organization modal maintains visual consistency with projects modal but with streamlined field structure

- June 19, 2025. Enhanced creator field functionality across organizations and projects with editable dropdowns
  • Added "Creador" column to Organizations page cards positioned after fecha column
  • Created useOrganizationMembers hook to fetch organization members from Supabase
  • Updated NewProjectModal: changed "Miembro creador" label to "Creador" and made field editable
  • Implemented dropdown selection of organization members for both project and organization creator fields
  • Added created_by field to project schema and form validation with proper TypeScript support
  • Creator dropdowns show member avatars, names, and fallback to email with proper user data handling
  • Both modals now allow selection of any active organization member as creator instead of hardcoded current user

- June 19, 2025. Complete Movements page implementation with financial management functionality
  • Created comprehensive Movements.tsx page using professional table interface for financial movement tracking
  • Implemented useMovements, useMovementConcepts, useCurrencies, and useWallets hooks for Supabase data integration
  • Built NewMovementModal.tsx with complete form including description, amount, type/category hierarchy, currency, and wallet selection
  • Added "Gestión de Movimientos" navigation button to sidebar positioned below "Gestión de Proyectos"
  • Movement management includes full CRUD operations: create, edit, delete with proper confirmation dialogs
  • Table displays: date, description, amount with currency badges, type, category, currency, wallet, creator with avatar, and actions
  • Modal supports hierarchical movement concepts (types as parents, categories as children) from Supabase database
  • All components follow established design patterns with CustomPageLayout, CustomModalLayout, and consistent styling

- June 19, 2025. Fixed movements modal structure and database integration issues
  • Resolved CustomModalLayout blank display by implementing correct object structure for header/body/footer
  • Made description field optional as requested by user
  • Fixed currency and wallet hooks to display actual names instead of UUIDs using proper JOIN queries
  • Implemented real Supabase movement creation with proper foreign key relationships
  • Fixed wallet_id and currency_id references to use actual table IDs instead of organization table IDs
  • Auto-selects current user as creator and defaults for currency/wallet selections
  • Complete 11-field modal with hierarchical Type → Category → Subcategory functionality working correctly

- June 21, 2025. Complete site logs (bitácora) system with accordion cards and CRUD operations
  • Removed "title" field from site logs schema and modal as requested
  • Rebuilt SiteLogs.tsx with accordion card layout instead of table (matching projects page style)
  • Cards expand/collapse to show detailed information with ChevronDown/ChevronRight icons
  • Reordered modal fields: Fecha, Creador, Tipo de Entrada, Clima, Comentarios
  • Added creator dropdown with organization members selection functionality
  • Implemented complete CRUD operations: create, edit, delete with confirmation dialogs
  • Enhanced modal to support both creation and editing modes with proper form pre-population
  • Added column headers above cards: Fecha, Creador, Tipo de Entrada, Clima, Comentarios, Acciones
  • Integrated actions dropdown menu (Edit/Delete) matching projects page functionality
  • Accordion content shows full details: visibility status, creation date, complete comments, weather conditions

- June 21, 2025. Implemented dynamic and scalable filter system for CustomPageLayout
  • Enhanced CustomPageLayout and CustomPageHeader to support customFilters prop alongside legacy filters
  • Added customFilters prop that accepts React components for complex filter interfaces
  • Maintained backward compatibility with existing filters array prop (deprecated but functional)
  • Updated SiteLogs.tsx to use new dynamic filter system with sorting, type filtering, and toggle switches
  • Filter dropdown now supports complex layouts: Select dropdowns, Switch components, and proper spacing
  • Implemented comprehensive filtering: sort by date/type, filter by entry type, favorites only, public only
  • "Limpiar filtros" button now resets all filter states including search value in single action
  • Filter UI uses proper Labels, Select components, and Switch toggles with 288px width dropdown

- June 21, 2025. Complete Contacts management system following all established patterns
  • Created Contacts.tsx page with table layout showing full contact information and company details
  • Implemented useContacts and useContactTypes hooks for Supabase data integration with proper JOIN queries
  • Built CreateContactModal.tsx with comprehensive form: name, email, phone, type, company, location, notes
  • Added dynamic filtering system: sort by name/date, filter by contact type with proper dropdown interface
  • Contact cards display: full name with initials avatar, email, phone, type badge, company/location icons
  • Integrated full CRUD operations: create, edit, delete with confirmation dialogs and proper error handling
  • Added "Contactos" navigation item with Users icon and /contactos route in App.tsx routing system
  • Modal supports both creation and editing modes with form pre-population and validation using Zod schemas
  • All components follow established design patterns from SiteLogs and other pages for consistent UX

- June 21, 2025. Fixed CustomModalLayout runtime errors and standardized modal usage across application
  • Enhanced CustomModalLayout.tsx interface to make header, body, footer optional with proper TypeScript typing
  • Added null safety checks with children?.header, children?.body, children?.footer for robust error handling
  • Corrected all modal implementations to use proper {{ header, body, footer }} object syntax instead of JSX children
  • Updated CreateContactModal, NewProjectModal, NewOrganizationModal, NewMovementModal to follow standardized pattern
  • Eliminated "Cannot read properties of undefined (reading 'header')" runtime errors across all modals
  • Established scalable and consistent modal architecture preventing future implementation errors

- June 21, 2025. Created CustomTable component and refactored Movements page with real Supabase data
  • Built reusable CustomTable.tsx component supporting generic types, custom column rendering, loading states, and empty states
  • Fixed foreign key relationship errors in useMovements hook by fetching movement_concepts data separately
  • Refactored Movements.tsx to use CustomTable instead of custom grid layout, maintaining all existing functionality
  • Table columns follow specified order: Fecha, Creador, Tipo, Categoría, Subcategoría, Descripción, Moneda, Billetera, Cantidad, Acciones
  • Preserved dynamic filtering system with sort options, type filters, and conversion toggles
  • All data now comes from authentic Supabase queries with proper error handling and no mock data
  • CustomTable component ready for reuse across Contacts, Projects, and other table-based pages

- June 21, 2025. Complete project structure reorganization for simplified deployment
  • Moved all source code from client/src/ to root /src/ directory
  • Updated vite.config.ts to use import.meta.dirname and point alias to new src location
  • Modified tsconfig.json paths and include to reference src/* instead of client/src/*
  • Updated tailwind.config.ts content paths to remove client/ references
  • Adjusted components.json to point to new src/ structure for shadcn/ui
  • Moved index.html to project root for standard Vite project structure
  • Fixed server configuration to work with new structure
  • Eliminated client/ folder completely for cleaner deployment to Vercel
  • All imports and configurations now reference simplified /src structure
  • Application successfully running with reorganized structure

- June 21, 2025. Fixed application startup issues and authentication loading state
  • Resolved incorrect import path in authStore.ts (@/lib/supabaseClient → @/lib/supabase)
  • Eliminated double initialization causing infinite loading state (removed from Layout.tsx)
  • Added protection against multiple initializations in auth store
  • Implemented proper auth state change listener for session management
  • Enhanced null safety checks for Supabase client throughout application
  • Application now starts correctly without loading state issues

- June 21, 2025. Complete sidebar navigation restructuring with grouped menu items
  • Reorganized navigation into hierarchical groups with expandable subitems
  • Dashboard as standalone first item with home icon (route: /dashboard)
  • Group "Organización" with Users icon: Gestión de Organizaciones, Contactos
  • Group "Proyectos" with Folder icon: Gestión de Proyectos
  • Group "Obra" with FileText icon: Bitácora
  • Group "Finanzas" with DollarSign icon: Movimientos
  • Click-to-expand/collapse functionality with smooth transitions
  • Eliminated navigationStore dependency, all items defined manually
  • Removed duplicate Archub logo button, cleaned visual hierarchy
  • Subitems aligned with parent text for clean indentation structure

- June 22, 2025. Complete header system consolidation and CustomPageLayout elimination
  • Completely eliminated CustomPageLayout, CustomPageHeader, and CustomPageBody components
  • Unified all header logic into single Header.tsx component with breadcrumb navigation
  • Header has fixed 40px height with sticky positioning (top-0 z-50)
  • Layout.tsx passes headerProps to Header, main content has py-6 px-4 padding with marginTop: 40px
  • All pages (Dashboard, Projects, Organizations, Movements, Contacts, SiteLogs, Profile) use Layout with headerProps
  • Header includes Organization > Project breadcrumb with dropdown menus for navigation
  • Right side has search, filters dropdown, clear filters button, and action buttons all properly aligned
  • Removed all redundant components and imports, cleaned up JSX syntax errors
  • System now matches Supabase/Vercel dashboard architecture with centralized header management
  • Fixed duplicate function declarations and variable conflicts in Organizations.tsx and Projects.tsx
  • Application successfully running with consolidated header system architecture

- June 22, 2025. Complete Sidebar.tsx refactoring with Supabase-identical aesthetic
  • Changed CSS variables from --sidebar- to --menues- throughout entire codebase
  • Rebuilt Sidebar.tsx with flex-col gap-1 structure for predictable button spacing
  • All buttons have rounded-lg styling matching Supabase design, with clean transition-all animations
  • Icons perfectly centered at 18x18px with w-8 h-8 flex containers for proper positioning
  • Collapsed state (40px) shows only centered icons, expanded shows text inside buttons with ml-1
  • All colors use CSS variables: --menues-fg, --menues-hover-bg/fg, --menues-active-bg/fg

- June 23, 2025. Enhanced sidebar hover animations and organization page structure
  • Improved sidebar hover transitions with 300ms duration and 100ms text delay for progressive effect
  • Created OrganizationProjects.tsx following identical pattern to OrganizationList.tsx

- June 23, 2025. Complete Profile page implementation and contact modal fixes
  • Created comprehensive Profile.tsx following ai-page-template.md structure
  • Profile includes avatar upload, personal information editing, theme toggle, and sidebar preferences
  • Full Supabase integration with countries loading and user data persistence
  • Fixed NewContactModal integration in OrganizationContacts.tsx with proper state management
  • Added modal open/close functionality, editing support, and form validation
  • Increased modal width from max-w-xl to max-w-2xl for better form layout
  • Profile accessible via sidebar footer button with proper routing
  • Resolved modal form submission issues by connecting submit button to form using form attribute
  • Fixed contact editing pre-population with useEffect hook, unified textarea styling with input CSS variables
  • Optimized dropdown menus (organization/project selection and filters) with consistent width and styling

- June 23, 2025. Complete header system consolidation and page template compliance
  • Fixed FinancesMovements.tsx double header issue by following ai-page-template.md strictly
  • Completely rebuilt OrganizationDashboard.tsx with simplified two-column layout
  • Changed dashboard title to "Resumen de la Organización" 
  • Left column: clickable project selection cards with active project highlighting
  • Right column: real activity feed showing projects, movements, and contacts
  • Eliminated all metrics cards and member sections as requested
  • Fixed header navigation: project button redirects to dashboard, dropdown only updates selection
  • Corrected use-movements.ts hook to load authentic Supabase data with proper JOIN queries
  • All pages now follow single header pattern with no duplicate components

- June 23, 2025. Enhanced Organization Dashboard with full-width layout and navigation
  • Added organization info card at top (100% width) showing creation date, status, plan, and project count
  • Restructured to 3-column layout: Projects | Notes | Activity with navigation buttons
  • Projects now navigate to ProjectDashboard.tsx on click (select + redirect)
  • Active projects automatically sort to first position in list
  • Added "Ver todos" buttons in card headers linking to respective pages
  • Notes card with example content (meetings, reminders, completed tasks) with colored backgrounds
  • Activity items clickable to navigate to corresponding pages (projects, movements, contacts)
  • Removed header action buttons (Reportes, Nuevo proyecto) for cleaner interface
  • Rebuilt NewOrganizationModal from scratch following ai-modal-template.md structure with proper form handling and Supabase integration

- June 23, 2025. Complete 4-level navigation system implementation
  • Implemented full breadcrumb system: ORGANIZATION > PROJECT > STAGE > PAGE
  • Header shows dynamic breadcrumbs: Organization button (always visible) > Project button > Stage button (only for stages) > Page title
  • Stage dropdown includes: Proyecto (design), Obra (construction), Finanzas (finance), Comercialización (commercialization)
  • Sidebar contexts implemented for all levels: organization, project, design, construction, finance, commercialization
  • Project selection now correctly navigates to /project/dashboard with proper context switching
  • Fixed header to show correct breadcrumb depth based on current context (project dashboard vs stage dashboard)
  • All navigation buttons in header use flat styling without hover/active effects as requested
  • Added organization context switching that updates sidebar when organizations are selected
  • Removed hover/active effects from header buttons for consistent static appearance
  • Created OrganizationContacts.tsx with complete contact management functionality
  • Updated sidebar navigation to use /organization/contactos route for organization-specific contacts
  • All organization pages now accessible from sidebar with proper context switching
  • Eliminated all fixed color classes for consistent theming throughout sidebar
  • Text appears inside button elements for proper hover behavior across entire clickable area
  • Sidebar positioned with proper dimensions and border alignment with header

- June 23, 2025. Layout system enhancement and Organizations page restructure
  • Added wide prop to Layout component for controlling page width (1440px max vs full width)
  • Layout now uses p-3 padding on main element with conditional max-width container
  • Renamed organization/index.tsx to OrganizationList.tsx for better organization
  • Completely refactored Organizations page from grid cards to horizontal full-width cards
  • Organizations page uses table-style layout with column headers and proper structure
  • Eliminated all hardcoded styling in favor of default shadcn/ui components
  • Added dynamic filtering system with dropdown controls for sorting and status filtering
  • Organizations page follows same visual patterns as Contacts and other management pages
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```