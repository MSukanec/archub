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
- July 25, 2025. COMERCIALIZACIÓN AND POST VENTA BUTTONS ELIMINATED: Successfully removed COMERCIALIZACIÓN and POST VENTA buttons from desktop sidebar per user request - COMPLETED
  • DESKTOP SIDEBAR SIMPLIFIED: Removed comercializacion and post-venta entries from mainSidebarItems array in Sidebar.tsx
  • NAVIGATION STREAMLINED: Sidebar now shows only essential sections: Organización, Proyecto, Diseño, Construcción, Finanzas
  • UI CONSISTENCY MAINTAINED: All functionality preserved while eliminating unused commercial sections
  • CLEAN INTERFACE: Desktop sidebar navigation now focuses on core construction management features
- July 25, 2025. EMPTYSTATE BUTTONS COMPLETELY ELIMINATED: Successfully removed all action buttons from EmptyState components across entire application per user request - COMPLETED
  • CONSTRUCTION PAGES CLEANED: Removed buttons from ConstructionLogs, ConstructionAttendance, and ConstructionGallery EmptyState components
  • PROJECT PAGES SIMPLIFIED: Eliminated buttons from ProjectDocumentation EmptyState
  • ORGANIZATION PAGES STREAMLINED: Removed action buttons from OrganizationProjects and OrganizationContacts EmptyState components
  • ADMIN PAGES UPDATED: Cleaned AdminTaskParameters EmptyState of action buttons
  • DESIGN PAGES MODERNIZED: Removed buttons from DesignDashboard EmptyState
  • BUDGETTABLE SIMPLIFIED: Eliminated "Agregar Tarea" button from BudgetTable EmptyState component
  • ACTIONBAR-ONLY WORKFLOW: All user actions now exclusively flow through ActionBarDesktop components instead of EmptyState buttons
  • CONSISTENT UX PATTERN: EmptyState components now serve purely informational purpose while ActionBar handles all user interactions
- July 25, 2025. PROJECT RESTRICTION APPLIED TO ATTENDANCE BUTTONS: Successfully added general_mode restriction to "REGISTRAR ASISTENCIA" button preventing use without project selection - COMPLETED
  • ATTENDANCE ACTIONBAR RESTRICTED: Applied primaryActionRestriction with reason="general_mode" to "Registrar Asistencia" button in ConstructionAttendance.tsx ActionBar
  • ATTENDANCE EMPTYSTATE RESTRICTED: Applied CustomRestricted wrapper to "Registrar Asistencia" button in EmptyState component
  • RESTRICTION CONSISTENCY: Both attendance registration buttons now follow same restriction pattern as bitácora buttons
  • PROJECT VALIDATION ENFORCED: Users must select a project before being able to register attendance data
  • PROPER ERROR MESSAGING: Restriction popover shows appropriate message about project requirement for attendance functionality
- July 25, 2025. PROJECT RESTRICTION APPLIED TO BITÁCORA BUTTONS: Successfully added general_mode restriction to "NUEVA BITÁCORA" button preventing use without project selection - COMPLETED
  • ACTIONBAR RESTRICTION ENHANCED: Extended ActionBarDesktop component with primaryActionRestriction prop supporting reason, feature, current, and functionName parameters
  • BITÁCORA BUTTON RESTRICTED: Applied reason="general_mode" restriction to primary action button in ConstructionLogs.tsx ActionBar
  • EMPTYSTATE BUTTON RESTRICTED: Applied same restriction to "Crear Primera Entrada" button in EmptyState component
  • RESTRICTION INTERFACE IMPLEMENTED: Added primaryActionRestriction interface to ActionBarDesktop for consistent restriction handling across all construction pages
  • CUSTOMRESTRICTED INTEGRATION: Wrapped primary button with CustomRestricted component to show proper restriction popover when no project selected
  • FUNCTIONALITY PRESERVED: All button functionality maintained while adding proper project selection requirement enforcement
- July 25, 2025. ACTIVITY PAGE ACTIONBAR AND USERSELECTOR REFINEMENT COMPLETED: Successfully implemented ActionBar system in Organization Activity page and refined UserSelector component - COMPLETED
  • ACTIVITY ACTIONBAR INTEGRATED: Added complete ActionBarDesktop to OrganizationActivity.tsx with search functionality and member filtering capabilities
  • BUTTON ELIMINATION: Removed "VER MOVIMIENTOS" button from EmptyState as requested - page now shows clean empty state without unnecessary actions
  • SEARCH AND FILTERS: Implemented search functionality and custom filters dropdown specifically for member filtering in activity tracking
  • SHOWPROJECTSELECTOR DISABLED: Set showProjectSelector={false} for organization-level page consistency with other org pages
  • USERSELECTOR SIMPLIFIED: Removed email display from UserSelector component - now shows only icon and name as specified
  • INTERFACE CLEANUP: Updated TypeScript interface to remove email field and simplified dropdown options to display only essential user information
  • MOBILE FEATUREINTRODUCTION: Maintained mobile-only FeatureIntroduction with md:hidden while desktop uses ActionBar expandable features
  • FOUR FEATURE DESCRIPTIONS: Added comprehensive feature explanations covering activity registration, member filtering, advanced search, and temporal organization
- July 25, 2025. NAVIGATION REORDERING AND ORGANIZATION TASKS ACTIONBAR COMPLETED: Successfully repositioned DISEÑO below PROYECTO and implemented ActionBar system in organization tasks page - COMPLETED
  • MENU REORDERING: Changed navigation order in both mobile menu and desktop sidebar so DISEÑO appears after PROYECTO instead of after FINANZAS
  • MOBILE MENU SHADOWS: Applied complete shadow system (shadow-button-normal, hover:shadow-button-hover) to all mobile menu buttons including disabled states
  • ORGANIZATION TASKS RENAMED: Changed page title from "Tareas" to "Tareas para Hacer" throughout the application
  • ACTIONBAR INTEGRATION: Added comprehensive ActionBarDesktop to organization tasks page with search, features expansion, and action buttons
  • FEATURE DESCRIPTIONS: Implemented 4 detailed features covering Kanban organization, multiple boards, collaboration, and flexible content management
  • BUTTON STANDARDIZATION: Moved creation buttons from header to ActionBar for consistent UX across all pages
  • SHADOW CONSISTENCY: All mobile navigation buttons now match Button component shadow behavior with proper hover effects
- July 25, 2025. MOBILE HEADER STICKY POSITIONING AND FOOTER SIMPLIFICATION COMPLETED: Fixed header positioning and streamlined mobile footer selector - COMPLETED
  • STICKY HEADER POSITIONING: HeaderMobile now uses sticky top-0 z-50 positioning to anchor at top of screen
  • LAYOUT COMPENSATION: Added pt-16 to main content area to account for sticky header height, while preserving md:pt-6 for desktop
  • BUTTON ALIGNMENT PERFECTED: HeaderMobile menu button and MobileMenu close button now use identical styling (p-2, w-5 h-5 icons)
  • ORGANIZATION BUTTON ELIMINATED: Removed organization selector button from mobile footer as requested
  • PROJECTS BUTTON FULL WIDTH: Project selector now occupies 100% width in footer instead of 50% grid layout
  • USERSELECTOR COMPONENT CREATED: Built new UserSelector.tsx component following specifications for future implementation
  • MOBILE FOOTER SIMPLIFIED: Changed from grid-cols-2 to single full-width project selector button
  • CONTENT SCROLL OPTIMIZED: Main content now scrolls below fixed header instead of overlapping
  • VISUAL CONSISTENCY MAINTAINED: Both header buttons use same dimensions and positioning for perfect alignment
- July 25, 2025. MOBILE MENU CRITICAL BUG RESOLVED AND UI ENHANCEMENTS COMPLETED: Successfully fixed mobile menu closing issue and implemented section titles with popover sizing - COMPLETED
  • DUPLICATE MENU ELIMINATION: Found and eliminated duplicate MobileMenu component rendering from HeaderMobile.tsx - menu was being rendered twice causing close malfunction
  • MOBILE MENU CLOSING FIXED: Menu now closes correctly when clicking X button or navigating to pages after removing component duplication
  • SECTION TITLES IMPLEMENTED: Added dynamic section titles at top of mobile menu ("Menú Principal", "Perfil", "Organización", "Proyecto", "Construcción", etc.)
  • POPOVER SIZING ENHANCED: Organization and Project selector popovers in mobile menu footer now occupy half screen height (h-[50vh]) instead of small max-h-48
  • HEADER.TSX CLEANUP: Removed unused Header.tsx component from desktop layout after confirming no dependencies
  • MOBILE BUTTON POSITIONING: Mobile menu button properly positioned on right side of header with Menu icon for easy access
  • HEADER STYLING SYNCHRONIZED: HeaderMobile.tsx and HeaderDesktop.tsx now use same border color (var(--menues-border)) and padding (px-4) as MobileMenu for visual consistency
  • TITLE STYLING IMPROVED: Mobile header title positioned left with font-normal (no bold) for cleaner appearance
  • CLEAN ARCHITECTURE: Separated mobile (HeaderMobile.tsx + MobileMenu.tsx) and desktop (HeaderDesktop.tsx) header systems for better maintainability
- July 25, 2025. PLAN BADGES STANDARDIZATION AND ACTIVE CARD FIXES COMPLETED: Successfully fixed hardcoded badges, implemented consistent plan styling, and restored member avatars display - COMPLETED
  • HARDCODED BADGE FIXED: Removed hardcoded "Free" badge from active organization card, now uses real data from userData.organization.plan?.name
  • PLAN BADGE CONSISTENCY: Standardized all plan badges across ProfileOrganizations and AdminOrganizations to use same CSS variables (--plan-free-bg, --plan-pro-bg, --plan-teams-bg)
  • ADMIN ORGANIZATIONS UPDATED: Plan column in admin page now uses consistent badge styling with CSS variables instead of variant-based colors
  • MEMBER AVATARS RESTORED: Fixed null-safety issues in ActiveOrganizationMembersCard component and integrated useOrganizationMembers hook for real data
  • VISUAL HIERARCHY IMPROVED: Active organization card now shows member avatars above plan badge above "ACTIVA" status badge in proper vertical alignment
  • CROWN ICONS MAINTAINED: All plan badges consistently display Crown icon with appropriate background colors matching design system
- July 25, 2025. ORGANIZATION ACTIVE CARD MEMBER AVATARS ENHANCED: Successfully added larger member avatars to the active organization card with improved visual hierarchy - COMPLETED
  • ACTIVE CARD AVATARS: Added ActiveOrganizationMembersCard component displaying member avatars at w-12 h-12 (double size of row avatars)
  • VISUAL POSITIONING: Positioned avatars above badge area on right side of active organization card for better visual balance
  • ENHANCED SIZE DISPLAY: Shows up to 4 member avatars with +N counter for additional members, using larger font sizing for improved readability
  • LAYOUT REORGANIZATION: Restructured card layout with flex-col items-end for proper avatar placement above plan and status information
  • BORDER STYLING: Member avatars use card background color border (--card-bg) for seamless integration with card design
- July 25, 2025. PROFILE ORGANIZATIONS PAGE STANDARDIZATION COMPLETED: Successfully implemented ActionBar system, uniform column layout, and enhanced member avatar display - COMPLETED
  • ACTIONBAR INTEGRATION: Added ActionBarDesktop to ProfileOrganizations with "Gestión de Organizaciones" title, Building icon, and 4 detailed features about administration, members, plans, and analytics
  • COLUMN STANDARDIZATION: Changed from grid-cols-10 (5 cols for organization name) to grid-cols-6 with equal width distribution for all columns
  • MEMBER AVATARS ENHANCED: Updated member display to show actual avatar images when available (member.avatar_url) with fallback to initials, maintaining overlapped styling with -space-x-1
  • ACTION SIMPLIFICATION: Replaced dropdown menu with single Edit button, removed Delete action per user request for cleaner interface
  • CHAT BUTTON UPDATED: Changed "Chatear con nosotros" button from variant="outline" to variant="secondary" for better visual consistency
  • PLAN BADGES MAINTAINED: Plan column continues to use Badge components with Crown icon for Teams plans and outline variant for "Sin plan"
- July 25, 2025. PROFILE PAGE UI RESTRUCTURING COMPLETED: Successfully implemented ActionBar, moved plan card to organizations, and removed white background from mode card - COMPLETED
  • ACTIONBAR INTEGRATION: Added ActionBarDesktop component to ProfileBasicData.tsx with title "Mi Perfil" and UserCircle icon (no project selector or ghost buttons)
  • PLAN CARD RELOCATION: Moved plan information card from ProfileBasicData to ProfileOrganizations page as the first element after space-y-6 container
  • CARD STYLING MODERNIZATION: Removed white background (bg-[var(--card)]) from "Modo de uso actual" card to match "Cerrar Sesión" card styling
  • PROFILE SECTION PRIORITIZATION: Eliminated plan card divider from profile page so profile section appears immediately after ActionBar and FeatureIntroduction
  • ORGANIZATION PAGE ENHANCEMENT: Plan card now appears at top of organization management page with proper spacing and existing functionality
  • CONSISTENT VISUAL STYLING: Both profile action cards now have same transparent styling matching overall design system
- July 25, 2025. PROFILE ROUTES REORGANIZATION AND HEADER HIDDEN: Successfully restructured profile navigation with proper nested routes and UI simplification - COMPLETED
  • HEADER TEMPORARILY HIDDEN: Concealed header component in Layout.tsx while preserving it for potential restoration if needed
  • REDUCED TOP PADDING: Adjusted main content padding from md:pt-12 to md:pt-6 to accommodate header removal and provide cleaner layout
  • PROFILE ROUTES RESTRUCTURED: Changed "Datos Básicos" route from /profile to /profile/data for better organization
  • ORGANIZATION MANAGEMENT RELOCATED: Moved OrganizationList.tsx to src/pages/profile/ProfileOrganizations.tsx with route /profile/organizations
  • PROFILE SIDEBAR ENHANCED: Added "Gestión de Organizaciones" button below preferences in desktop SidebarSubmenu.tsx pointing to /profile/organizations
  • MOBILE PROFILE SUBMENU: Created complete profile submenu in MobileMenu.tsx with proper nested routes structure
  • MOBILE NAVIGATION IMPROVED: Changed profile button from direct navigation to submenu expansion using handleMenuItemClick('perfil', '/profile')
  • CONSISTENT ROUTING: All profile routes now follow /profile/* pattern for better URL organization
  • LSP ERRORS FIXED: Corrected member data access and null safety issues in ProfileOrganizations.tsx
  • UI SIMPLIFICATION: Interface now relies on ActionBar as primary navigation control with simplified layout structure
- July 24, 2025. TERMINOLOGY UPDATE OBRA TO CONSTRUCCIÓN COMPLETED: Successfully updated all references from "Obra" to "Construcción" throughout the application for consistent terminology - COMPLETED
  • SIDEBAR NAVIGATION: Updated desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx to show "Construcción" instead of "Obra" in main menu
  • SUBMENU LABELS: Changed "Resumen de Obra" to "Resumen de Construcción" in both desktop and mobile submenus
  • HEADER BREADCRUMBS: Updated Header.tsx breadcrumb navigation to display "Construcción" instead of "Obra" in stage selector
  • DROPDOWN MENUS: Fixed both stage selector dropdowns in header to show "Construcción" option instead of "Obra"
  • PAGE TITLES: Updated ConstructionDashboard.tsx header title from "Resumen de Obra" to "Resumen de Construcción"
  • FEATURE DESCRIPTIONS: Changed ConstructionLogs.tsx FeatureIntroduction title from "Bitácora de Obra" to "Bitácora de Construcción"
  • CONTENT REFERENCES: Updated dashboard descriptions from "bitácora de obra" to "bitácora de construcción"
  • COMMENTS: Fixed code comments from "Estado de Obra" to "Estado de Construcción"
  • COMPREHENSIVE CHANGE: All UI elements, navigation, headers, breadcrumbs, and content now consistently use "Construcción" terminology
- July 24, 2025. CONSTRUCCIÓN ATTENDANCE ACTIONBAR POSITIONING FIXED: Moved ActionBar outside EmptyState conditional for consistent visibility - COMPLETED
  • ACTIONBAR REPOSITIONED: ActionBar component now appears BEFORE EmptyState conditional in ConstructionAttendance.tsx
  • ALWAYS VISIBLE: Users now have access to search, filters, and actions regardless of data availability on Asistencia page
  • CONSISTENT PATTERN: Attendance page now follows same ActionBar pattern as other construction pages (Tasks, Materials, Schedule, Logs)
  • ENHANCED UX: Filters and search functionality remain accessible even when no attendance data exists
- July 25, 2025. SITE LOG MODAL DATA LOADING AND PERSONAL SAVING SYSTEM FIXED: Successfully resolved issues with field pre-loading and personal data persistence - COMPLETED
  • DATA STRUCTURE NORMALIZATION: Fixed data loading issue by normalizing `data.data || data` structure for consistent modal field population
  • LOGGING ENHANCEMENT: Added comprehensive debug logging for form reset values and member selection tracking
  • PERSONAL DATA PERSISTENCE: Implemented complete site_log_attendees saving system with proper database insertion/updates
  • FORM DATA INTEGRATION: Enhanced onSubmit to include attendees, events, and equipment arrays in form submission
  • CREATOR FIELD STABILITY: Fixed intermittent creator field loading by improving member lookup and logging
  • ATTENDEES MANAGEMENT: Added proper attendees cleanup and insertion for site log updates with error handling
- July 25, 2025. ACTIONBAR STANDARDIZATION ACROSS TARGET PAGES COMPLETED: Successfully implemented full ActionBarDesktop structure with title, icon, and expandable features system across all requested pages - COMPLETED
  • CONSTRUCTION ATTENDANCE: Added complete ActionBar with "Control de Asistencia de Personal" title, Users icon, and 4 detailed features covering visual attendance tracking, worker type filters, productivity statistics, and flexible period controls
  • FINANCES MOVEMENTS: Enhanced ActionBar with "Gestión de Movimientos Financieros" title, DollarSign icon, and 4 comprehensive features explaining real-time tracking, Excel import, multi-currency conversions, and advanced search/filtering
  • FINANCES INSTALLMENTS: Implemented ActionBar with "Gestión de Aportes de Terceros" title, Receipt icon, and 4 detailed features covering client-specific contributions, multi-currency analysis, USD dollarization, and summary reports with performance metrics
  • FEATURE DESCRIPTIONS: All ActionBars now include detailed, descriptive feature explanations matching ConstructionBudgets.tsx pattern exactly
  • ICON INTEGRATION: Proper lucide-react icon imports added (BarChart3) to resolve missing dependencies and prevent console errors
  • CONSISTENT STRUCTURE: All ActionBars follow exact same architectural pattern: title + icon + features array + existing functionality preservation
- July 24, 2025. ADMIN USERS ACTIONBAR INTEGRATION AND MODAL SIMPLIFICATION COMPLETED: Successfully implemented ActionBarDesktop and simplified user editing modal - COMPLETED
  • ACTIONBAR IMPLEMENTATION: Added ActionBarDesktop component to AdminUsers page with search and custom filters functionality moved from header
  • HEADER SIMPLIFICATION: Removed search, filters, and actions from header, maintaining only title for clean layout
  • USER MODAL SIMPLIFICATION: Removed country, birthdate, and avatar_url fields from UserFormModal as requested by user
  • CREATION FUNCTIONALITY REMOVED: Eliminated "Nuevo Usuario" button and createUserMutation since user only needs editing capability
  • FORM STREAMLINED: Modal now only handles editing existing users with essential fields (full_name, email, first_name, last_name, is_active)
  • IMPORTS CLEANUP: Removed unused imports (Calendar, Popover, date-fns, countries query) for cleaner codebase
  • CONSISTENT PATTERN: AdminUsers page now follows same ActionBar pattern as other admin pages for unified UX
- July 24, 2025. TASK PARAMETER MODALS NOMENCLATURE UPDATE COMPLETED: Updated field labels across all task parameter modals to use consistent naming conventions - COMPLETED
  • MODAL FIELD LABELS STANDARDIZED: Changed "Etiqueta" → "Nombre (visible)", "NOMBRE/Nombre (Clave)" → "Slug" in both TaskParameterFormModal and TaskParameterOptionFormModal
  • TABLE COLUMN HEADERS UPDATED: AdminTaskParameters page columns now display "Nombre (visible)" and "Slug" instead of previous labels
  • DELETION SYSTEM MODERNIZED: All delete operations in AdminTaskParameters now use unified ModalFactory with 'delete-confirmation' type instead of AlertDialog
  • LEGACY MODAL CLEANUP: Removed all AlertDialog components and state variables, replaced with centralized modal system following README.md standards
  • LSP ERRORS RESOLVED: Fixed rightLoading/isLoading prop inconsistencies and missing parameterLabel props across modals
  • MODAL ARCHITECTURE COMPLIANCE: All modals now follow FormModalLayout pattern with proper isEditing={true} for direct edit mode access
- July 24, 2025. GENERATED TASK MODAL MODERNIZATION COMPLETED: Successfully migrated generated task modal from legacy system to modern FormModalLayout architecture - COMPLETED
  • COMPLETE MODAL RESTRUCTURING: Created GeneratedTaskFormModal.tsx in src/components/modal/modals/admin/ following BoardFormModal.tsx pattern exactly
  • ARCHITECTURE COMPLIANCE: Uses FormModalLayout with separate viewPanel, editPanel, headerContent, footerContent objects instead of legacy CustomModal system
  • MODALFACTORY INTEGRATION: Added 'generated-task' type to types.ts and ModalFactory.tsx for centralized modal management
  • ADMIN PAGE INTEGRATION: Updated AdminGeneratedTasks.tsx to use useGlobalModalStore openModal() instead of local modal state
  • LEGACY SYSTEM ELIMINATION: Removed src/modals/admin/tasks/NewAdminGeneratedTaskModal.tsx file and all legacy modal references
  • UX IMPROVEMENTS: Maintained all existing functionality (template selection, parameter configuration, material management, task preview)
  • TARGET ICON: Added Target icon to modal header for clear visual identification of task generation functionality
  • FULL FEATURE PARITY: Preserved template selection, parameter configuration, task preview, material management, and public/private toggle
- July 24, 2025. TASK PARAMETER GROUP ASSIGNMENT MODAL MODERNIZATION COMPLETED: Created new modal for managing parameter option groups following exact README.md architecture standards - COMPLETED
  • COMPLETE MODAL RESTRUCTURING: Created TaskParameterGroupAssignmentModal.tsx in src/components/modal/modals/admin/ following BoardFormModal.tsx pattern exactly
  • ARCHITECTURE COMPLIANCE: Uses FormModalLayout with separate viewPanel, editPanel, headerContent, footerContent objects instead of legacy CustomModal system
  • MODALFACTORY INTEGRATION: Added 'task-parameter-group-assignment' type to types.ts and ModalFactory.tsx for centralized modal management
  • PARAMETER FORM INTEGRATION: Updated TaskParameterFormModal.tsx to use useGlobalModalStore openModal() instead of local state management
  • LEGACY SYSTEM ELIMINATION: Removed src/modals/admin/tasks/NewTaskParameterGroupAssignmentModal.tsx file and all legacy modal references
  • UX IMPROVEMENTS: Maintained all existing functionality (option selection, assignment, progress tracking) with modern modal architecture
  • CHECKBOX SELECTION: Preserved original checkbox interface with option labels, slugs, and selection counts matching user specifications
  • SETTINGS ICON: Added Settings icon to modal header for clear visual identification of management functionality
- July 24, 2025. TASK PARAMETER OPTION MODAL ARCHITECTURE CORRECTION COMPLETED: Fixed TaskParameterOptionFormModal.tsx to follow proper modal documentation standards from README.md - COMPLETED
  • ARCHITECTURE COMPLIANCE: Completely restructured modal to follow BoardFormModal.tsx pattern exactly as specified in src/components/modal/README.md
  • PROPER COMPONENT STRUCTURE: Uses FormModalLayout with separate viewPanel, editPanel, headerContent, footerContent objects instead of JSX nesting
  • UX IMPROVEMENTS MAINTAINED: Preserved {value} placeholder explanation and inline "Insertar {value}" button functionality
  • MODAL FACTORY INTEGRATION: Modal works correctly with ModalFactory system using 'task-parameter-option' type
  • README COMPLIANCE: Modal now follows mandatory structure: FormModalLayout → FormModalHeader/FormModalFooter objects → proper prop passing
  • LEGACY SYSTEM ELIMINATION: Removed all references to old modal system from AdminTaskParameters.tsx
  • CRITICAL FIX: Added isEditing={true} removal as per README guidelines for proper modal behavior
- July 24, 2025. ALL CONSTRUCTION ACTIONBARS REPOSITIONED OUTSIDE EMPTYSTATES: Successfully restructured all construction pages to position ActionBar components outside of EmptyState conditionals - COMPLETED
  • UNIVERSAL POSITIONING: ActionBar components now appear FIRST on all construction pages: ConstructionTasks, ConstructionBudgets, ConstructionMaterials, ConstructionSchedule, ConstructionLogs
  • CONSISTENT LAYOUT STRUCTURE: All pages follow new pattern: ActionBar → EmptyState (if no data) → Page Content (if data available)
  • ALWAYS VISIBLE ACTIONBARS: Users now have access to search, filters, and primary actions regardless of data availability
  • CONSTRUCTION TASKS: ActionBar moved outside task count conditional with complete BudgetTable integration
  • CONSTRUCTION BUDGETS: ActionBar positioned before budget selection with proper budget selector integration
  • CONSTRUCTION MATERIALS: ActionBar now displays consistently with filter and grouping options always available
  • CONSTRUCTION SCHEDULE: ActionBar with tabs system (Gantt, Listado, Análisis) positioned before EmptyState conditional
  • CONSTRUCTION LOGS: ActionBar with tabs system (Bitácoras, Gráficos Avanzados) positioned before site logs conditional
  • ENHANCED UX: Users can now access creation buttons and filters even when pages are empty, improving workflow efficiency
  • CODE CLEANUP: Removed all duplicated ActionBar code and fixed LSP diagnostics across all construction pages
- July 23, 2025. CONSTRUCTION BUDGETS ACTIONBAR INTEGRATION COMPLETED: Successfully updated ConstructionBudgets page with ActionBarDesktop system and removed problematic components - COMPLETED
  • COMPLETE ACTIONBAR IMPLEMENTATION: Added full ActionBarDesktop with title, icon, expandable features system (4 budget management features)
  • BUDGET SELECTOR INTEGRATION: Integrated budget selection directly into ActionBar for streamlined workflow
  • SEARCH AND GROUPING: Implemented search functionality and grouping by rubros within ActionBar
  • ACTION BUTTONS CONFIGURED: Added "Nueva Tarea" primary action and "Nuevo Presupuesto" secondary action buttons
  • COMPONENT CLEANUP: Removed problematic BudgetTaskTableWithSelector component causing LSP errors per user request
  • FEATUREINTRODUCTION MOBILE-ONLY: Maintained FeatureIntroduction for mobile while using ActionBar expandable system for desktop
  • SIMPLIFIED LAYOUT: Page now displays clean ActionBar with no content below, allowing focus on budget management interface
  • LSP ERRORS ELIMINATED: Removed all problematic component references and fixed page structure
- July 23, 2025. ACTIONBAR EXPANDABLE INFO SYSTEM COMPLETED: Enhanced ActionBarDesktop with expandable help information using FeatureIntroduction format - COMPLETED
  • HELP ICON BUTTON: Added HelpCircle icon button replacing "Click para más información" text for cleaner UI
  • FEATURES GRID INTEGRATION: Implemented FeatureIntroduction-style grid layout with two columns for expandable content
  • FEATURES PROP SYSTEM: Added features array prop to ActionBarDesktop allowing any page to pass feature items with icon, title, description
  • MOBILE RESTRICTION: Modified FeatureIntroduction to only appear on mobile (md:hidden) preventing duplication with ActionBar desktop functionality
  • COMPONENT REUSABILITY: Enhanced ActionBarDesktop as universal component - any page using ActionBar can now add expandable help information
  • EXAMPLE IMPLEMENTATION: Added 4 features to materials page demonstrating automatic calculation, organization, purchase control, and flexible filtering
  • EXPANDABLE BEHAVIOR: Content expands between title and divider line exactly as requested, maintaining ActionBar structure integrity
- July 23, 2025. MODAL WIDTH STANDARDIZED TO 800PX MAX: Fixed modal width expansion issue by setting standard maximum width limit on desktop - COMPLETED
  • DESKTOP WIDTH LIMIT: Changed FormModalLayout from md:max-w-screen-2xl to md:max-w-[800px] for consistent modal sizing
  • PREVENTED INFINITE EXPANSION: Long text phrases no longer cause modals to expand beyond readable width
  • MAINTAINED MOBILE EXPERIENCE: Mobile modals still use full viewport width (w-full h-full) for optimal touch interface
  • STANDARDIZED UX: All modals now have consistent maximum width of 800px on desktop preventing text overflow issues
- July 23, 2025. TOAST STYLING STANDARDIZED TO MATCH CARD RADIUS: Updated toast components to use same border-radius as cards for visual consistency - COMPLETED
  • MAIN TOAST CONTAINER: Changed from rounded-md to rounded-[var(--radius-lg)] matching card styling
  • TOAST ACTION BUTTONS: Updated ToastAction to use rounded-[var(--radius-lg)] for consistent button appearance
  • TOAST CLOSE BUTTON: Modified ToastClose to use rounded-[var(--radius-lg)] instead of rounded-md
  • VISUAL CONSISTENCY: All toast elements now match card border-radius (8px) for unified design system
- July 23, 2025. CONSTRUCTION TASKS DELETION CONFIRMATION MODAL IMPLEMENTED: Fixed construction tasks page to show confirmation modal instead of direct deletion - COMPLETED
  • REPLACED DIRECT DELETION: Modified handleDeleteTask in ConstructionTasks.tsx to use DeleteConfirmationModal instead of immediate deletion
  • MODAL INTEGRATION: Added openModal('delete-confirmation') with proper task name display and confirmation workflow
  • ENHANCED UX: Users now see confirmation dialog with task name before deletion instead of instant removal
  • CONSISTENT BEHAVIOR: Construction tasks deletion now matches admin materials deletion workflow with unified modal system
  • DESTRUCTIVE BUTTON STYLING FIXED: Updated destructive variant to use rounded-lg instead of rounded-md matching default button appearance
- July 23, 2025. ADMIN MATERIALS DELETION SYSTEM COMPLETELY FIXED: Successfully implemented working material deletion functionality with proper replacement modal system - COMPLETED
  • CRITICAL HOOK IMPLEMENTED: Created useDeleteMaterial hook in use-materials.ts with proper Supabase delete operation and cache invalidation
  • LEGACY MODAL SYSTEM ELIMINATED: Removed obsolete AlertDialog code and deletingMaterial state variables from AdminMaterials.tsx
  • REPLACEMENT MODAL ENHANCED: Updated DeleteConfirmationModal to use ComboBoxWrite instead of basic Select for better search functionality
  • MATERIALS DATA INTEGRATION: AdminMaterials now passes complete materials list as replacementOptions to deletion modal
  • UI TEXT CONSISTENCY: Changed all modal text from "categoría" to "material" for proper context (buttons, labels, warning messages)
  • MODAL WORKFLOW IMPROVED: Users can now choose between "Eliminar definitivamente" or "Reemplazar por otro" with full material search
  • COMPLETE FUNCTIONALITY: Deletion works correctly with toast notifications, cache updates, and proper error handling
  • CENTRALIZED MODAL SYSTEM: All deletion operations now use unified ModalFactory with 'delete-confirmation' type instead of individual modals
- July 23, 2025. TASK TEMPLATE MODAL SUBMIT FUNCTIONALITY COMPLETELY FIXED: Successfully implemented complete data saving system for task template modal - COMPLETED
  • CRITICAL BUG RESOLVED: Fixed submit function not saving data to Supabase by implementing saveParametersMutation
  • Added generatePreview() function to create dynamic template names like "Test {{brick-type}}."
  • Implemented comprehensive save operation: delete existing parameters → insert new parameters → update template name
  • Enhanced step 3 "Finalizar" button to use saveParametersMutation instead of just closing modal
  • Added detailed logging system for debugging save operations with emojis (💾 🔍 ✅ ❌)
  • Fixed FormModalHeader and FormModalStepHeader typography to match legacy modal format exactly
  • Added stepDescription support with dynamic descriptions for each step explaining user actions
  • System now successfully saves: template parameters, positions, option groups, and generated template names
  • Complete data persistence workflow: template creation → unit selection → parameter configuration → final save to Supabase
  • PREVIEW STYLING UPDATED: Modified preview section to match title text size and use dashed accent border as requested
  • COMBOBOX INTEGRATION COMPLETED: Replaced parameter Select with ComboBox for better search functionality, styled to match Select exactly
  • UI IMPROVEMENTS: Parameter selector now uses ComboBox with search capability, double width layout, and full-width Add button
- July 23, 2025. TASK TEMPLATE MODAL UI REDESIGN COMPLETED: Eliminated all Card components and adopted standard modal layout matching movement modals design patterns - COMPLETED
  • Removed Card and CardContent wrappers from all 3 steps following user request for consistent modal styling
  • Step 1: Clean title/description layout with background section for template details
  • Step 2: Standard form layout for unit selection without card containers
  • Step 3: Organized parameter management with separator lines (border-t) between sections instead of card divisions
  • Consistent with MovementFormModal design: titles, descriptions, padding, and section separators using border-t
  • Enhanced visual consistency: all admin modals now follow same layout patterns without card containers
- July 23, 2025. TASK TEMPLATE MODAL MIGRATION COMPLETED: Successfully migrated task template modal from legacy system to new FormModalStepFooter architecture - COMPLETED
  • Created TaskTemplateFormModal.tsx in src/components/modal/modals/admin/ following FormModalStepFooter pattern with 3 steps
  • Updated ModalFactory.tsx to include 'task-template' type and proper modal routing  
  • Migrated AdminCategories.tsx from local modal state to useGlobalModalStore system
  • Fixed modal structure: Step 1 (Plantilla Creada/Crear Plantilla), Step 2 (Seleccionar Unidad), Step 3 (Configurar Parámetros)
  • Eliminated NewTaskTemplateEditorModal.tsx legacy file and all local modal references
  • Modal now uses centralized global state and consistent FormModalStepFooter structure
  • Enhanced user experience: template creation simplified with automatic naming, 3-step workflow for complete configuration
  • System architecture improved: all admin task modals now use unified FormModalStepFooter approach for multi-step workflows
- July 23, 2025. TASK CATEGORY MODAL MIGRATION COMPLETED: Successfully migrated task category modal from legacy system to new FormModalLayout architecture - COMPLETED
  • Created TaskCategoryFormModal.tsx in src/components/modal/modals/admin/ following FormModalLayout pattern
  • Updated ModalFactory.tsx to include 'task-category' type and proper modal routing
  • Migrated AdminCategories.tsx from local modal state to useGlobalModalStore system
  • Fixed modal rendering issue by setting isEditing={true} to ensure editPanel displays correctly
  • Eliminated NewAdminTaskCategoryModal.tsx legacy file from src/modals/admin/
  • Modal now uses centralized global state and consistent FormModalLayout structure
  • Enhanced user experience: category creation and editing now follows standardized modal patterns
  • System architecture improved: all admin modals now use unified FormModalLayout approach
- July 23, 2025. ACTIONBAR BUTTON SIZING STANDARDIZED: Eliminated all hardcoded button sizes in ActionBarDesktop component to ensure consistent default sizing across all pages - COMPLETED
  • Removed all size="sm" and h-8 hardcoded classes from ActionBarDesktop.tsx component
  • All buttons (ghost, secondary, primary) now use default button component sizing consistently
  • Fixed inconsistent button heights between primary action and secondary action buttons
  • Change applied globally to all pages using ActionBarDesktop: construction tasks, budgets, schedule, finances movements
  • Enhanced visual consistency: all ActionBar buttons maintain same height using component defaults instead of hardcoded values
  • EMPTYSTATE BUTTONS STANDARDIZED: Fixed EmptyState button sizing in DesignDashboard.tsx, OrganizationTasks.tsx, and BudgetTable.tsx
  • Removed hardcoded className="h-8 px-3 text-sm" and size="sm" from all EmptyState action buttons
  • All EmptyState buttons now use default Button component sizing for consistency with ActionBar buttons
- July 23, 2025. CONSTRUCTION LIBRARY PAGE COMPLETED: Successfully created new ConstructionLibrary.tsx page displaying all construction tasks from task_generated_view - COMPLETED
  • TASK LIBRARY HOOK IMPLEMENTED: Created useTaskLibrary hook for fetching and managing task library data with proper TypeScript interfaces
  • NAVIGATION INTEGRATION COMPLETED: Added "Librería" option to construction sidebar (desktop and mobile) and created corresponding route in App.tsx
  • BUDGETTABLE INTEGRATION: Successfully implemented BudgetTable component instead of regular table as requested by user
  • FILTERING SYSTEM ADDED: Implemented category and subcategory filters for task library with proper state management
  • Component follows established patterns with FeatureIntroduction, ActionBarDesktop, and filtering systems
  • Library positioned below Asistencia in construction sidebar as specifically requested
- July 23, 2025. MOVEMENTS TABLE SORTING FIXED: Corrected movement ordering to show most recent creation time first for same-date movements - COMPLETED
  • Fixed hook use-movements.ts to order by movement_date DESC first, then created_at DESC as secondary criteria
  • Eliminates issue where movements created on same date appeared in wrong chronological order
  • New EGRESO entries now correctly appear above earlier TRANSFERENCIAS from same day
  • Maintains proper chronological ordering within each date group
- July 23, 2025. TABLA AUTO-UPDATE BUG FIXED Y COLUMNA TIPO AGREGADA: Corregido problema de actualización automática de tablas y agregada nueva columna para subcategorías - COMPLETED
  • NUEVA COLUMNA "TIPO": Agregada columna que muestra subcategorías como "Avance de Obra", "Anticipo", etc. después de "Contacto"
  • Redistribuidas las 6 columnas con anchos de 16.7% cada una: Fecha, Contacto, Tipo, Billetera, Monto, Cotización
  • Badge styling aplicado a subcategorías en columna "Tipo" con variant="secondary"
  • InstallmentDetailCard actualizada para mostrar subcategoría como badge debajo de la fecha
  • CACHE INVALIDATION CORREGIDA: Agregada invalidación de 'movement-view' query en todas las mutaciones de MovementFormModal
  • Aplicado a: createMovementMutation, createConversionMutation, createTransferMutation, createAportesMutation, createAportesPropriosMutation, createRetirosPropriosMutation
  • Las tablas ahora se actualizan automáticamente después de modificar subcategorías de movimientos sin requerir F5
- July 23, 2025. TABLA DETALLE DE COMPROMISOS MEJORADA: Optimizada tabla de compromisos de pago con formato mejorado y eliminación de columna redundante - COMPLETED
  • Eliminada columna "Moneda" por redundancia con información ya presente en monto
  • Columna "Cotización" ahora siempre muestra en pesos argentinos (ARS) independientemente de la moneda original
  • Agregado espacio entre símbolo y monto: "$ 1.000.000" en lugar de "$1.000.000" para mejor legibilidad
  • Redistribuidas columnas con anchos del 20% cada una: Fecha, Contacto, Billetera, Monto, Cotización
  • InstallmentDetailCard actualizada con mismo formato: espacio en monto y cotización siempre en pesos
  • Color verde aplicado a montos para mejor identificación visual
  • Mejoras aplicadas tanto en vista desktop como mobile para consistencia visual```
- July 22, 2025. CURRENCY FIELD "SIN NOMBRE" BUG COMPLETELY RESOLVED: Fixed critical recurring issue where currency fields showed "Sin nombre" instead of proper currency names - COMPLETED
  • Root cause identified: inconsistent wallet mapping logic in movement editing (w.wallet_id vs w.id)
  • Fixed wallet structure mapping in MovementFormModal.tsx lines 632 and 859-860
  • Corrected currency field display in AportesFields.tsx, AportesPropiosFields.tsx, and RetirosPropiosFields.tsx
  • All movement forms now consistently use orgCurrency.currency?.name structure for proper currency name display
  • Currency dropdown now correctly shows "Dólar Estadounidense (US$)" and "Peso Argentino ($)" instead of "Sin nombre ($)"
  • Movement editing and updating for APORTES DE TERCEROS category working correctly after currency structure fixes
- July 22, 2025. COMPROMISOS DE PAGO FIXED TO USE CORRECT APORTES DE TERCEROS ID: Corrected installments filtering to use proper "Aportes de Terceros" subcategory ID f3b96eda-15d5-4c96-ade7-6f53685115d3 instead of deprecated "Cuotas" ID e675eb59-3717-4451-89eb-0d838388238f - COMPLETED
  • Fixed movement_view data structure implementation for contact_name, contact_company_name, currency_symbol, wallet_name fields
  • Updated all table columns and card components to use flattened fields from movement_view instead of nested object references
  • Corrected InstallmentDetailCard component to display proper contact and financial data
  • Updated handleEdit, handleDelete, handleCardClick functions to work with new data structure
  • Fixed null safety issues with supabase references throughout the component
- July 22, 2025. COMPROMISOS DE PAGO UPDATED TO APORTES DE TERCEROS: Changed installments logic to filter by "Aportes de Terceros" subcategory instead of deprecated "Cuotas" - COMPLETED
  • Updated filtering logic from subcategory "Cuotas" (e675eb59-3717-4451-89eb-0d838388238f) to "Aportes de Terceros" (f3b96eda-15d5-4c96-ade7-6f53685115d3)
  • New path: INGRESOS > APORTES > APORTES DE TERCEROS instead of deprecated CUOTAS category
  • All three tabs now correctly sum movements from Aportes de Terceros subcategory
  • Tab 1: Resumen por Cliente aggregates all project clients with their Aportes de Terceros totals
  • Tab 2: Detalle por Moneda groups by currency for Aportes de Terceros movements
  • Tab 3: Detalle de Compromisos shows individual Aportes de Terceros movements
  • Maintains same filtering by organization, project, and now uses correct subcategory_id
- July 22, 2025. FINANCES MOVEMENTS ACTIONBAR INTEGRATION COMPLETED: Successfully implemented ActionBarDesktop component in financial movements page - COMPLETED
  • Migrated search functionality from header to ActionBar with full search filtering capability
  • Moved custom filters system (type, category, favorites, scope) from header to ActionBar dropdown
  • Transferred action buttons from header to ActionBar: "Nuevo movimiento" (primary), "Importar" (secondary), delete selected (conditional)
  • ActionBar only appears when movements exist for clean empty state UX consistency
  • Header simplified to display only title and icon following established pattern
  • Changed import button from "Importar desde Excel" to "Importar" with secondary variant styling
  • Maintained all existing functionality: search, filters, modal opening, bulk operations
  • Achieved visual consistency across all construction and finance pages using same ActionBarDesktop component
- July 22, 2025. CRONOGRAMA TABS INTEGRATED INTO ACTIONBAR: Successfully moved tabs from separate component to ActionBar left side with ghost styling consistency - COMPLETED
  • Created custom Tabs component in src/components/ui-custom/Tabs.tsx with ghost button styling matching ActionBar
  • Added tabs support to ActionBarDesktop.tsx with Tab interface and rendering logic
  • Integrated tabs into ConstructionSchedule.tsx ActionBar: Vista Gantt, Listado de Tareas, Análisis Visual
  • Eliminated original shadcn/ui Tabs components and TabsList/TabsTrigger implementation
  • Maintained all tab functionality while achieving consistent ghost styling across ActionBar
  • Fixed tab styling issues: preserved rounded borders on active state, reduced padding for compact appearance
  • Tabs positioned on left side of ActionBar as specified, only appearing for cronograma page
- July 22, 2025. ACTIONBAR LAYOUT PERFECTED AND BUTTON STYLING COMPLETED: Finalized layout structure and ghost button appearance - COMPLETED
  • Layout standardized to exact order: SEARCH → GHOST BUTTONS (icons only) → SECONDARY BUTTONS → PRIMARY BUTTONS
  • Search button converted to icon-only display (removed "Buscar" text) with 8x8 sizing matching other ghost buttons
  • All ghost buttons in ActionBar now display icons only without any text labels whatsoever
  • Budget selector left on the left side only for specific cases like budgets page (casos puntuales)
  • Eliminated "+" from "Nueva Tarea" button text in construction tasks page
  • Cleaned up legacy BudgetTaskTableWithSelector component by removing unused budget selector props
  • ActionBar right side now flows logically from search through different button types to primary action
- July 22, 2025. CONSTRUCTION SCHEDULE ACTION BAR IMPLEMENTED: Added ActionBarDesktop to cronograma page with dual action buttons and search - COMPLETED
  • Integrated ActionBarDesktop component above tabs in construction schedule page
  • Primary action: "Nueva Tarea" button (green) for task creation
  • Secondary action: "Crear Fase" button (outline) positioned left of primary button
  • Search functionality integrated with existing search state and filtering logic
  • Action bar only appears when tasks exist, hidden in empty state for clean UX
  • Removed duplicate search and action buttons from header, now centralized in ActionBar
  • Consistent styling with construction tasks page using same ActionBarDesktop component
- July 22, 2025. EXPANDABLE SEARCH BUTTON REFINEMENT COMPLETED: Fixed styling consistency, smooth animations, and HTML structure - COMPLETED
  • Fixed HTML nesting issue: removed nested button elements preventing DOM validation warnings
  • Consistent ghost styling: both states use identical CSS variables for colors, fonts, and spacing
  • Improved animation performance: reduced duration to 200ms for smoother, less laggy transitions
  • Unified typography: both collapsed and expanded states use same text-sm font-medium classes
  • State-based rendering: clean conditional rendering instead of complex CSS transforms
  • Enhanced accessibility: proper form structure with submit functionality and focus management
  • Seamless visual continuity: expanded state maintains exact same visual appearance as collapsed ghost button
- July 22, 2025. CANCEL BUTTON STANDARDIZATION COMPLETED: Changed all cancel buttons to use secondary variant for consistent styling - COMPLETED
  • Updated AlertDialogCancel in alert-dialog.tsx from "outline" to "secondary" variant
  • All FormModalFooter cancel buttons already use secondary variant correctly
  • FormModalStepFooter cancel buttons also use secondary variant
  • Unified cancel button styling: all cancel/cancelar buttons now use consistent secondary appearance
- July 22, 2025. MODAL CLOSE BUTTON FLATTENED: Changed modal close button (X) to use ghost-flat variant without hover translateY effect - COMPLETED
  • Updated FormModalLayout.tsx close button from "ghost" to "ghost-flat" variant
  • Eliminated unwanted downward movement on hover for modal close buttons
  • Close button now behaves like standard ghost button without shadow or movement effects
  • Maintains consistent flat styling across all modal close interactions
- July 22, 2025. ACTIONBAR CONDITIONAL VISIBILITY COMPLETED: ActionBarDesktop now only appears when there are tasks, hidden in empty state - COMPLETED
  • Moved ActionBarDesktop component inside the data condition in ConstructionTasks.tsx
  • ActionBar no longer displays when tasks list is empty for cleaner empty state experience
  • Preserved all functionality: search, grouping, and primary action button work when tasks exist
  • Enhanced UX: empty state now shows clean interface without unnecessary action elements
- July 22, 2025. HEADER BUTTONS FLATTENED: Implemented ghost-flat button variant for all header breadcrumb buttons - COMPLETED
  • Created new "ghost-flat" button variant: transparent background, no shadows, no hover effects
  • Applied ghost-flat to all header breadcrumb buttons: organization, project, and stage selectors
  • Buttons now appear "flat" like breadcrumb text without shadows or 3D effects as requested
  • Maintained all functionality while achieving flat visual appearance matching breadcrumb styling
- July 22, 2025. EXPANDABLE SEARCH BUTTON REFINEMENT COMPLETED: Fixed styling consistency, smooth animations, and HTML structure - COMPLETED
  • Fixed HTML nesting issue: removed nested button elements preventing DOM validation warnings
  • Consistent ghost styling: both states use identical CSS variables for colors, fonts, and spacing
  • Improved animation performance: reduced duration to 200ms for smoother, less laggy transitions
  • Unified typography: both collapsed and expanded states use same text-sm font-medium classes
  • State-based rendering: clean conditional rendering instead of complex CSS transforms
  • Enhanced accessibility: proper form structure with submit functionality and focus management
  • Seamless visual continuity: expanded state maintains exact same visual appearance as collapsed ghost button
- July 22, 2025. BUTTON SHADOW SYSTEM COMPLETED: All button variants now have consistent shadow system with normal and hover states - COMPLETED
  • Created --button-shadow-normal and --button-shadow-hover CSS variables for light/dark themes
  • Applied shadow-button-normal (half shadow) to all button variants by default
  • Applied shadow-button-hover (full shadow) on hover state for all variants
  • All button types (default, destructive, outline, secondary, ghost) now have consistent shadow behavior
  • Enhanced with hover translateY effect for professional button interaction feedback
- July 22, 2025. ACTIONBARDESKTOP COMPONENT AND LAYOUT BACKGROUND UPDATE COMPLETED: Created new reusable ActionBarDesktop component and changed layout background to card color - COMPLETED
  • Created ActionBarDesktop.tsx component in src/components/layout/desktop/ with comprehensive prop system for customization
  • Component features: title display, search input with icon, filters button, primary action button, custom actions array
  • Responsive design: hidden on mobile (hidden md:flex), uses card background color var(--card-bg)
  • Implemented as example in ConstructionTasks.tsx with search functionality, filters, and "Nueva Tarea" button
  • Changed main layout background from --layout-bg to --card-bg for better visual consistency
  • ActionBar positioned above content with proper spacing, border, and card-style appearance
  • Ready for reuse across all construction pages: Bitácora, Cronograma, Presupuestos, Materials, etc.
- July 22, 2025. TUTORIAL MODE BUG RESOLVED: FeatureIntroduction components now properly hide when tutorial mode is disabled - COMPLETED
  • Fixed FeatureIntroduction.tsx to check user_preferences.tutorial and return null when tutorial = false
  • Added useCurrentUser hook integration for real-time preference checking
  • Tutorial switch now successfully controls FEATURES component visibility across all pages
  • Components properly disappear when "Modo nuevo usuario" is turned off in profile settings
  • System automatically hides help components when users want cleaner interface experience
- July 22, 2025. PROFILE SIDEBAR CORRECTED AND TUTORIAL SYSTEM COMPLETED: Fixed Settings button placement and created tutorial mode functionality - COMPLETED
  • Moved "Preferencias" button from main sidebar to profile sidebar (below "Datos Básicos") as user specified
  • Created new "Tutorial" section in ProfileSettings.tsx with switch for new user mode to hide FEATURES components
  • Extended user_preferences table support to include tutorial column for controlling feature visibility
  • Updated mobile menu to remove separate Settings button, maintaining "Preferencias" option in profile submenu navigation
  • Profile sidebar now has both "Datos Básicos" and "Preferencias" options working correctly with proper navigation
  • Tutorial switch controls FEATURES component visibility across all pages, stored in user_preferences.tutorial column with default true value
- July 22, 2025. CONSTRUCTION TASKS PAGE STANDARDIZED TO BUDGETTABLE COMPONENT: Successfully migrated from Table.tsx to BudgetTable.tsx maintaining same functionality - COMPLETED
  • Replaced Table component import with BudgetTable component in ConstructionTasks.tsx for visual consistency across construction pages
  • Maintained all existing columns: Rubro, Tarea, Unidad, Cantidad, Progreso, Fase, Fechas, Acciones
  • Preserved all functionality: edit task modal, delete confirmation, progress bars, date formatting, search filtering
  • Enhanced UI consistency: Construction Tasks page now matches visual styling of Construction Budgets page
  • Component standardization achieved: both construction management pages use same table structure and behavior
- July 22, 2025. BUDGET AUTO-SELECTION LOGIC COMPLETELY FIXED: Resolved critical bug where "Selecciona un presupuesto" message appeared when projects had available budgets - COMPLETED
  • Root cause identified: faulty conditional logic in useEffect prevented budget auto-selection when last_budget_id didn't exist in current project
  • Fixed budget selection workflow: removed problematic "else if (!selectedBudgetId)" condition that blocked automatic selection
  • Enhanced fallback system: selectedBudget now uses first available budget if current selection doesn't exist in filtered results
  • Improved project switching behavior: automatically selects first budget when switching to project where previous selection doesn't exist
  • Added comprehensive logging for budget selection states: "Last budget not found, selecting first budget" messages for debugging
  • System now guarantees: if budgets exist, one is always selected; if no budgets exist, EmptyState shows; never shows selection prompt when budgets are available
  • Fixed UI separation: EmptyState appears immediately after budget selector without interfering gray action bars
  • Enhanced user experience: seamless project navigation with consistent budget selection behavior```
- July 22, 2025. GANTT DEPENDENCY ARROWS CRITICAL BUG FIXED: Resolved issue where dependency arrows disappeared when tasks were deleted or in different phases - COMPLETED
  • Root cause identified: Dependencies were referencing deleted/non-existent tasks causing DOM element lookup failures
  • Implemented data validation system: only process dependencies where both predecessor and successor tasks exist in current rendered data
  • Added defensive filtering: dependencies checked against renderedTaskIds set before DOM element lookup
  • Enhanced error handling: system gracefully handles orphaned dependencies without breaking arrow rendering
  • Dependencies now display correctly: valid arrows appear immediately, invalid dependencies are silently filtered out
  • Improved performance: eliminated unnecessary DOM queries for non-existent tasks
  • System maintains stability during task deletion, phase expansion/collapse, and data filtering operations
- July 21, 2025. FINAL ANALYSIS CHARTS PERFECTION AND LAYOUT REORGANIZATION COMPLETED: Fixed grid lines visibility, eliminated hardcoded colors, removed unwanted codes, and reorganized chart layout - COMPLETED
  • GRID LINES FINALLY VISIBLE: Changed from strokeOpacity={0.5} to className="opacity-30" and stroke="var(--chart-grid-text)" matching OrganizationActivityChart pattern
  • HEATMAP COLORS FIXED: Eliminated all hardcoded colors, now uses proper CSS variables [background-color:var(--chart-1)] through [background-color:var(--chart-5)]
  • DEPENDENCY NETWORK CLEANED: Removed task codes display, now shows only task names for cleaner interface
  • LAYOUT REORGANIZED: First row (3 cols), Second row (4 cols including CriticalPathDistribution), Third row (Heatmap 1 col + Network 3 cols)
  • All 9 charts now use consistent CSS variable system without any hardcoded colors or invisible grid lines
- July 21, 2025. ANÁLISIS VISUAL CHARTS COLOR AND DATA SYSTEM COMPLETELY FIXED: Resolved all color variable issues and data display problems in the 9 analysis charts - COMPLETED
  • Fixed all CSS variable usage: eliminated incorrect hsl(var(...)) wrappers, now using direct var(--chart-1) through var(--chart-5) format
  • Corrected all CartesianGrid lines to use hsl(var(--chart-grid-text)) for consistent background grid styling across all charts
  • Fixed "undefined" data display issues in DependencyNetwork by improving task mapping and fallback data handling
  • Enhanced DurationByRubro chart to filter empty entries and show "Sin datos disponibles" message when no valid data exists
  • Eliminated hardcoded colors in WeeklyProgressHeatmap, replaced with proper CSS variable system and transparency controls
  • Improved data validation throughout all 9 charts: ProgressCurve, BurndownChart, WorkloadOverTime, DurationByRubro, TasksByPhase, StatusBreakdown, CriticalPathDistribution, WeeklyProgressHeatmap, DependencyNetwork
  • All tooltip backgrounds now use var(--popover-bg) and hsl(var(--card-border)) for visual consistency
  • Charts now display proper colors: green (--chart-1), teal (--chart-2), blue (--chart-3), yellow (--chart-4), red (--chart-5) instead of black
  • Enhanced empty state handling: charts show meaningful messages instead of "Sin Grupo", "undefined", or empty displays
- July 21, 2025. PHASE COLUMN DATA CALCULATION SYSTEM COMPLETED: Fixed phase columns to display automatically calculated dates instead of manual input - COMPLETED
  • Fixed phase date display in INICIO and DÍAS columns to use calculateResolvedEndDate function for automatic calculation
  • Enhanced GanttRowProps interface to include phaseTasks property for containing task information
  • Updated ConstructionSchedule.tsx to pass phaseTasks array to phase rows for calculation reference
  • Improved calculateResolvedEndDate function to prioritize task-based calculation for phases over manual dates
  • Phase columns now correctly show calculated start date (earliest task start) and duration (total span) automatically
  • System eliminates manual phase date management in favor of dynamic calculation based on contained tasks
  • Enhanced phase data accuracy: dates automatically update when tasks are modified within phases
- July 21, 2025. GANTT COLUMN WIDTH EXPANSION AND PHASE DELETION FIX COMPLETED: Enhanced column layout and corrected phase deletion functionality - COMPLETED
  • Expanded INICIO and DÍAS columns from 50px to 75px each (1.5x wider) for better date visibility
  • Updated leftPanelWidth calculation from 100px to 150px to accommodate wider date columns
  • Fixed critical phase deletion bug: added proper useDeleteProjectPhase hook integration and async deletion logic
  • Repositioned floating action buttons by 50px (right-152px) to align with new column widths
  • Enhanced phase deletion workflow: modal appears and now actually deletes phases from database
  • Added phase bar visualization system for timeline view with proper coordinate calculation
  • All column proportions properly maintained: FASE/TAREA uses calculated width (leftPanelWidth - 150px), INICIO and DÍAS use fixed 75px each
- July 21, 2025. GANTT DOUBLE-LINE TEXT AND HEIGHT OPTIMIZATION COMPLETED: Enhanced text display with proper vertical sizing - COMPLETED
  • Increased task row height from h-11 to h-12 (48px) for better content visibility without excessive height
  • Implemented line-clamp-2 for double-line text display in "Fase/Tarea" column with elegant truncation
  • Header rows maintain original h-11 (44px) height for visual hierarchy distinction
  • Eliminated problematic vertical scrollbars that caused panel desynchronization issues
  • Synchronized all row heights between left panel and timeline for perfect alignment
  • Enhanced text readability: long task names now display on two lines with proper overflow handling
  • Optimized padding and spacing to prevent excessive row heights while maximizing content visibility
- July 21, 2025. GANTT LEFT PANEL ENHANCEMENT COMPLETED: Added "Inicio" and "Días" columns with proper text truncation - COMPLETED
  • Added three-column layout to Gantt left panel: "Fase / Tarea", "Inicio", "Días"
  • Equalized column widths: INICIO and DÍAS now both use 50px for consistent appearance
  • Enhanced date display: INICIO column shows full date format including year (dd/MM/yy)
  • Repositioned action buttons to end of FASE/TAREA column instead of overlapping DÍAS column
  • Implemented proper column width management with calculated width for name column (leftPanelWidth - 100px) and fixed widths for date columns (50px + 50px)
  • Added text truncation with overflow:hidden to prevent text overflow into adjacent columns
  • "Días" column automatically calculates duration from start/end dates showing task/phase duration
  • Maintained all existing functionality: hover actions, phase collapse, edit/delete buttons
  • Enhanced user experience: users can now see task/phase dates and durations directly in left panel without needing to examine timeline bars
```
- July 21, 2025. PHASE MODAL SIMPLIFICATION COMPLETED: Eliminated manual date configuration from phase modal as dates now calculate automatically - COMPLETED
  • Removed entire "Configuración en el Proyecto" section from phase creation/editing modal
  • Eliminated start_date and duration_in_days fields from phase schema and form since dates calculate automatically from contained tasks
  • Simplified phase creation workflow: users only need to provide name and description
  • Updated phase creation mutations to exclude manual date fields - system uses automatic calculation instead
  • Enhanced user experience: no more manual date management, phases automatically span their contained tasks' date range
  • Modal now focuses on essential phase information while dates are handled transparently by the automatic calculation system
- July 21, 2025. PHASE BAR VISUALIZATION SYSTEM COMPLETED: Fixed critical bug preventing phase bars from appearing in Gantt timeline view - COMPLETED
  • Root cause identified: calculateResolvedEndDate function was incorrectly excluding all isHeader=true elements from showing bars
  • Modified validation logic in types.ts to allow phase elements with dates to display bars while still blocking groups without dates
  • Fixed conditional logic: changed from (item.type === 'group' || item.isHeader) to (item.type === 'group' || (!item.startDate && item.type !== 'phase'))
  • Phase bars now render correctly in timeline showing calculated date spans (start_date = earliest task start, end_date = latest task end)
  • System verified working: phases calculate dates from contained tasks AND display visual bars spanning the calculated timeframe
  • Enhanced phase visualization: users can now see both the calculated phase duration and the visual representation in Gantt timeline
  • Complete phase management: automatic date calculation + proper visual representation + real-time updates when task dates change
- July 21, 2025. AUTOMATIC PHASE DATE CALCULATION SYSTEM IMPLEMENTED: Successfully created comprehensive automatic phase date calculation based on contained tasks - COMPLETED
  • Implemented calculatePhaseDates function in use-construction-phases.ts that automatically sets phase start_date to earliest task start and end_date to latest task end
  • Added useUpdatePhasesDates hook for real-time phase date updates based on contained task calculations
  • Fixed critical database schema issues: construction_gantt_view uses 'task_instance_id' not 'id', no 'organization_id' column
  • Corrected construction_project_phases table structure - only start_date/end_date fields exist (no duration_in_days)
  • System now automatically calculates phase dates: start_date = first task start, end_date = last task end from contained tasks
  • Enhanced Gantt timeline: phase bars automatically adjust to match the span of their contained tasks
  • Phase creation/editing now works with automatic date calculation when tasks are modified or rearranged
  • System eliminates manual phase date management - dates update automatically based on task modifications
- July 21, 2025. CONSTRUCTION TASK MODAL SYSTEM DUALIZATION COMPLETED: Successfully separated construction task creation from scheduling management - COMPLETED
  • Created new ConstructionTaskScheduleModal.tsx specifically for CRONOGRAMA page with scheduling fields (start_date, duration_in_days, progress_percent, project_phase_id)
  • Added 'construction-task-schedule' type to ModalFactory types.ts and integrated in ModalFactory.tsx with proper imports
  • Modified ConstructionSchedule.tsx handleEditTask function to use new 'construction-task-schedule' modal instead of general 'construction-task' modal
  • Maintained original simplified ConstructionTaskFormModal.tsx for basic task creation (Fase → Tarea → Cantidad workflow)
  • Fixed modal structure compliance: removed invalid 'notes' field and 'isLoading' prop from FormModalFooter for proper modal architecture
  • System now provides two distinct modal workflows: simplified task creation modal for general use + advanced scheduling modal for Gantt timeline management
  • Enhanced user experience: CRONOGRAMA page opens appropriate scheduling modal with date/duration/progress fields when editing tasks from Gantt view
- July 21, 2025. BUDGET TABLE STYLING AND MOBILE ENHANCEMENTS COMPLETED: Fixed checkbox colors, column proportions, and mobile action bar implementation - COMPLETED
  • Changed all checkbox colors from blue to --accent (hsl(var(--accent))) for brand consistency including header and task row checkboxes
  • Adjusted column widths to user specification: Rubro 10%, all other columns 5% except TAREAS which takes remaining space (1fr)
  • Mobile action bar functionality confirmed working: grouping selector on left, "AGREGAR TAREAS" button on right
  • TOTAL row maintains visual consistency with header using same background and styling (--table-header-bg)
  • Grouping rows use --accent background with white text for better visual distinction between rubro/phase categories
  • All table structural elements now use percentage-based responsive column system instead of fixed pixel widths
  • Enhanced brand cohesion: accent color integration across checkboxes, grouping rows, and mobile action elements
- July 21, 2025. GANTT TIMELINE AUTO-SCROLL PREVENTION IMPLEMENTED: Fixed critical UX issue where timeline jumped back to "today" position after task movements - COMPLETED
  • Added autoScrolled flag to prevent timeline from automatically scrolling to "today" position after task operations
  • Implemented scroll position preservation system using preservedScrollLeft state and useEffect synchronization
  • Auto-scroll to "today" now only occurs on initial component load, not during subsequent calendarStructure updates
  • Timeline now maintains user's current viewport position during all task drag & drop, resize, and dependency operations
  • Enhanced UX: users can navigate to any timeline period and work without viewport jumping back to initial position
  • Professional timeline behavior: initial orientation to current date + persistent user-controlled viewport thereafter
  • System eliminates disruptive timeline jumps that interrupted workflow during active task management sessions
- July 21, 2025. TASK EDIT MODAL DEPENDENCY LOADING BUG FIXED: Resolved issue where "Tarea Predecesora" field wasn't loading existing dependencies during task editing - COMPLETED
  • Fixed TypeScript null safety issues with task.task?.display_name and task.task?.code in modal dependencies dropdown
  • Enhanced dependency loading logic with proper conditional checks (existingDependencies.length > 0)
  • Added automatic field clearing for tasks without existing dependencies to ensure consistent form state
  • Removed invalid 'disabled' prop from FormModalFooter component causing TypeScript errors
  • System now correctly loads predecessor task in edit modal for tasks that have incoming dependencies
  • Confirmed working: tasks without dependencies show empty field, tasks with dependencies show correct predecessor
  • Modal dependency system fully functional: can create, edit, and remove task dependencies through UI
- July 21, 2025. REAL-TIME DEPENDENCY PROPAGATION IMPLEMENTED: Enhanced Gantt with professional MS Project-like behavior for dependent task movement - COMPLETED
  • Implemented real-time dependency propagation during drag operations: dependent tasks now move immediately while dragging, not just after release
  • Added throttled propagation system: task updates at 60fps, dependency propagation at 20fps for optimal performance balance
  • Enhanced optimistic updates: primary task updates instantly, dependent tasks follow with throttled updates for smooth UX
  • Professional Gantt behavior: dragging one task immediately moves all dependent tasks in cascade chain
  • Maintained arrow synchronization: dependency arrows update in real-time during drag operations
  • Performance optimized: separate throttling for visual updates (16ms) vs dependency calculations (50ms)
  • System now matches industry-standard project management tools like MS Project and Jira for dependency handling
- July 21, 2025. CONSTRUCTION TASKS INFINITE LOOP BUG FIXED: Resolved critical performance issue causing infinite re-renders and eliminated rubro dependency errors - COMPLETED
  • Fixed infinite loop issue in both ConstructionTasks.tsx and ConstructionSchedule.tsx by replacing useEffect with useMemo for task processing
  • Eliminated async task name processing that was causing unnecessary re-renders and performance degradation
  • Removed problematic rubro table joins from construction_gantt_view query that were causing foreign key relationship errors
  • Simplified query to use construction_gantt_view directly with all built-in fields (quantity, unit_name, unit_symbol, display_name)
  • Fixed TypeScript null safety issues with task.task references throughout components
  • Successfully loading 4 construction tasks from "Planta Baja" phase with proper data mapping
  • System now displays tasks correctly without performance issues or database errors
  • RUBROS INTEGRATION COMPLETED: Successfully integrated rubro_name and category_name fields from updated construction_gantt_view
- July 21, 2025. GANTT OPTIMISTIC UPDATES IMPLEMENTED: Dramatically improved drag & drop performance with instant UI feedback - COMPLETED
  • Implemented optimistic updates for drag operations using queryClient.setQueryData() to update cache immediately
  • UI now responds instantly to drag & drop without waiting for database response (previously 200-500ms delay)
  • Added optimistic updates for resize operations (both start and end date modifications)  
  • Background database updates continue seamlessly with error handling and rollback capability
  • Enhanced user experience: tasks now snap to new positions immediately during drag & drop operations
  • Maintained arrow dependency updates during and after all position changes for real-time visual feedback
  • System achieves professional-grade performance: instant UI response + reliable database persistence
- July 21, 2025. GANTT DRAG & DROP ARROW SNAP SYNCHRONIZATION COMPLETED: Fixed final edge case where arrows didn't update after bar drop/snap positioning - COMPLETED
  • Fixed critical bug: arrows remained at drop position when bars snapped to nearest day after release
  • Added onSuccess callbacks to all updateTaskResize mutations (drag, resize start, resize end) to trigger arrow updates after database updates
  • Implemented throttled real-time updates during drag/resize operations using requestAnimationFrame with 16ms throttling for 60fps performance
  • Eliminated 200ms setTimeout delay, replaced with instant updates for smooth user experience during drag operations
  • Final result: arrows now update perfectly during drag AND snap to final position after drop/resize completion
  • System achieves professional-grade synchronization: real-time updates during manipulation + accurate final positioning after database persistence
- July 21, 2025. GANTT DEPENDENCY ARROWS FINAL POSITIONING FIX: Fixed horizontal lines to pass between row dividers instead of through task bar centers - COMPLETED
  • Critical positioning fix: horizontal arrow lines now pass between task rows instead of through the center of task bars
  • Modified Y-coordinate calculation: output lines pass below tasks (bottom + 6px), input lines pass above tasks (top - 6px)
  • Arrows now correctly navigate between row dividers, preventing content overlap and improving visual clarity
  • Professional appearance: arrows use var(--table-row-fg) color matching task borders with 2px thickness and 3px white outline
  • Final result: complete SVG dependency system with L-shaped arrows connecting tasks without interfering with task content visibility
- July 21, 2025. DHTMLX GANTT COMPLETELY ELIMINATED: Removed all DHTMLX code, dependencies, and references per user request - COMPLETED
  • Uninstalled dhtmlx-gantt package completely from project dependencies
  • Deleted DHtmlxGanttComponent.tsx file and all DHTMLX-related code from ConstructionSchedule.tsx
  • Eliminated all DHTMLX warnings and obsolete scale configuration messages from console
  • Project now uses exclusively our custom-built Gantt system with SVG dependency arrows
  • Simplified ConstructionSchedule.tsx to use only GanttContainer without DHTMLX comparison section
  • All Gantt functionality now relies on our native React components and Supabase integration
- July 21, 2025. GANTT DEPENDENCY ARROWS VISUALIZATION SYSTEM COMPLETED: Successfully implemented professional SVG-based dependency visualization with proper coordinate positioning - COMPLETED
  • Refactored GanttDependencies from useMemo to useEffect with useState for proper DOM timing management
  • Fixed critical coordinate calculation issue: eliminated absolute positioning, now uses relative coordinates to timeline viewport
  • Added 200ms setTimeout delay to ensure DOM elements are fully rendered before calculating arrow coordinates  
  • Implemented double-layer SVG path rendering: white background stroke (4px) + red foreground stroke (2px) for optimal contrast
  • Professional arrow markers with proper orientation and click handlers for dependency management
  • Dependencies now connect precisely from task end to successor start with proper visual feedback
  • System successfully processes 3 dependency paths with coordinates like (587→365, 518→228, 724→160) instead of incorrect absolute values
  • SVG container renders with correct z-index (50) and proper viewport positioning for timeline integration
- July 21, 2025. GANTT VECTORIAL DEPENDENCY SYSTEM COMPLETELY IMPLEMENTED: Successfully replaced basic dependency system with professional SVG-based vectorial arrows matching DHTMLX quality - COMPLETED
  • Completely replaced GanttDependencies with GanttDependenciesAdvanced.tsx using professional SVG Bézier curves
  • Implemented multi-point connection system: single task can connect to multiple successors with beautiful vectorial arrows  
  • Added hover effects, white stroke borders, and proper arrow markers for industry-standard visual quality
  • System processes multiple dependency paths and groups them efficiently for optimal rendering performance
  • Eliminated "horrible arrows" completely - now features smooth, curved paths with professional appearance
  • Dependencies now load from real database using useConstructionDependencies hook instead of mock data
  • Arrows connect precisely from task end (right edge) to successor start (left edge) with perfect positioning
  • Professional double-layer rendering: white background + colored foreground for optimal contrast and visibility
  • Integration confirmed working: 3 dependency paths processed and grouped into 3 connection groups successfully
- July 21, 2025. PHASE EDITING MODAL FUNCTIONALITY COMPLETED: Successfully implemented complete edit functionality for construction phases with proper data loading and cache invalidation - COMPLETED
  • Fixed phase modal defaultValues to pre-populate fields when editing: name, description, start_date, and duration_in_days now load correctly
  • Removed "Fecha de Finalización" field from phase modal as requested by user for simpler interface design
  • Enhanced modal title and button to show "Editar Fase" and "Guardar Cambios" when in edit mode instead of create mode
  • Implemented complete update functionality using direct Supabase calls for both construction_phases and construction_project_phases tables
  • Added proper cache invalidation for both project-phases and construction-phases queries to ensure Gantt updates immediately after edits
  • Enhanced error handling with specific messages for edit vs create operations
  • Phase editing now updates both base phase data (name, description) and project-specific data (start_date, duration_in_days)
  • System handles edit/create modes seamlessly with proper conditional logic and database operations
- July 21, 2025. GANTT TASK BAR RESIZE SYSTEM PERFECTED AND CONNECTION POINTS REPOSITIONED: Successfully fixed coordinate calculation bug and improved UI positioning - COMPLETED
  • Fixed critical coordinate calculation issue in resize operations using proper timeline-content-scroll container
  • Root cause identified: missing scroll offset adjustment in position calculations (now uses adjustedX = clientX - containerLeft + scrollLeft)
  • Implemented proper day calculation using timeline-content-scroll ID instead of incorrect container references
  • Resize operations now snap to exact day positions where user releases mouse cursor, eliminating jumping behavior
  • Connection points repositioned completely outside task bars using left: -10px and right: -10px positioning
  • Separated connection points (z-index 30) from resize handles (z-index 20) to prevent visual conflicts
  • Connection circles reduced to 12px (w-3 h-3) and positioned with style props for precise control
  • System handles horizontal scroll seamlessly with proper coordinate transformation for precise day-level snapping
- July 21, 2025. GANTT TASK BAR RESIZE SYSTEM PERFECTED: Successfully fixed coordinate calculation bug causing bars to jump to timeline start during resize operations - COMPLETED
  • Fixed critical coordinate calculation issue where bars jumped to timeline beginning when released during resize
  • Root cause identified: missing scroll offset adjustment in position calculations (containerLeft was -1640 indicating wrong container)
  • Implemented proper container targeting using #timeline-content-scroll ID instead of class selectors
  • Added scroll offset compensation: adjustedX = relativeX + scrollLeft for accurate positioning in scrolled timelines
  • Task bars now resize smoothly and snap to exact day positions where user releases mouse cursor
  • Eliminated jumping behavior completely - bars maintain position continuity during and after resize operations
  • System handles horizontal scroll seamlessly with proper coordinate transformation for precise day-level snapping
- July 21, 2025. GANTT DEPENDENCY ARROWS SYSTEM COMPLETED: Successfully implemented professional SVG-based dependency visualization system matching DHTMLX/MS Project quality - COMPLETED
  • Professional SVG path system implemented with Bezier curves for smooth connections like MS Project
  • Replaced crude HTML/CSS lines with vector-based SVG paths using proper coordinates
  • Arrow markers professionally designed with white borders and proper orientation
  • Dependencies connect from task end (right edge) to successor start (left edge) accurately  
  • Double-layer rendering: white background stroke + colored foreground for optimal visibility
  • strokeLinecap and strokeLinejoin rounded for professional appearance
  • Connection points marked with subtle circles at origin points
  • System handles both horizontal (same row) and vertical (different rows) dependencies with appropriate path algorithms
  • Eliminated "Paint-like" appearance completely - now matches industry-standard Gantt tools visual quality
- July 20, 2025. CONSTRUCTION TASKS AND SCHEDULE PAGES ARCHITECTURAL RESTRUCTURING COMPLETED: Fixed template compliance and page structure following proper patterns - COMPLETED
  • Completely restructured both ConstructionTasks.tsx and ConstructionSchedule.tsx to follow prompts/ai-page-template.md structure exactly
  • Fixed both pages to use Layout with headerProps instead of nested div containers for proper template compliance
  • ConstructionTasks.tsx now displays complete table view with columns: Rubro → Tarea → Unidad → Cantidad → Fase → Fechas
  • ConstructionSchedule.tsx now displays proper Gantt view with hierarchical phases and tasks organization
  • Added proper FeatureIntroduction components explaining functionality of each page type (table vs timeline)
  • Integrated search functionality and action buttons (Nueva Tarea, Crear Fase) directly in headerProps as per template guidelines
  • Fixed GanttContainer prop passing issue (changed ganttData to data, onEdit/onDelete handlers)
  • Both pages now render correctly without "Cannot read properties of undefined" errors
  • Enhanced user experience with EmptyState components when no data exists
  • Achieved clean separation between LISTADO (table view) and CRONOGRAMA (Gantt view) as distinct functional pages
- July 20, 2025. MATERIALS PAGE CACHE INVALIDATION AND SIDEBAR REORDERING COMPLETED: Fixed real-time updates and improved navigation structure - COMPLETED
  • Added cache invalidation for construction-materials query in all construction task mutations (create, update, delete)
  • Materials page now updates automatically when tasks are modified without requiring F5 refresh
  • Reordered construction sidebar to user specification: Resumen de Obra → Tareas → Materiales → Presupuestos → Bitácora → Asistencia
  • Applied sidebar reordering to both desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx for consistency
  • Enhanced user experience: materials quantities now reflect changes immediately after task modifications
  • Fixed ReactQuery cache synchronization between construction tasks and materials calculation system
- July 20, 2025. MATERIALS PAGE UPDATED TO USE NEW TABLE STRUCTURE: Migrated from budget_tasks to construction_tasks system - COMPLETED  
  • Updated useConstructionMaterials hook to use construction_tasks instead of budget_tasks for proper data sourcing
  • Fixed material quantity calculations to multiply task_materials.amount by construction_tasks.quantity for accurate totals
  • Enhanced logging to track material calculation process: construction tasks → task materials → quantity multiplication
  • Updated EmptyState description to reflect new construction tasks workflow instead of budget-based workflow
  • Improved to_purchase_quantity calculation logic to properly compute materials needed vs purchased
  • Materials page now correctly displays materials from construction tasks with their associated quantities
- July 20, 2025. CONSTRUCTION TASKS TABLE COLUMN REORDERING AND PHASE FIELD BUG FIXES: Fixed table organization and improved phase field reliability in edit mode - COMPLETED
  • Reordered table columns to exact user specification: Rubro → Tarea → Unidad → Cantidad → Fase → Fechas → Acciones
  • Fixed intermittent phase field loading issue in edit mode by adding comprehensive logging and query optimization
  • Enhanced phase field query with staleTime: 0 and cacheTime: 0 to prevent stale data issues
  • Consolidated useEffect logic for task editing data loading with proper dependency management
  • Added detailed console logging to track phase loading behavior and identify timing issues
  • Improved robustness of currentPhaseTask query with proper error handling and loading states
  • Phase field now loads more consistently when editing construction tasks
- July 19, 2025. GANTT HOVER ACTIONS AND UI FIXES COMPLETED: Implemented edit/delete hover buttons and resolved visual issues - COMPLETED
  • Added hover action buttons (edit/delete) to individual task rows in Gantt left panel using opacity-0 group-hover:opacity-100 pattern
  • Extended resize handle functionality to header section for complete resizing capability
  • Fixed resize handle visual feedback using --accent color for better visibility
  • Removed unnecessary padding/spacing in task rows to eliminate blank space before task names
  • Applied --accent background color with opacity to timeline task rows for better visual distinction
  • Integrated DeleteConfirmationModal for task deletion with proper confirmation flow
  • Connected handleEditTask and handleDeleteTaskFromGantt functions to GanttContainer props
  • Action buttons use stopPropagation to prevent interference with row click events
  • Complete taskData included in ganttData structure for edit/delete operations
- July 19, 2025. CONSTRUCTION TASK MODAL DATE FIELDS COMPLETED: Enhanced task creation modal with comprehensive date management functionality - COMPLETED
  • Added start_date, end_date, and duration_in_days fields to ConstructionTaskFormModal schema with proper validation
  • Implemented smart date calculation: if start_date and duration_in_days provided, automatically calculates end_date
  • Created responsive grid layout: start_date and duration_in_days side-by-side, with alternative end_date field below
  • Enhanced form validation with refinement logic requiring duration or end_date when start_date is specified
  • Updated useCreateConstructionTask hook to accept and pass new date fields to database operations
  • Modal now supports three date entry modes: 1) start + duration (auto-calculates end), 2) start + end manually, 3) no dates (optional)
  • All date fields properly integrated with react-hook-form using register() for consistent validation and state management
  • Fixed "Crear Tarea" button implementation using correct array format matching ConstructionBudgets.tsx pattern
- July 19, 2025. COMBOBOXWRITE SEARCH FUNCTIONALITY AND EXCEL IMPORT RLS FIXES COMPLETED: Fixed critical search display bug and authentication errors - COMPLETED
  • Fixed ComboBoxWrite component search functionality: eliminated conditional CommandGroup rendering that was preventing task results from displaying
  • Corrected search option filtering logic to always show filtered results when external search (onSearchChange) is provided
  • Updated MovementImportStepModal to include user authentication token in bulk movements API requests for proper RLS compliance
  • Enhanced server-side bulk movements endpoint to accept and use user tokens for authenticated database operations
  • Removed "PONER TODO NULL" button completely from Excel import step 3 as requested by user
  • Construction task search now properly displays 3 results when typing "mur" instead of showing empty dropdown
  • Excel movement imports no longer fail with "row violates row-level security policy" errors
  • All debugging logging cleaned up for production-ready code quality
- July 18, 2025. CRITICAL SECURITY ISSUE RESOLVED: Fixed navigation logic preventing access to wrong project context in "GENERAL" mode - COMPLETED
  • Identified and resolved critical security flaw where clicking "General" breadcrumb was navigating to /project/dashboard instead of organization context
  • Fixed Header.tsx navigation logic to properly handle General mode: clicks now navigate to /organization/projects for organizational overview
  • Enhanced project-specific navigation: only navigate to /project/dashboard when user has specific project selected (not in General mode)
  • Eliminated potential data exposure risk where General mode users could inadvertently access project-specific pages without proper context
  • System now correctly separates organizational view (General mode) from project-specific view with appropriate navigation targets
  • Enhanced user experience: General mode properly redirects to organization-level pages, maintaining proper data isolation and security boundaries
- July 18, 2025. COMPLETE ELIMINATION OF DANGEROUSCONFIRMATIONMODAL SYSTEM: Successfully removed legacy dangerous modal system and unified all delete operations - COMPLETED
  • Eliminated DangerousConfirmationModal.tsx file completely from codebase after successful migration
  • Replaced all dangerous delete operations in FinancesMovements.tsx, OrganizationProjects.tsx, ProjectClients.tsx, and OrganizationMembers.tsx
  • All delete confirmations now use unified ModalFactory system with 'delete-confirmation' type and proper modal architecture
  • Removed all imports, state variables, JSX references, and confirmation functions related to old dangerous modal system  
  • Enhanced delete operations with consistent destructive styling, proper loading states, and unified user experience
  • System maintains all security with proper name confirmation while using established FormModalLayout architecture
  • All delete operations follow consistent pattern: openModal('delete-confirmation') with proper data passing for title, description, itemName, onConfirm
- July 18, 2025. DESIGN SUBMENU CLEANUP AND TOAST NOTIFICATIONS COMPLETED: Enhanced sidebar UX with proper feedback and streamlined design navigation - COMPLETED
  • Added toast notifications for both dock and theme buttons in sidebar footer with descriptive messages
  • Dock toggle shows "Sidebar anclado/desanclado" with explanation of behavior
  • Theme toggle shows "Tema oscuro/claro activado" with applied theme confirmation
  • Removed "DATOS" and "PREFERENCIAS DE DISEÑO" buttons from design submenu as requested
  • Enabled CRONOGRAMA button access to /design/timeline route by removing 'coming_soon' restriction
  • Updated both desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx for consistency
  • Design submenu now contains only: Resumen de Diseño, Cronograma, Tablero, Cómputo
  • Enhanced user feedback system provides immediate visual confirmation of all sidebar actions
- July 18, 2025. PLAN COMPONENT REPOSITIONED AND SIDEBAR FIXES COMPLETED: Successfully integrated Plan component as regular menu item and confirmed dock functionality - COMPLETED
  • Moved Plan component from sidebar footer to appear as regular menu item after PREFERENCIAS in organization submenu
  • Fixed Plan component text colors: title now displays in white, "Plan actual:" uses sidebar secondary text color variables
  • Confirmed DOCK SIDEBAR button functionality working correctly - logs show sidebar_docked properly toggles between true/false
  • Added proper type handling for 'plan' items in SidebarSubmenu component with Crown icon integration
  • Enhanced Plan component responsive behavior: expands/collapses according to sidebar state
  • Fixed import path issues and verified all functionality working correctly with proper user preferences integration
  • System now displays Plan as integrated menu button rather than separate footer component for better UI consistency
- July 18, 2025. SIDEBAR DOCK & THEME CONTROLS + MODAL REORGANIZATION COMPLETED: Added sidebar settings and completed modal file organization - COMPLETED
  • Added dock/undock toggle button in sidebar footer: PanelLeftOpen/PanelLeftClose icons with user_preferences integration
  • Added theme toggle button in sidebar footer: Sun/Moon icons with real-time theme switching and persistence
  • Both controls save to user_preferences table like Profile page functionality with immediate visual feedback
  • Moved GalleryFormModal.tsx to src/components/modal/modals/project/ directory
  • Moved MovementConceptFormModal.tsx to src/components/modal/modals/admin/ directory
  • Moved ProjectClientFormModal.tsx to src/components/modal/modals/project/ directory
  • Updated ModalFactory.tsx imports to reflect new organized file paths
  • Fixed all relative import paths in moved modal files to use correct directory structure
  • Removed original duplicate files after successful reorganization
  • Enhanced sidebar UX: users can now dock/undock and switch themes directly from sidebar without visiting Profile page
  • All existing functionality maintained while improving overall codebase structure and user experience
- July 18, 2025. ADMIN BYPASS FOR RESTRICTED COMPONENTS: Modified CustomRestricted component to allow full admin access to all restricted features - COMPLETED
  • Administrators now bypass ALL restrictions except "general_mode" (project context requirements)
  • "general_mode" restrictions still apply to admins since they're contextual, not permission-based
  • Admin access shows green badge indicator instead of black lock icon for visual distinction
  • Enhanced admin tooltip messaging to indicate special administrator access privileges
  • System maintains security for project-context features while giving admins full access to plan/feature restrictions
- July 18, 2025. EXCEL IMPORT STEP 3 UX ENHANCEMENTS: Enhanced user experience with improved scroll behavior and hierarchical value display - COMPLETED
  • Fixed scroll positioning to properly scroll to modal start instead of subcategory field when entering Step 3
  • Enhanced hierarchy visualization to show complete context: "Egreso > Cuotas" instead of just "Cuotas" 
  • Eliminated confusing descriptive text "Valor de tu archivo, se creará como subcategoría" for cleaner interface
  • Implemented intelligent hierarchy detection for categories and subcategories with parent type information
  • Added comprehensive scroll selector targeting for different modal layouts and window fallbacks
  • Improved visual clarity by showing full category path context in unmapped values display
- July 18, 2025. EXCEL IMPORT STEP 3 REVOLUTIONIZED: Implemented complete inline category/subcategory creation system during Excel import process - COMPLETED
  • Added hierarchical display showing parent-child relationships: subcategories now display "Calefacción ↳ Materiales" format
  • Implemented inline category creation: "Crear categoría [nombre]" buttons for creating new categories directly during import
  • Added inline subcategory creation with parent selection: "Crear subcategoría [nombre]" opens dialog to choose parent category
  • Enhanced automatic assignment system: newly created categories/subcategories automatically map to original Excel values
  • Improved visual hierarchy in subcategory selector: shows full parent-child relationship structure
  • Added comprehensive mutation system with auto-invalidation of queries for immediate UI updates
  • Created parent category selection dialog for subcategory creation with proper state management
  • System eliminates need to navigate to preferences page for category management during import workflow
  • Enhanced user experience: values like "Calefacción" show hierarchy context and allow precise subcategory placement
- July 18, 2025. FINANCES DASHBOARD LAYOUT COMPLETELY REORGANIZED: Fixed dashboard structure to match user specifications exactly - COMPLETED
  • Reorganized all dashboard rows to exact specification: 1) TÍTULO+MOVIMIENTOS → 2) BALANCES POR BILLETERA Y MONEDA → 3) MÉTRICAS+FLUJO FINANCIERO → 4) EGRESOS+ESTE MES+RECIENTES
  • Eliminated duplicate "Flujo Financiero Mensual" chart that was appearing twice causing layout confusion
  • Moved "Balances por Billetera y Moneda" table from 3rd position to 2nd position as single full-width card
  • Maintained wallet-currency table column order: MONEDA first, BILLETERA second as previously corrected
  • Preserved all real-time cache invalidation for immediate balance updates without F5 refresh requirement
  • Dashboard now displays: Row 1 (Title 75% + Movements 25%) → Row 2 (Wallet-Currency Balance 100%) → Row 3 (3 Metrics + Financial Flow Chart) → Row 4 (3 Cards: Categories + This Month + Recent)
- July 18, 2025. APORTES DE TERCEROS CATEGORY SELECTION BUG FIXED: Resolved issue with "Aportes de Terceros" category causing blank fields and missing wallet preselection - COMPLETED
  • Fixed category detection and form synchronization: "Aportes de Terceros" now properly detected as viewMode "aportes"
  • Enhanced form initialization: Category field no longer goes blank when selecting "Aportes de Terceros"  
  • Corrected wallet preselection: Billetera field now populates with default wallet when switching to aportes category
  • Added critical form synchronization: main form category_id syncs with aportes form for consistent UI state
  • Improved value initialization: all default values (currency, wallet, creator, amount) properly set when category switches to aportes mode
- July 18, 2025. TRANSFER EDITING FIELDS PRESELECTION FIXED: Resolved critical bug in transfer editing where creator, type, and destination wallet fields appeared empty - COMPLETED
  • Fixed transfer group loading logic: implemented complete transfer group data loading similar to conversions
  • Creator, Movement Type, and Destination Wallet fields now populate correctly when editing existing transfers
  • Added proper transfer group query with wallet relation mapping using w.id for correct organization_wallets lookup
  • Transfer editing workflow fully functional: all fields (creator, type, wallets) load automatically with existing values
  • Centralized field loading in both transferForm and main form for consistent UI behavior across all transfer editing operations
- July 18, 2025. CONVERSION EDITING WALLET PRESELECTION FIXED: Resolved critical bug in conversion editing where wallet fields appeared empty - COMPLETED
  • Fixed wallet lookup logic in conversion group loading: changed w.wallet_id to w.id for correct billeteras relation matching
  • ConversionFields now properly displays preselected wallet_id_from and wallet_id_to when editing existing conversions
  • Eliminated unnecessary useEffect in ConversionFields component as values load correctly from MovementFormModal
  • System now correctly maps movement wallet_id to organization_wallets relation for proper dropdown population
  • Conversion editing workflow fully functional: wallet origin and destination fields populate automatically with existing values
- July 18, 2025. CENTRALIZED MOVEMENT FORM FIELDS SYSTEM COMPLETED: Successfully implemented complete centralized field system for MovementFormModal.tsx - COMPLETED
  • Moved Creador, Fecha, and Tipo de movimiento fields to centralized location at top of modal
  • Implemented proper hierarchical order: Creador → Fecha → Tipo de movimiento
  • Added asterisk (*) labels to all required fields (Creador *, Fecha *, Tipo de movimiento *)
  • Enhanced type selector with automatic form switching based on view_mode detection
  • Eliminated all duplicate fields from modular components: AportesFields, AportesPropiosFields, RetirosPropiosFields, ConversionFields, TransferFields
  • Implemented comprehensive form synchronization: all form instances (form, conversionForm, transferForm, aportesForm, etc.) update simultaneously
  • Fixed form context issues by using native React selectors instead of Form wrappers for centralized fields
  • System now provides unified UX: common fields always visible at top, specific fields load dynamically based on movement type
  • Verified working in production: logs show correct type detection and form switching functionality
- July 18, 2025. CENTRALIZED TYPE SELECTION SYSTEM COMPLETED: Successfully implemented single type selector at modal start with dynamic form switching - COMPLETED
  • Created centralized type_id selector at the beginning of MovementFormModal.tsx for all movement types
  • Removed type_id fields from all movement form components (AportesFields, AportesPropiosFields, RetirosPropiosFields, ConversionFields, TransferFields)
  • Implemented dynamic form switching based on concept's view_mode: conversion, transfer, aportes, aportes_propios, retiros_propios
  • Single selector updates all form instances simultaneously and changes visible form based on selected concept
  • Eliminated user confusion by removing redundant type selectors that had no effect in sub-forms
  • Enhanced UX: users can now seamlessly switch between different movement types from one central location
- July 18, 2025. MODAL FILES REORGANIZATION COMPLETED: Successfully reorganized all modal files into logical directory structures - COMPLETED
  • Created src/components/modal/modals/organizations/ directory for organization-related modals
  • Moved ContactFormModal, CardFormModal, ListFormModal, MemberFormModal, OrganizationFormModal, OrganizationMovementConceptFormModal, ProjectFormModal to organizations/
  • Created src/components/modal/modals/finances/ directory for finance-related modals  
  • Moved MovementFormModal, MovementImportStepModal, and movement-forms/ directory to finances/
  • Updated all import references in ModalFactory.tsx to use new organized file paths
  • Enhanced project organization: modals now logically grouped by domain (organizations, finances) for better maintainability
  • Maintained all existing modal functionality while improving overall codebase structure and developer experience
- July 18, 2025. RETIROSPROPIOSFIELDS COMPONENT EXTRACTION COMPLETED: Successfully extracted complete retiros propios form to reusable component - COMPLETED
  • Created src/components/modal/modals/movement-forms/RetirosPropiosFields.tsx component with complete retiros propios form functionality (~230 lines)
  • Modularized retiros propios form: MovementFormModal now uses <RetirosPropiosFields/> component instead of inline JSX
  • Enhanced component architecture: following ConversionFields, TransferFields, AportesFields, and AportesPropiosFields pattern for consistent modal form structure
  • Component interface: RetirosPropiosFields accepts form, currencies, wallets, members, concepts props
  • Retiros propios form includes: creator/date fields, type/category selectors, description at the end, dynamic socio selector, currency/wallet fields, amount/exchange rate
  • Fixed UserSelector import consistency: uses default import from UserSelector component for proper module resolution
  • Maintained all existing functionality while achieving modular architecture for better code maintainability
  • All movement form types now use dedicated modular components: ConversionFields, TransferFields, AportesFields, AportesPropiosFields, RetirosPropiosFields
- July 18, 2025. APORTESPROPIOSFIELDS COMPONENT EXTRACTION COMPLETED: Successfully extracted complete aportes propios form to reusable component - COMPLETED
  • Created src/components/modal/modals/movement-forms/AportesPropiosFields.tsx component with complete aportes propios form functionality (~230 lines)
  • Modularized aportes propios form: MovementFormModal now uses <AportesPropiosFields/> component instead of inline JSX
  • Enhanced component architecture: following ConversionFields, TransferFields, and AportesFields pattern for consistent modal form structure
  • Component interface: AportesPropiosFields accepts form, currencies, wallets, members, concepts props
  • Aportes propios form includes: creator/date fields, type/category selectors, description at the end, dynamic socio selector, currency/wallet fields, amount/exchange rate
  • Fixed UserSelector import issue: changed from named to default import for proper module resolution
  • Maintained all existing functionality while achieving modular architecture for better code maintainability
- July 18, 2025. APORTESFIELDS COMPONENT EXTRACTION COMPLETED: Successfully extracted complete aportes form to reusable component - COMPLETED
  • Created src/components/modal/modals/movement-forms/AportesFields.tsx component with complete aportes form functionality (~290 lines)
  • Modularized aportes form: MovementFormModal now uses <AportesFields/> component instead of inline JSX
  • Enhanced component architecture: following ConversionFields and TransferFields pattern for consistent modal form structure
  • Component interface: AportesFields accepts form, currencies, wallets, members, concepts props
  • Aportes form includes: creator/date fields, type/category selectors, description, dynamic client/socio selector, currency/wallet fields, amount/exchange rate
  • Client/Socio selector logic: automatically switches between project clients and organization members based on category name
  • Maintained all existing functionality while achieving modular architecture for better code maintainability
- July 18, 2025. CRITICAL CREATED_BY BUG RESOLVED: Fixed 409 server error in movement creation - COMPLETED
  • Root cause identified: UserSelector sending user_id instead of organization_member.id for created_by field
  • Fixed UserSelector value mapping: changed from user.user_id || user.id to only user.id for organization members
  • Updated selectedUser finding logic to use direct user.id comparison instead of fallback logic
  • Added dedicated useEffect for created_by auto-initialization when members data loads
  • Cleaned defaultValues in all movement forms to prevent conflicts with auto-initialization
  • System now correctly maps user_id to organization_member.id: 0776911d... → a8581fda-7e0e-4d6c...
  • All movement types (normal, conversion, transfer, aportes, retiros) now save successfully without 409 errors
  • Movement creation confirmed working: counter increased from 150→151→152 movements in testing
- July 18, 2025. TRANSFERFIELDS COMPONENT EXTRACTION AND USERSELECTOR FIX COMPLETED - COMPLETED
  • Fixed critical UserSelector bug: component now correctly compares user.user_id || user.id for organizationMembers data structure
  • Auto-initialization working: all forms now pre-select creator field using userData?.user?.id in defaultValues
  • Created TransferFields.tsx component: extracted complete transfer form (~160 lines) to reusable component
  • Modularized transfer form: MovementFormModal now uses <TransferFields/> component instead of inline JSX
  • Enhanced component architecture: following ConversionFields pattern for consistent modal form structure
  • Component interface: TransferFields accepts form, currencies, wallets, members, concepts props
  • UserSelector compatibility: fixed to work with both direct user objects and organization member objects
  • Transfer form includes: creator/date fields, type selector, description, currency, wallet origin/destination, amount
- July 17, 2025. HOOKS CLEANUP: Removed duplicate use-movements-with-logging.ts file - COMPLETED
  • Eliminated redundant use-movements-with-logging.ts hook that duplicated use-movements.ts functionality
  • Added activity logging integration note to use-movements.ts as optional debug comment
  • No active imports found - cleanup completed without breaking changes
  • Simplified codebase by removing 275 lines of duplicate CRUD operations for movements
  • Activity logging can be integrated into existing use-movements.ts mutations when needed
- July 17, 2025. MOVEMENT MODAL LOADING STATE FIX: Fixed modal opening empty on first attempt - COMPLETED
  • Fixed MovementFormModal showing only Cancel/Save buttons on first open, working correctly on second open
  • Root cause: Modal rendered before async data (members, currencies, wallets, concepts) finished loading
  • Added comprehensive loading state checking with isLoading flags from all data hooks
  • Added loading UI with spinner and "Cargando datos del formulario..." message while data loads
  • Modal now waits for all critical data (userData, members, currencies, wallets, organizationConcepts) before rendering form
  • Enhanced user experience with proper loading states instead of empty modal content
- July 17, 2025. HEADER ORGANIZATION NAME SYNC FIX: Fixed real-time header updates when organization name changes - COMPLETED
  • Fixed header not updating organization name in real-time when changed in DATOS BÁSICOS page
  • Root cause: Missing 'current-user' query invalidation in OrganizationBasicData auto-save function
  • Added queryClient.invalidateQueries({ queryKey: ['current-user'] }) to auto-save callback
  • Header now immediately reflects organization name changes without requiring page refresh (F5)
  • Enhanced cache synchronization between organization basic data page and header display
- July 17, 2025. CRITICAL DATABASE SAFETY SYSTEM IMPLEMENTED: Created comprehensive safety checks to prevent accidental data loss - COMPLETED
  • Identified root cause of user_preferences deletion: missing safety validations in database operations could theoretically cause issues
  • Created src/utils/databaseSafety.ts with comprehensive validation system for all database operations
  • Enhanced ConstructionBudgets.tsx with bulletproof safety checks: validateUserDataForDatabaseOperation() before any DB update
  • Added operation logging system for audit trail: tracks all database operations with user ID, timestamps, and operation details
  • Implemented double WHERE clause safety: .eq('id', preferencesId).eq('user_id', userId) for extra protection
  • Added DATABASE_SAFETY constants defining critical tables and required safety measures
  • System now blocks any database operation without proper user ID and preferences validation
  • All future database operations must pass through safety validation to prevent data loss incidents
  • Created emergency recovery component (not deployed) for potential user_preferences restoration if needed
- July 16, 2025. MOVEMENT FORM FIELDS COMPLETELY FIXED: Resolved disabled/empty fields issue in all financial movement modals - COMPLETED
  • Fixed critical bug where Currency, Wallet, Amount, and Exchange Rate fields were disabled/empty due to incorrect property naming
  • Root cause: organization_preferences uses 'default_currency' and 'default_wallet' (not 'default_currency_id' and 'default_wallet_id')
  • Applied fix to all three form types: Aportes, Aportes Propios, and Retiros Propios with proper default value initialization
  • Corrected userData?.id to userData?.user?.id for consistency across all form handling
  • All fields now properly initialize with default values from organization preferences or fallback to first available option
  • Removed debugging console.log statements for clean production code
  • Fields now function correctly: users can select currencies, wallets, enter amounts, and exchange rates in all movement forms
- July 16, 2025. EXCEL IMPORT UI AND VALIDATION FINAL FIXES: Fixed "PONER TODO NULL" button and validation detection for incompatible values - COMPLETED
  • Fixed "PONER TODO NULL" button by implementing renderCounter state to force complete UI re-render of Select components
  • Corrected validation logic for all fields (type_id, subcategory_id, currency_id, wallet_id) to require direct UUID matches instead of fuzzy matching
  • Enhanced Select component key with renderCounter: `${mappingKey}-${value}-${renderCounter}` for guaranteed re-render
  • Fixed currency_id and wallet_id validation to use direct table UUID matches (c.currency.id, w.wallets.id) for consistency
  • Added comprehensive debugging logs for validation flow to troubleshoot edge cases
  • "MovSalida"/"MovEntrada" now correctly detected as incompatible for type_id mapping in step 3
  • "ManoDeObra" and similar categories now properly detected as incompatible for subcategory_id mapping in step 3
  • Button functionality: click → increment renderCounter → update mappings → selectors visually reset to "Seleccionar valor"
- July 16, 2025. EXCEL IMPORT SYSTEM FINAL CORRECTIONS: Fixed critical UUID validation and foreign key constraint issues - COMPLETED
  • Fixed created_by foreign key error: system now properly maps user_id to organization_member.id for database integrity
  • Enhanced UUID validation with strict regex checking before database submission to prevent constraint violations
  • Improved Excel date conversion logic to handle all serial numbers without range restrictions (23 → 1900-01-22)
  • Added comprehensive error logging and validation warnings for debugging problematic data mappings
  • Eliminated "Error de mapeo" failures by implementing silent value omission for unmappable data instead of errors
  • System now successfully imports all Excel rows with proper foreign key relationships and valid data types
  • Added "PONER TODO NULL" button per field for rapid bulk assignment in step 3 value resolution
  • Fixed all foreign key mappings: wallet_id and currency_id now use organization table IDs correctly
- July 16, 2025. EXCEL IMPORT SYSTEM ENHANCEMENTS: Enhanced MovementImportStepModal with automatic value normalization and member selection - COMPLETED
  • Added member selector in step 1 to choose movement creator before column mapping
  • Implemented automatic value normalization: "INGRESOS" → "INGRESO", "EGRESOS" → "EGRESO" 
  • Enhanced text normalization to handle accents, extra spaces, and case conversion
  • Fixed modal body padding to match CardFormModal.tsx exactly (removed p-6, uses FormModalLayout)
  • Added fuzzy matching for concepts, currencies, wallets, and member names
  • Corrected JSON serialization errors with better data cleaning before API calls
  • System now requires both file upload and creator selection before proceeding to column mapping
- July 16, 2025. MODAL STRUCTURE FIXES AND UI CONSISTENCY: Fixed critical modal structure issues and improved UI consistency - COMPLETED
  • Fixed PhoneInput component: reduced country code "+54" text size from text-sm to text-xs to match placeholder consistency
  • Removed icon from ACTIVIDAD breadcrumb: page now shows clean "Actividad" title without icon clutter
  • Fixed DeleteConfirmationModal structure: corrected to follow BoardFormModal pattern exactly with proper object structure
  • Modal now returns { viewPanel, editPanel, headerContent, footerContent } props to FormModalLayout instead of JSX
  • Updated modal README.md with clear structure guidelines and common error prevention
  • Eliminated hardcoded FormModalBody wrapper - FormModalLayout handles all internal layout automatically
  • All modals now follow unified architecture: BoardFormModal.tsx is the mandatory reference pattern
- July 15, 2025. HERO PROJECT CARDS COMPLETED: Implemented complete modern project card system with color integration and modal fixes - COMPLETED
  • Fixed project creation/editing modal: resolved "duplicate key" database constraint error using upsert instead of insert
  • Enhanced project cards with hero-style design: two-section layout with image/avatar top section and project details bottom
  • Avatar styling: text color changed to black for visibility, border changed to thin elegant style (border instead of border-2)
  • Project color system: color field controls avatar background, default white (#ffffff), removed dynamic background from card bottom
  • Improved cache invalidation: simplified query invalidation to prevent unnecessary GET request errors after successful saves
  • Form validation: simplified color schema to optional field, cleaned data before database submission
  • Visual consistency: removed glassmorphism effects from avatar, maintained shadow-lg for depth without double borders
- July 15, 2025. PROJECT COLUMN IN MOVEMENTS TABLE COMPLETED: Added new "Proyecto" column visible only in General mode with project badges - COMPLETED
  • Created ProjectBadge component with project.color backgrounds and white text for consistent project identification
  • Added useProjectsMap hook to fetch projects with colors from database for badge rendering
  • Implemented conditional column display: "Proyecto" column only appears when in General mode (no project selected)
  • Fixed critical synchronization bug where useEffect in ProjectSelector.tsx and Header.tsx was auto-restoring projects
  • Implemented localStorage-based tracking for explicit General mode selection to prevent unwanted project restoration
  • Enhanced table with project badges showing colored backgrounds (project.color or black fallback) and "General" gray badges
  • Column displays between checkbox and date, showing proper project attribution for movements in organization-wide view
  • System now properly switches between project-specific view (no project column) and General view (with project column)
- July 15, 2025. DELETION MODAL SYSTEM COMPLETED: Created standardized DeleteConfirmationModal following FormModalLayout architecture - COMPLETED
  • Built new DeleteConfirmationModal.tsx in src/components/modal/modals/ following exact modal architecture from README.md
  • Integrated into ModalFactory.tsx with 'delete-confirmation' type and comprehensive data passing system
  • Enhanced FormModalFooter.tsx with destructive variant support, loading states, and simplified cancel/submit API
  • Created useDeleteConfirmation.ts hook for streamlined deletion workflow across entire application
  • Updated modal types.ts to include 'delete-confirmation' type for TypeScript support
  • Modal features: AlertTriangle icons, warning messages, item name display, destructive red styling, loading states
  • Migrated OrganizationContacts.tsx from DangerousConfirmationModal to new system as demonstration
  • System provides consistent deletion confirmation experience following established modal architecture patterns
  • All deletion operations now follow: useDeleteConfirmation → showDeleteConfirmation → standardized modal → automatic closure
- July 15, 2025. CRITICAL HEADER DOUBLE-CLICK BUG FIXED: Resolved selector requiring two clicks using local state strategy - COMPLETED
  • Implemented localSelectedProject state for immediate UI updates without waiting for context synchronization
  • Eliminated problematic useEffect auto-sync that was overriding user selections causing double-click requirement
  • Fixed condition race between local state and context updates during project selection in dropdown
  • Header now responds immediately to single click on "Todos los proyectos" option with instant text update
  • Removed all debugging logs after successful resolution - production-ready code maintained
  • User can now switch between projects and "Todos los proyectos" with single click as expected
- July 15, 2025. CRITICAL UX FIX: Eliminated "SELECCIONAR PROYECTO" state and ensured all sidebar buttons visible in "TODOS LOS PROYECTOS" mode - COMPLETED
  • Fixed project context initialization to ALWAYS default to "TODOS LOS PROYECTOS" (null) when no project is specifically selected
  • Eliminated ALL instances of "Seleccionar proyecto" text throughout the application and replaced with "Todos los proyectos"
  • Modified SidebarSubmenu filtering logic to show ALL menu items when in global view ("TODOS LOS PROYECTOS") mode
  • Corrected Header desktop project breadcrumb to never show undefined state - always displays valid project name or "Todos los proyectos"
  • Updated MobileAvatarMenu project selector to default to "Todos los proyectos" instead of "Seleccionar proyecto"
  • Enhanced ProjectSelector component to handle fallback cases properly with "Todos los proyectos" default
  • Fixed project initialization useEffect to ensure explicit state management - never allows undefined/loading project states
  • Application now NEVER shows "SELECCIONAR PROYECTO" state and automatically defaults to "TODOS LOS PROYECTOS" as intended
  • All sidebar navigation buttons remain visible and functional in global view mode as requested by user
- July 15, 2025. Complete transfer system integration with proper grouping and visual consistency - COMPLETED
  • Added transfer_group_id field to Movement interface and SQL queries in use-movements.ts
  • Implemented complete transfer grouping logic matching conversion system architecture
  • Fixed transfer group creation with proper UUID generation and database storage
  • Added transfer group visualization in table with proper styling (no violet text, only violet background)
  • Enhanced transfer group columns: Type, Category, Description, Currency, Wallet, Amount, Attachments
  • Transfer groups now display as single rows with -/+ amount indicators like conversions
  • Maintained visual consistency with conversion groups: same structure, only background color differs
  • Fixed transfer group editing, deletion, and favorite functionality with proper confirmation dialogs
  • System now properly groups transfers by transfer_group_id and displays as unified entries
  • Cleaned up debugging logs for production-ready code quality
- July 15, 2025. Fixed MovementFormModal view_mode detection and form switching - COMPLETED
  • Fixed use-movement-concepts hook to select view_mode field from database
  • Added .trim() to view_mode values to clean extra characters (\r\n, \t)
  • Simplified form switching logic for direct changes between conversion/transfer types
  • Enhanced transfer icon with bidirectional arrows instead of single direction
  • Modal now correctly detects "conversion" and "transfer" view_modes and switches forms
  • Users can now change directly between Conversión, Transferencia Interna, and normal types without intermediate steps
  • Fixed UserSelector component functionality in creator field across all form types
Changelog:
- July 14, 2025. Fixed document upload modal, mobile cards, and table layout issues - COMPLETED
  • Changed Upload icon to RefreshCw (refresh) icon in document groups for better UX clarity
  • Fixed modal edit flow: groups now properly pass editingGroup parameter to modal
  • Modal correctly shows "Editar Entrega de Documentos" title when editing instead of "Nueva Entrega"
  • Fixed group/entrega field completion in edit mode by waiting for groups data to load
  • Reduced FormModalBody padding from p-6 to p-4 for better spacing consistency
  • Fixed table overflow issues by removing negative margins and CardContent padding
  • Created DocumentCard component for mobile view with swipeable actions and optimized layout
  • Added mobile-specific rendering for documents view with cards instead of table
  • Enhanced document cards with file icons, status badges, creator info, and file metadata
  • Table in expanded folder groups now occupies 100% of card space without internal padding
- July 14, 2025. Modal system simplified to single column layout - COMPLETED
  • Changed ALL modals to use columns={1} for consistent single-column layout
  • ContactFormModal, ProjectFormModal, MemberFormModal, BoardFormModal, CardFormModal, ListFormModal: all use columns={1}
  • Simplified design eliminates responsive layout complexity and provides consistent user experience
  • Fixed hardcoded grid classes removal from ContactFormModal and ProjectFormModal editPanels
  • Eliminated all col-span-2 hardcoded classes that were overriding responsive design
  • Enhanced PhoneInput component height consistency with h-10 forced height and text-sm sizing
  • Changed "VINCULAR USUARIO EXISTENTE" button to primary style (accent color) instead of outline
  • All modals now properly implement responsive design: 1 column mobile, specified columns desktop
  • Fixed hardcoded grid classes removal from ContactFormModal and ProjectFormModal editPanels
  • Eliminated all col-span-2 hardcoded classes that were overriding responsive design
  • Enhanced PhoneInput component height consistency with h-10 forced height and text-sm sizing
  • Changed "VINCULAR USUARIO EXISTENTE" button to primary style (accent color) instead of outline
  • All modals now properly implement responsive design: 1 column mobile, specified columns desktop
- July 14, 2025. Complete modal system refactoring with unified architecture implemented - COMPLETED
  • Successfully refactored all modals (GalleryFormModal, BoardFormModal, MemberFormModal, CardFormModal) to use unified structure
  • All modals now return consistent { viewPanel, editPanel, headerContent, footerContent } object structure
  • Eliminated visual inconsistencies: removed double borders, duplicate padding, and conflicting header structures
  • Updated ModalFactory to centralize modal rendering with FormModalLayout for all modal types
  • Fixed hooks ordering issues by properly calling modal functions as direct invocations instead of component rendering
  • Enhanced each modal with proper viewPanel content for read-only viewing mode
  • Maintained all original functionality while achieving consistent visual appearance across entire modal system
  • Removed all internal FormModalLayout usage from individual modals - only ModalFactory renders layout now
  • System now provides clean, modular modal architecture with no redundant styling or structure code
  • Architecture ensures: modals return objects → ModalFactory centralizes rendering → single FormModalLayout instance prevents duplication
- July 14, 2025. FormSubsectionButton component creation for modal form navigation - COMPLETED
  • Created new FormSubsectionButton component in src/components/modal/form/ for elegant subform navigation
  • Component features: icon, title, description, hover effects, and animated "+" button on hover
  • Includes responsive design with accent color theming and accessibility support
  • Added comprehensive documentation with usage examples and integration patterns
  • Component supports disabled state, custom styling, and keyboard navigation
  • Integrates seamlessly with existing FormModalLayout and modalPanelStore systems
  • Ready for use in any modal requiring navigation to subforms or secondary panels
- July 14, 2025. Modal system reorganization and secondary button color standardization - COMPLETED
  • Moved all CustomModal components to /components/modal/legacy/ directory for better organization
  • Updated all import references across 50+ files automatically using sed commands
  • Standardized secondary button colors to use --accent (hsl(76, 100%, 40%)) for border and text content
  • Enhanced visual consistency between primary and secondary buttons throughout the application
  • Modal structure now organized: /form/ (new system), /factory/ (modal factory), /legacy/ (CustomModal compatibility)
  • Both light and dark mode secondary buttons now use accent color for better brand consistency
- July 14, 2025. AvatarUploader component and organization improvements completed - COMPLETED
  • Created reusable AvatarUploader component in src/components/ui-custom/ with automatic square cropping functionality
  • Component features: file validation, 400x400 pixel square cropping, Supabase upload, progress states, fallback avatar with initials
  • Replaced manual logo upload code in OrganizationBasicData.tsx with AvatarUploader component
  • Fixed organization dashboard: removed hardcoded "ORGANIZACIÓN ACTIVA" text and "Plan Pro" badge
  • Implemented real plan data display from organizations.plan_id relationship in database
  • Added logo_url and plan fields to organization interface in useCurrentUser hook for proper TypeScript support
  • Logo uploads now automatically crop rectangular images to perfect squares preventing distortion
  • Enhanced organization avatar display with proper logo_url integration from archub_get_user RPC function
  • AvatarUploader ready for reuse across profile page and any other avatar/image upload needs
- July 14, 2025. Major component reorganization and application error fixes - COMPLETED
  • Renamed multiple components for cleaner naming: CustomTable→Table, CustomEmptyState→EmptyState, CustomPhoneInput→PhoneInput, CustomKanban→KanbanBox, TaskListWithCompleted→KanbanList
  • Updated all import references across 50+ files using automated bash commands for mass refactoring efficiency
  • Moved ProjectHeroImage from src/components/project/ to src/components/ui-custom/ and removed empty project directory
  • Fixed application compilation errors caused by outdated component references and import paths
  • Resolved hardcoded date component in NUEVO PRESUPUESTO modal using Input type="date" pattern for consistency
  • Enhanced component organization with simplified naming convention removing "Custom" prefixes throughout codebase
- July 13, 2025. Enhanced CustomRestricted component and repositioned design button with restrictions - COMPLETED
  • Modified CustomRestricted component to display function names in tooltips (e.g., "Diseño - Función Bloqueada")
  • Added functionName prop to CustomRestricted interface for dynamic tooltip content
  • Applied restrictions to design button in main sidebar with proper function name display
  • Moved design button from third position to fifth position (after finanzas) in both desktop and mobile sidebars
  • Updated sidebar order: Organización → Proyecto → Obra → Finanzas → Diseño → Comercialización → Post-Venta
  • Applied functionName parameter to all restricted buttons in both desktop Sidebar.tsx and mobile MobileMenu.tsx
  • Enhanced user experience with specific function identification in restriction tooltips
- July 13, 2025. Major navigation restructure: moved DOCUMENTACIÓN and GALERÍA pages from DISEÑO to PROYECTOS sidebar - COMPLETED
  • Moved DOCUMENTACIÓN page from design sidebar to project sidebar (positioned below CLIENTES button)
  • Moved GALERÍA page from construction sidebar to project sidebar (positioned below DOCUMENTACIÓN)
  • Updated desktop SidebarSubmenu.tsx navigation structure for both design and project contexts
  • Updated mobile MobileMenu.tsx navigation with same organizational changes
  • Changed all routes from /design/documentation and /construction/gallery to /project/documentation and /project/gallery
  • Updated App.tsx routing configuration to reflect new URL structure
  • Both pages now accessible directly from project context instead of nested in design/construction sections
  • Enhanced project sidebar with comprehensive document and media management capabilities
  • Maintained all existing functionality while improving information architecture accessibility
- July 13, 2025. Fixed UserSelector in document upload modal and enhanced file display design - COMPLETED
  • Fixed critical bug: UserSelector in NewDocumentUploadModal now receives organizationId parameter correctly
  • Enhanced useOrganizationMembers hook integration to load organization members properly
  • Improved form reset conditions to only execute when userData and members are available
  • Redesigned file display within groups: replaced cards with clean table-style list layout
  • Added proper file format with icon, name, date, and file name badge showing real filename
  • Enhanced file actions: added Eye icon for viewing, Edit3 for editing, and Trash2 for deleting
  • Files now display as bordered list items with hover effects and proper spacing
  • Implemented filename badges showing actual file names next to document display names
  • Fixed file visualization to be more intuitive: "Document Name" with "(real_file.pdf)" badge
  • Cleaned up debugging logs for production-ready code quality
- July 13, 2025. Enhanced documentation accordion interface with visual improvements and consistency - COMPLETED
  • Implemented accordion-style folder cards with single-expansion behavior and click-to-expand functionality
  • Added ChevronDown/ChevronUp icons to indicate expansion state with single-accordion rule
  • Enhanced visual hierarchy with border divider line between header and content when expanded (matching bitácoras page design)
  • Fixed perfect vertical centering of card content to match FeatureIntroduction component consistency
  • Subcarpetas now occupy 100% width within parent card containers (removed lateral margins)
  • Added empty space with "Subir Documentos" button to both main folders and subcarpetas for consistent functionality
  • Eliminated "Subcarpetas" title for cleaner interface - subcarpetas display directly without section header
  • Maintained hierarchical structure with proper event handling and stopPropagation for accordion behavior
  • All folders (main and sub) now have identical empty space areas indicating document upload capability
- July 13, 2025. Complete UI improvements for DOCUMENTACIÓN page - COMPLETED
  • Removed "Nueva Carpeta" button from header actions for cleaner interface
  • Made inline "Nueva Carpeta" button primary (green) style matching "Subir Documentos" button
  • Removed "0" badge displays from folder and group cards for cleaner visual appearance
  • Changed all edit buttons to use Pencil icon instead of Edit3 for consistency with CustomTable components
  • Updated "Crear Subcarpeta" button to secondary style with text label instead of icon-only
  • Enhanced button consistency across folder management interface
  • Improved visual hierarchy with primary actions (Nueva Carpeta, Subir Documentos) in accent color
- July 13, 2025. Redesigned DOCUMENTACIÓN page with hierarchical single-column layout - COMPLETED
  • Restructured page to single-column layout with complete hierarchical display: carpetas → subcarpetas → grupos → archivos
  • Added wide layout prop for better space utilization on documentation management page
  • Enhanced folder/subfolder display with proper Card components and borders with visual depth using ml-4, ml-6, ml-8 margins
  • Implemented complete hierarchy in one view: folders (base level), subcarpetas (ml-4), grupos (ml-6), documentos (ml-8)
  • Added comprehensive action buttons to all levels: create subfolder, edit, delete with proper icon sizing
  • Created visual differentiation using background opacity: folders (no bg), subcarpetas (bg-muted/10), grupos (bg-muted/20), documentos (bg-muted/30)
  • Enhanced cards with CardHeader structure, badges showing counts, and action button clusters
  • Integrated edit and delete functionality for folders, groups, and documents directly from hierarchy tree
  • Complete document management within hierarchical structure with upload, view, and management capabilities
- July 12, 2025. Added FeatureIntroduction components to ASISTENCIA and BITÁCORA pages with comprehensive functionality overviews - COMPLETED
  • Added FeatureIntroduction component to ConstructionAttendance.tsx explaining attendance control functionality
  • Enhanced ASISTENCIA page with 4 key feature descriptions: visual calendar attendance tracking, worker type filtering, productivity statistics, and flexible period control
  • Added FeatureIntroduction component to ConstructionLogs.tsx explaining site log management functionality
  • Enhanced BITÁCORA page with 4 key feature descriptions: daily complete logging, visual documentation, privacy control, and temporal tracking
  • Feature introductions explain automatic data extraction, professional categorization, photo/video attachments, and progress reporting capabilities
  • Added proper imports for Calendar, Filter, BarChart3, Clock, StickyNote, Camera, Settings icons for comprehensive feature visualization
  • Both pages now follow consistent pattern with other construction module pages for better user onboarding experience
- July 12, 2025. Centralized activity logging system implementation with comprehensive tracking capabilities - COMPLETED
  • Created utils/logActivity.ts utility function using Supabase function log_organization_activity for centralized activity tracking
  • Added comprehensive activity action constants (CREATE_MOVEMENT, UPDATE_MOVEMENT, CREATE_SITE_LOG, etc.) and target table definitions
  • Integrated activity logging into NewSiteLogModal.tsx for tracking site log creation and updates with detailed metadata
  • Created use-movements-with-logging.ts hook with logging-enabled CRUD operations for financial movements
  • Built comprehensive integration examples in examples/integrationExamples.ts showing logging patterns for movements, contacts, tasks, documents, members, and clients
  • System tracks user actions with organization_id, user_id, action type, target table, target ID, and rich metadata for audit trails
  • Logging implementation is non-blocking - errors in logging don't interrupt main application workflows
  • Activity tracking ready for integration across all major application features: construction, finance, design, and administration modules
Changelog:
- July 12, 2025. Enhanced construction module with FeatureIntroduction components and improved UI consistency - COMPLETED
  • Added FeatureIntroduction component to ConstructionMaterials.tsx explaining material management functionality
  • Enhanced Materials page with comprehensive feature descriptions: auto-calculation, inventory control, category analysis, purchase planning
  • Added FeatureIntroduction component to ConstructionGallery.tsx explaining gallery functionality
  • Enhanced Gallery page with detailed feature descriptions: photo/video capture, automatic organization, visual history, integrated viewer
  • Fixed CustomEmptyState styling issues in Gallery page by removing conflicting CSS classes
  • Gallery empty states now properly display with accent colors and proper visual hierarchy
  • Both pages now follow consistent UI patterns with FeatureIntroduction at top and proper spacing
  • Fixed input sizing in ConstructionBudgets.tsx by removing hardcoded height (h-10) for standard component sizing
  • All construction module pages now maintain consistent visual design with proper component standardization
Changelog:
- July 12, 2025. Fixed onboarding Step1 theme field removal and Step3 double-click issue - COMPLETED
  • Removed "Tema de la aplicación" field from Step 1 of onboarding as requested by user
  • Fixed Step3Discovery double-click issue by adding isFinishing state to prevent multiple executions
  • Added loading state to "Finalizar configuración" button showing "Finalizando..." while processing
  • Enhanced button disable logic to prevent clicks during processing state
  • Added setTimeout delay to ensure proper state management before mutation execution
  • Cleaned up unused imports and theme-related code from Step1UserData component
- July 12, 2025. Enhanced finance dashboard with expenses by category pie chart and layout optimization - COMPLETED
  • Added ExpensesByCategoryChart component with Recharts pie chart visualization showing expense distribution by categories
  • Removed Balance por Billetera chart from second row as requested, changed layout back to 3 columns
  • Fixed expense data query to filter movements by EGRESO type and use subcategory_id for proper categorization
  • Enhanced useExpensesByCategory hook to search for movements containing "egreso" in name and group by subcategory
  • Changed FinancesDashboard layout to wide={true} for better space utilization on large screens
  • Integrated new chart into finance dashboard between metrics column and financial flow chart
  • Applied consistent chart styling and responsive design patterns throughout the new visualization
  • Fixed chart colors to use hardcoded HSL values instead of CSS variables for proper color display
  • Standardized both pie charts with identical layout: percentages inside chart, legend below, h-64 height
  • Enhanced Balance General amount to use var(--chart-neutral) color matching its mini chart line
  • Optimized chart spacing and positioning for consistent visual appearance across both charts
- July 12, 2025. Fixed MiniTrendChart hardcoded line visualization and optimized MonthlyFlowChart spacing - COMPLETED
  • Removed problematic onboarding fields (user_role and team_size) preventing database enum constraint violations
  • Added comprehensive icon integration to finance dashboard cards: TrendingUp, Calendar, Wallet, Clock, DollarSign
  • Fixed MiniTrendChart component rendering: eliminated hardcoded horizontal lines, added proper data validation
  • Enhanced chart sizing with fixed height (48px) and minimum dimensions to prevent rendering issues
  • Improved chart logic to handle zero values and ensure proper line visualization with real financial data
  • Optimized MonthlyFlowChart: increased height from 300px to 380px and reduced card padding (pb-2) to maximize space utilization
- July 12, 2025. Fixed onboarding enum field compatibility and completed mobile finance dashboard layout - COMPLETED
  • Fixed user_role enum values: removed special characters (/ symbols) from role options like "Arquitecto/a" → "Arquitecto"
  • Fixed team_size enum values: replaced EN DASH (–) with standard hyphen (-) in "2–5 personas" → "2-5 personas"
  • Completed mobile finance dashboard layout restructure: icon left + title inline right, organization info below
  • Added full-width period selector at bottom of summary card in mobile view
  • Mobile metrics cards now stack vertically (grid-cols-1) with proper Card/CardContent structure and mini charts
  • All hardcoded colors replaced with CSS variables: var(--chart-positive/negative/neutral)
- July 12, 2025. Finance dashboard enhanced with mini-chart metrics and time period filtering - COMPLETED
  • Eliminated double lines from metric cards: removed accent lines, kept only mini trend charts for clean visualization
  • Added time period selector in summary card top-right corner with options: DESDE SIEMPRE, Este mes, Trimestre, Semestre, Año
  • Integrated timePeriod filter into all data hooks to control entire dashboard visualization
  • Cards now show: mini chart at top + spacer + icon/text/amount at bottom (consistent with movement card design)
  • Time period selector affects all charts and metrics throughout the finance dashboard
- July 12, 2025. Finance dashboard restructured with three-column layout: metrics column + two charts - COMPLETED
  • Eliminated old card of movements from second row as requested
  • Reorganized layout: first row (summary 75% + movements 25%), second row (3-column: metrics stack + 2 charts)
  • Metrics now stacked vertically in left column: Ingresos, Egresos, Balance General
  • Two charts occupy remaining space: Flujo Financiero Mensual + Balance por Billetera
  • Fixed card positioning and spacing consistency (gap-4 mobile, gap-6 desktop)
  • Movement card design matches organization dashboard reference exactly
- July 12, 2025. Resolved infinite redirection loop between onboarding and select-mode pages - COMPLETED
  • Fixed infinite loop caused by multiple ProtectedRoute instances executing onboarding verification simultaneously
  • Corrected routing configuration: SelectMode now properly protected, Onboarding unprotected as intended
  • Removed duplicate authentication verification from individual pages (Onboarding.tsx, SelectMode.tsx)
  • Fixed onboarding completion logic to properly mark onboarding_completed=true in database
  • SelectMode page works with single click and properly updates user_type in database
  • System now correctly redirects: incomplete onboarding → /onboarding → completion → /organization/dashboard
  • Eliminated Step4SelectMode completely as it was redundant and causing architectural issues
- July 12, 2025. Fixed SelectMode double-click issue and onboarding navigation problems - COMPLETED
  • Eliminated function duplication handleFinishOnboarding that caused initialization error
  • Simplified SelectMode to execute mutation directly without intermediate state (selectedMode)
  • Removed unnecessary two-step logic (selection + confirmation) for single-click operation
  • Added "Volver" button to Step2FinancialSetup with ArrowLeft icon and proper spacing
  • Verified ProtectedRoute correctly redirects users with onboarding_completed=FALSE to /onboarding
  • Cleaned up unused imports and variables for production-ready code quality
  • SelectMode now works with single click and properly updates user_type in database
- July 12, 2025. MultiComboBox component creation and onboarding system enhancement - COMPLETED
  • Created new MultiComboBox component in src/components/ui-custom/MultiComboBox.tsx matching Select styling exactly
  • Enhanced onboarding from 3 to 4 steps: 1) Personal data → 2) Organization & Financial setup → 3) Discovery → 4) Mode selection
  • Restructured Step 1 to single-column layout with fields: Nombre/s, Apellido/s, País, Fecha de Nacimiento, Tema de aplicación
  • Moved organization name field from Step 1 to Step 2 (financial setup) for better logical flow
  • Added country and birthdate fields to user_data schema and onboarding form data
  • Created use-countries hook for country selection dropdown integration
  • Fixed MultiComboBox component to use identical styling as Select components: same colors, borders, text size, hover states
  • Enhanced Step 3 Discovery to automatically load existing user data when available
  • Step 2 now combines organization setup with financial configuration (currencies/wallets)
  • All validation updated to reflect new required fields and step dependencies
- July 12, 2025. Navigation restructuring: Moved "Preferencias de Finanzas" to organization submenu as "Preferencias" - COMPLETED
  • Relocated "Preferencias de Finanzas" from finances submenu to organization submenu (bottom position)
  • Changed button label from "Preferencias de Finanzas" to simply "Preferencias" 
  • Updated page header title from "Preferencias de Finanzas" to "Preferencias"
  • Modified sidebar context from 'finances' to 'organizacion' for proper navigation highlighting
  • Added FeatureIntroduction component explaining organization preferences functionality
  • Removed old "Preferencias de Finanzas" title and description text
  • Applied changes to both desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx
  • Enhanced page with features explanation: currency/wallet defaults, movement options, global preferences
Changelog:
- July 12, 2025. Complete CardDetailsModal field reorganization and modal positioning fix - COMPLETED
  • Fixed modal positioning by moving CardDetailsModal management from CustomKanban to OrganizationTasks parent level
  • Reorganized modal fields per user specification: CREADOR → Fecha (created_at) → TITULO → DESCRIPCION → ASIGNADO A
  • Removed FECHA LIMITE field completely from task editing modal as requested
  • Enhanced form schema to match new field order with proper validation for creator field
  • Added read-only created_at date field displaying creation date in Spanish format
  • Implemented proper component separation: CustomKanban handles display, OrganizationTasks manages modal state
  • Fixed handleDeleteCard function with proper useDeleteKanbanCard hook integration
  • Added selectedCard state management and onCardEdit callback system for clean component architecture
- July 12, 2025. Enhanced DOCUMENTACIÓN page with FeatureIntroduction component and complete document versioning system - COMPLETED
  • Added FeatureIntroduction component explaining document management functionality: version control, folder organization, download/export capabilities, and team collaboration features
  • Created DocumentFolderCard component in src/components/ui-custom/ for comprehensive file version management
  • Implemented full-width folder cards with ACTUALIZAR button for uploading new versions and VER HISTORIAL button for expandable version history
  • Each folder displays latest version prominently with options to upload updates while maintaining complete version history
  • Expandable version history shows all previous versions with individual export buttons for downloading any version
  • Enhanced document query to fetch ALL versions (not just latest) for complete version tracking
  • Added automatic version numbering system that increments when new versions are uploaded
  • Integrated proper file upload handling with Supabase Storage for design-documents bucket
  • Version cards show creator information, upload dates, status badges, and proper file type icons
  • Preserved existing edit/delete functionality while adding comprehensive version management capabilities
- July 12, 2025. Project dashboard hero card and stats improvements - COMPLETED
  • Fixed hero card background color to use --accent CSS variable instead of hardcoded blue gradient when no image present
  • Corrected chart line colors in stats cards to use direct accent color (#84cc16) for proper visibility
  • Added primary navigation buttons below each stats card linking to respective pages (Ver Documentos, Ver Bitácora, Ver Presupuestos, Ver Movimientos)
  • Removed ProjectQuickActions card completely as requested
  • Updated project image loading logic to query project_data table separately for project_image_url field
  • Fixed file upload button functionality to properly open file explorer with proper event handling and mutation
  • Changed stats cards mobile layout from grid-cols-1 to grid-cols-2 for 2x2 display matching organization dashboard
  • Implemented proper mutation using uploadProjectImage and updateProjectImageUrl functions for hero image updates
- July 12, 2025. Project dashboard completely reformulated to match organization dashboard aesthetic with enhanced components - COMPLETED
  • Updated welcome card to display project name instead of greeting and "Resumen del proyecto" description
  • Completely rebuilt ProjectStatsCards with mini line charts matching organization dashboard style
  • Made activity chart full-width and functional like organization dashboard layout
  • Enhanced ProjectQuickActions and ProjectRecentActivity to match organization dashboard visual design
  • Added proper CSS variable theming and responsive design patterns throughout all components
  • Created project-specific data hooks (useProjectStats, useProjectActivity) for real data integration
  • Applied framer-motion animations and proper loading states for professional user experience
- July 12, 2025. Header project button split into separate navigation and selector buttons matching organization pattern - COMPLETED
  • Modified Header.tsx to split project button into two separate buttons like organization header
  • Project name button navigates to /project/dashboard when clicked (maintains original navigation functionality)
  • Separate dropdown selector button opens project selection popover with all projects and "Todos los proyectos" option
  • Preserved all existing project selection logic and mutations without changing functionality
  • Updated project selection mutation to handle null values for "Todos los proyectos" selection
  • Maintained consistent styling and behavior with organization button pattern for better UI consistency
- July 12, 2025. ProjectClients page restructured with two-column layout matching OrganizationMembers design - COMPLETED
  • Rebuilt ProjectClients page layout to match GESTIÓN DE MIEMBROS two-column desktop structure
  • Left column displays section description with title, explanation text, and client count summary card
  • Right column shows individual client cards with same styling and spacing as member cards
  • Removed wrapping Card component around client list for cleaner presentation
  • Integrated CustomEmptyState within right column instead of separate section for better visual flow
  • Maintained FeatureIntroduction component at top and all existing functionality
  • Applied consistent grid layout: lg:col-span-4 for description, lg:col-span-8 for content
  • Fixed empty state to span full width below FeatureIntroduction instead of being constrained within right column
  • Empty state now covers entire content area when no clients exist, providing better visual balance
- July 11, 2025. Profile page plan section background fix and ProjectClients page enhancement with FeatureIntroduction and CustomEmptyState - COMPLETED
  • Fixed Profile page plan section to use --card-bg and --card-border CSS variables instead of transparent background
  • Plan section now matches FeatureIntroduction component styling with proper theme-aware background
  • Added FeatureIntroduction component to ProjectClients page explaining client management functionality
  • Replaced empty card display with CustomEmptyState component when no clients exist in project
  • Moved CustomEmptyState from src/components/ui-custom/misc/ to src/components/ui-custom/ directory
  • Updated all import references across 10+ files to use new CustomEmptyState location
  • Enhanced ProjectClients page with conditional rendering: FeatureIntroduction always shows, client card only when clients exist, CustomEmptyState when no clients
  • Added comprehensive feature descriptions for client management: linking contacts, financial commitments, roles/permissions, contribution tracking
- July 11, 2025. Complete chart theming system implementation with CSS variables for grid lines and axis text - COMPLETED
  • Added --chart-grid-text CSS variable to both light and dark themes for consistent chart styling
  • Updated 6 chart components: MonthlyFlowChart, MemberActivityChart, OrganizationGrowthChart, UserGrowthChart, BudgetProgressChart, OrganizationActivityChart
  • Replaced hardcoded grid line colors with var(--chart-grid-text) for CartesianGrid stroke property
  • Applied chart grid text variable to XAxis and YAxis tick fill properties for consistent text coloring
  • Chart grid lines and axis text now properly adapt to light/dark themes using dedicated CSS variable
  • Light theme uses hsl(0, 0%, 50%) and dark theme uses hsl(0, 0%, 40%) for optimal contrast in both modes
- July 11, 2025. Complete table row CSS variables implementation and Profile page FeatureIntroduction enhancement - COMPLETED
  • Updated CustomTable component to use --table-row-bg and --table-row-fg CSS variables for normal table rows (non-headers)
  • Applied --table-row-hover-bg CSS variable for table row hover states across all tables
  • Enhanced Profile page with FeatureIntroduction component explaining user profile management functionality
  • Removed "MI PERFIL" title and description sections, replaced with comprehensive feature introduction card
  • Added proper UserCircle icon to Profile FeatureIntroduction with 4 key feature explanations
  • Updated all section dividers in Profile page to use --section-divider CSS variable instead of hardcoded colors
  • Fixed missing Shield icon import in Profile page for proper feature introduction rendering
  • All Profile page sections now use consistent theme-aware CSS variables for dividers
- July 11, 2025. Complete card component color standardization for proper dark mode compatibility - COMPLETED
  • Fixed ProjectCard hardcoded white backgrounds and gray text colors to use CSS variables
  • Updated ActivityCard, MovementCard, and ConversionCard to use proper theme-aware colors
  • Fixed SiteLogCard avatar fallback colors from hardcoded gray to CSS variables
  • Corrected DesignDashboard mobile cards: replaced all bg-white/text-gray-900/border-gray-200 with CSS variables
  • Fixed ProjectDashboard mobile cards: replaced hardcoded colors with bg-[var(--card-bg)]/text-foreground/border-[var(--card-border)]
  • Updated ConstructionDashboard mobile cards to use proper CSS variables for dark mode compatibility
  • Enhanced color consistency: green/red amount colors now include dark mode variants (dark:text-green-400, dark:text-red-400)
  • All card components now properly adapt to light/dark themes using CSS variables instead of hardcoded colors
- July 11, 2025. Complete Tasks page enhancement with FeatureIntroduction, board selector, and mobile kanban optimization - COMPLETED
  • Added FeatureIntroduction component explaining Kanban boards, flexible lists, completion tracking, and team collaboration
  • Created board selector card with "Tablero:" label, dropdown, edit/delete buttons following PRESUPUESTOS page pattern
  • Applied --accent CSS variable to "AÑADE OTRA LISTA" text and dotted border for consistent theming
  • Fixed mobile kanban UX: lists now occupy 100% screen width with smooth horizontal swiping between centered lists
  • Eliminated horizontal scrollbar issues by replacing calc(100vw-2rem) with proper full-width mobile layout
  • Enhanced mobile kanban to behave like professional mobile apps with snap-to-center list navigation
- July 11, 2025. Fixed MemberActivityChart avatar filtering and chart margin optimization - COMPLETED
  • Fixed chart left margin from 40px to 5px to eliminate empty space and reach card padding edge
  • Updated user activity data logic to only show avatars for users with actual activity (activity_count > 0)
  • Removed all inactive organization members from avatar display - now only active users appear as avatars
  • Chart spacing optimized while maintaining identical chart functionality and visual appearance
  • Avatar display logic now properly filters: only users who created projects, movements, contacts, or site logs appear
- July 11, 2025. Complete MemberActivityChart time filtering and responsive Members page layout implementation - COMPLETED
  • Fixed MemberActivityChart to accept time period props from parent page instead of internal state management
  • Updated OrganizationActivity page to manage timePeriod state and pass it to MemberActivityChart component
  • Chart now properly responds to Semana/Mes/Año button clicks for filtering user activity data
  • Completely restructured OrganizationMembers page layout to match MI PERFIL responsive design pattern
  • Added FeatureIntroduction component explaining member management functionality and benefits
  • Replaced hardcoded grid-cols-12 with responsive grid-cols-1 lg:grid-cols-12 for mobile-friendly layout
  • Enhanced member cards with responsive flexbox layout and proper mobile text handling
  • Fixed NewMemberModal to use CustomModalBody columns={1} and filtered roles to show only "organization" type
  • Added role filtering in modal query to exclude "web" type roles from member invitation dropdown
  • Improved mobile responsiveness with proper flex-col sm:flex-row breakpoints for member card layout
- July 11, 2025. Enhanced MemberActivityChart with time filters and DangerousConfirmationModal visual improvements - COMPLETED
  • Fixed avatar overlap issues in MemberActivityChart by improving positioning logic and increasing margins (top: 30, left: 40)
  • Added time period filter buttons (Semana/Mes/Año) matching UserGrowthChart style in AdminDashboard
  • Enhanced avatar positioning to prevent clipping at top and overlap with Y-axis numbers using smart offset calculations
  • Completely redesigned DangerousConfirmationModal aesthetics with modern styling, larger icons, better spacing
  • Applied 25%/75% button width ratio: Cancel button (25%) and Delete button (75%) for better visual hierarchy
  • Enhanced modal with white text on red delete button, improved alert styling, better input focus states
  • Fixed all import conflicts by standardizing DangerousConfirmationModal as named export across all pages
  • Modal now features autofocus on input, larger warning icons, and improved mobile-friendly layout
- July 11, 2025. Comprehensive layout fixes and UserActivityChart implementation - COMPLETED
  • Fixed Layout component responsive padding system: mobile uses p-3, desktop uses p-6
  • Corrected OrganizationActivityChart margin padding to eliminate left/right spacing for perfect card edge alignment
  • Enhanced FeatureIntroduction mobile layout with flexbox structure placing help text and icon on second line
  • Resolved infinite loop error in OrganizationContacts by fixing useEffect dependencies
  • Created new UserActivityChart component in src/components/graphics/ with avatar-based data points
  • Built use-user-activity.ts hook with comprehensive user activity data aggregation from multiple tables
  • Integrated UserActivityChart into Activity page before existing table for enhanced user activity visualization
  • Chart displays individual user avatars as data points instead of standard dots for better user identification
- July 11, 2025. Enhanced PROYECTOS page with FeatureIntroduction component and ACTIVO badge fix - COMPLETED
  • Added FeatureIntroduction component to OrganizationProjects page with accurate functionality descriptions
  • Styled FeatureIntroduction as traditional card with rounded-md corners matching project cards instead of rounded-lg
  • Enhanced title layout: page icon (Folder) on left with --accent color, title in center, help text + icon on right
  • Added "(click para más información)" text hint next to help icon for better user guidance
  • Updated content to reflect actual page functionality: 1) Creating new projects with modal completion and ACTIVO selection, 2) Using header selector for quick project switching and "Todos los Proyectos" option
  • Removed selected project information card above projects list for cleaner interface
  • FIXED ACTIVO badge: changed logic from project.status to isActiveProject prop comparing with last_project_id
  • Fixed CSS variable conflicts: removed duplicate --accent and --accent-foreground definitions that were causing styling issues
  • Feature introduction uses proper hover expansion with detailed descriptions explaining actual user workflows
- July 11, 2025. Complete PERSONAL page rename to ASISTENCIA across entire application - COMPLETED
  • Renamed ConstructionPersonnel.tsx to ConstructionAttendance.tsx with function name update
  • Updated all imports and route references in App.tsx to use new component name
  • Changed page title from "Personal" to "Asistencia" in header and all UI text
  • Updated sidebar navigation buttons from "Personal" to "Asistencia" in desktop and mobile menus
  • Modified ConstructionDashboard quick action button text from "Personal" to "Asistencia" 
  • Updated CustomGradebook component header from "Personal" to "Asistencia"
  • Renamed hook from usePersonnelAttendance to useAttendanceData with updated console logs
  • Changed statistics card from "Total Personal" to "Total Asistencia" 
  • Updated filter label from "Tipo de Personal" to "Tipo de Trabajador"
  • All references throughout codebase now consistently use "Asistencia" terminology
- July 11, 2025. Fixed organization and project data filtering in APORTES, CLIENTES, and COMPROMISOS pages - COMPLETED
  • Added missing organization_id filters to project_clients queries across all three pages
  • Enhanced contact relation joins using contacts!inner with organization_id filtering
  • Fixed query conditions to require both projectId and organizationId before executing
  • ProjectClients page now properly filters contacts by organization and project relationship
  • FinancesCommited page filters project clients by organization membership through contact relation
  • FinancesInstallments page ensures installments only show for organization members in current project
  • All pages now respect organization boundaries and project context for data security
- July 11, 2025. Complete client financial commitments system and dangerous deletion confirmation component - COMPLETED
  • Fixed FK violation in FinancesCommited page by using currency_id instead of currency.id for organization_currencies queries
  • Added alphabetical sorting to both FinancesCommited and ProjectClients pages - clients now display in alphabetical order by name
  • Created DangerousConfirmationModal component in src/components/ui-custom/ for high-risk deletion confirmations
  • Modal requires typing exact item name (client name) to confirm dangerous deletions, following Supabase/GitHub pattern
  • Applied dangerous confirmation to ProjectClients page - users must type client name to confirm removal
  • Added "Compromisos" button to finances navigation (desktop & mobile) with HandCoins icon after "Aportes"
  • FinancesCommited page shows all project clients with editable currency (select) and committed amount (input) fields
  • All currency and amount changes save automatically to project_clients table with proper error handling
  • Enhanced user safety with visual warnings, loading states, and "Esta acción no se puede deshacer" messaging
- July 11, 2025. ProjectClients page simplified with single-column layout and navigation integration - COMPLETED
  • Simplified ProjectClients.tsx to single-column layout with only "Clientes Activos" card as requested
  • Removed left sidebar and secondary cards for cleaner, focused interface
  • Added "Clientes" navigation button to both desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx in project context
  • Configured /project/clients route in App.tsx with proper ProtectedRoute wrapper
  • Page displays project clients with avatar, name, email, role badge, and remove functionality
  • Empty state shows when no clients are assigned with call-to-action to add first client
  • "Agregar Cliente" button in header allows selecting from available organization contacts
  • Successfully integrated with existing project navigation structure
- July 11, 2025. CRITICAL ISSUE RESOLVED: USER_PREFERENCES "deletion" problem completely solved - COMPLETED
  • Root cause identified: Using auth_id instead of correct user_id from users table was causing foreign key constraint violations
  • Fixed incorrect user ID mapping: auth_id `92eb60ea-4d37-41ab-8461-17139dc88c3f` → user_id `0776911d-ccd9-4ac2-95c2-c1d7e270585b`
  • Corrected useCurrentUser hook and authStore to use proper user_id from users table instead of auth.user.id
  • Investigation confirmed: RPC function `archub_get_user` was working correctly and NOT causing data deletion
  • Database triggers, RLS policies, and all backend functions were functioning properly throughout
  • No actual data deletion occurred - issue was foreign key constraint violations due to wrong ID usage
  • Removed all monitoring and debugging code after successful resolution
  • Fixed NewMovementModal field ordering: Creador now appears before Fecha in both regular and conversion forms
  • Added logic to preserve creator and date values when switching between regular and conversion movement types
Changelog:
- July 11, 2025. Fixed Excel import 100-row limitation and exchange rate display issues - COMPLETED
  • Removed hardcoded 100-row limit from ImportMovementsModal.tsx for both Excel (.xlsx/.xls) and CSV file processing
  • Import system now processes all rows in uploaded files instead of limiting to first 100 records
  • Fixed exchange_rate field missing from Movement interface and useMovements query SELECT statement
  • Added exchange_rate preservation in data transformation to ensure cotizaciones display in movements table
  • Corrected exchange_rate loading in NewMovementModal edit form - field now populates correctly when editing movements
  • Exchange rates now display properly in "Cotización" column and load in edit modal as expected
- July 11, 2025. Complete ImportMovementsModal fixes: reset functionality, file removal, UUID error handling, and layout improvements - COMPLETED
  • Fixed modal to completely reset when opened/closed using dropzoneKey state to force dropzone component reset
  • Added file removal button (X) with proper functionality to clear selected files and return to step 1
  • Eliminated hardcoded grid layout by adding columns={1} prop to CustomModalBody for single-column layout
  • Fixed UUID error during import by properly validating and excluding empty ID fields before database insertion
  • Enhanced Excel date conversion from serial numbers to proper ISO date format for movement_date field
  • Improved CSV and Excel file processing with better header validation and empty column filtering
  • Added comprehensive error handling with user-friendly alerts when no valid headers are found
  • Fixed processedMovements mapping to use spread operator for conditional ID fields avoiding empty UUID errors
  • Enhanced import workflow: file upload → column mapping → preview → import with proper state management throughout
- July 11, 2025. Fixed task description spacing and name generation in PRESUPUESTOS page - COMPLETED
  • Added trim() operations to all task description generation functions to eliminate extra spaces in output
  • Implemented comprehensive space cleanup with replace(/\s+/g, ' ').trim() in taskDescriptionGenerator.ts, ConstructionBudgets.tsx, and use-task-search.ts
  • Fixed useBudgetTasks hook to use name_template from task_templates instead of preformatted display_name
  • Updated database query to fetch name_template, unit_id, and units data from task_templates relationship
  • Corrected task name generation to show "de 08x18x33" instead of "ladrillo-ceramico-081833" codes
  • Task descriptions now display properly formatted text: "Muros simples de ladrillo cerámico hueco de 08x18x33 con mortero de asiento de cal y cemento sin aditivos"
  • Enhanced TypeScript interfaces to support new data structure with task_templates nested relationship
- July 11, 2025. Fixed input quantity field to allow typing "0" and corrected auto-save interruption in PRESUPUESTOS - COMPLETED
  • Fixed NewAdminGeneratedTaskModal input that prevented typing "0" by changing parseFloat(value) || 1 to proper handling
  • Changed input min attribute from "1" to "0" to allow zero values in quantity fields
  • Updated validation logic from amount <= 0 to amount < 0 to permit zero quantities when needed
  • Fixed NewBudgetTaskModal same issue with || 1 forcing minimum value, now allows 0 with proper validation
  • Corrected AdminCategories headerProps actions from JSX element to array format for proper Header component rendering
  • Fixed header expecting React.ReactNode[] but receiving wrapped JSX element causing "CREAR CATEGORÍA" button to not display
  • Implemented local state management in BudgetTable to prevent auto-save interruption during typing
  • Quantity inputs now save only on blur or Enter key, allowing uninterrupted consecutive character typing
  • All quantity inputs now allow typing "0" without automatic conversion to 1 or validation errors
- July 10, 2025. Enhanced template editor to support global parameters without option groups - COMPLETED
  • Modified TaskTemplateEditorModal to allow adding parameters without requiring option groups
  • Removed mandatory option group requirement from "Agregar" button - now only requires parameter selection
  • Added informative messages: "✓ Este parámetro es global (no requiere grupo de opciones)" for parameters without groups
  • Enhanced user experience with message "ℹ️ Puedes agregar sin grupo (parámetro global) o con un grupo específico"
  • Global parameters like "espesor" or "dimensión" can now be added directly to templates without group configuration
  • System supports both grouped parameters (with specific option sets) and global parameters (no predefined options)
- July 10, 2025. Complete budget synchronization fix with comprehensive task parameter query invalidation - COMPLETED
  • Added missing 'task-parameter-values' and 'all-task-parameter-values' invalidations to all template editor mutations
  • Fixed update template unit mutation to include budget-affecting cache invalidations
  • Enhanced add parameter mutation with comprehensive query invalidation for real-time budget updates
  • Corrected delete parameter mutation to properly refresh budget page data without F5 requirement
  • Updated create template mutation to invalidate all parameter-related queries for immediate synchronization
  • Fixed delete template mutation to ensure budget page reflects template deletions instantly
  • Budget page (PRESUPUESTOS) now synchronizes perfectly with all template and parameter changes
  • System eliminates need for manual page refresh after any template or parameter modifications
- July 10, 2025. Admin sidebar reordering and task_code automatic storage implementation - COMPLETED
  • Reordered admin sidebar TAREAS section: Tareas Generadas → Parámetros de Tareas → Categorías de Tareas (removed Plantillas de Tareas)
  • Applied consistent ordering in both desktop SidebarSubmenu.tsx and mobile MobileMenu.tsx
  • Implemented automatic task_code storage: when creating templates, system now obtains category code through task_group relationship
  • Templates automatically save category code (e.g., "FFF") to task_code field in task_templates table
  • Fixed PostgreSQL function parameter mismatch: updated from input_template_id to input_group_id for proper task generation
  • Template creation now stores proper category code propagation for future task generation workflows
- July 10, 2025. Complete template generation system using task group names and code cleanup - COMPLETED
  • Changed template generation logic to use task_groups.name instead of category names for proper naming convention
  • Templates now generate as "Task Group Name {{parameter}}." format (e.g., "Muretes {{brick-type}}." not "Muros simples {{brick-type}}.")
  • Fixed generatePreview() function to use taskGroupName parameter when available for accurate template display
  • Updated all mutation functions to pass taskGroupName correctly for both preview and database operations
  • Maintained backward compatibility: legacy category-based templates still supported for existing data
  • Removed all debugging console.log statements for production-ready code quality
  • Template creation workflow: select task group → create template → template uses group name for accurate generation
- July 10, 2025. Complete category expansion state preservation and task group deletion cascade functionality - COMPLETED
  • Fixed category expansion state preservation to prevent collapse when creating new task groups
  • Added intelligent auto-expansion only on initial load, preserving user-expanded state during operations
  • Implemented cascade deletion for task groups - automatically deletes associated templates before group deletion
  • Cleaned up all debugging logs and console outputs for production-ready code quality
  • Enhanced error handling for foreign key constraint violations with user-friendly messages
  • Fixed cache invalidation system to maintain UI state consistency without manual refresh
  • System now maintains perfect UX: categories stay expanded during operations, smooth create/delete workflows
- July 10, 2025. Template detection system debugging and logic verification completed - COMPLETED
  • Added comprehensive debugging to verify template_id detection in task groups (confirmed working correctly)
  • Removed debugging logs after verification - clean production-ready code maintained
  • Confirmed statistics accuracy: system correctly shows 2 task groups ("Muretes", "Jorge") with 0 templates
  • Template detection logic properly handles null/undefined/empty string template_id values
  • Badge system accurately shows "Sin Plantilla" for groups without templates, "Con Plantilla" when templates exist
  • Counter calculations verified: (0/2) correctly reflects no templates assigned to 2 existing task groups
  • Template creation workflow ready for testing once actual templates are created through the interface
- July 10, 2025. Complete UI restructure: Template management moved from categories to task groups level - COMPLETED
  • Updated HierarchicalCategoryTree to show badges "Con Plantilla" on task groups instead of categories
  • Modified counter logic: category (0/1) numbers now reflect template status of child task groups
  • Changed statistics cards to count group templates: "Grupos de Tareas", "Con Plantillas", "Sin Plantillas"
  • Unified task group action buttons to match category buttons: template (styled), edit, delete
  • Fixed template completion calculation to aggregate task group templates instead of category templates
  • Enhanced filtering system to work with task groups: "Con Plantilla" finds categories with templated groups
  • Template badges now display at task group level where templates are actually created and managed
- July 10, 2025. Completed TaskTemplateEditorModal migration to work with task groups (task_group_id) instead of categories - COMPLETED
  • Modal now fully supports creating and managing templates for task groups using task_group_id field
  • Updated all database queries: template search by task_group_id, template creation with task_group_id column
  • Fixed modal title and subtitle to display task group name when working with task groups
  • Corrected all cache invalidation keys to use taskGroupId || categoryCode for proper query cache management
  • Added comprehensive invalidation for ['task-groups'] and ['admin-task-categories'] query keys
  • Template creation mutation supports both new (task_group_id) and legacy (categoryCode) approaches
  • All CRUD operations (create, update, delete template and parameters) now work seamlessly with task group context
  • Modal fully functional for both category-level templates (legacy) and task group-level templates (new architecture)
- July 10, 2025. Fixed layout background and dark mode compatibility for Organization Summary page - COMPLETED
  • Changed Layout background from bg-background to --layout-bg CSS variable for proper theme consistency
  • Updated Organization Summary welcome card to use semantic CSS variables: text-foreground, text-muted-foreground, border-border
  • Fixed dark mode rendering issues in welcome card by replacing hardcoded gray colors with proper theme variables
  • Enhanced theme compatibility across all text elements, borders, and backgrounds in the main greeting card
- July 10, 2025. Complete Organization Summary page refactor with dynamic greeting and analytics dashboard - COMPLETED
  • Completely rebuilt OrganizationDashboard.tsx with modern time-based greeting system ("Buen día/tarde/noche, first_name")
  • Created dynamic greeting card with 4xl font-black styling, organization avatar with gradient fallback showing initials
  • Implemented OrganizationStatsCards.tsx component with 4 animated metric cards: active projects, documents (30 days), generated tasks, financial movements total
  • Built OrganizationActivityChart.tsx using recharts with area chart visualization showing last 7 days activity breakdown
  • Created comprehensive useOrganizationStats and useOrganizationActivity hooks with real Supabase data integration
  • Added framer-motion animations for card appearance, counter scaling, and smooth page transitions
  • Enhanced organization info display with creation date, plan badge, and organization status indicators
  • Activity chart includes tooltips, legend, gradients, and proper responsive design for mobile/desktop
  • Stats cards feature color-coded icons (projects/documents/tasks/money), animated counters, and loading states
  • Organization avatar shows logo_url or generates colored initials fallback with gradient background
- July 9, 2025. Critical sidebar tooltip fix and reusable UserSelector component implementation - COMPLETED
  • Completely removed tooltip functionality from SidebarButton component to eliminate z-index and display issues within sidebars
  • Created new reusable UserSelector component in src/components/ui-custom/misc/UserSelector.tsx for consistent avatar+name display
  • UserSelector features: avatar display, full name fallback to first_name+last_name, proper select dropdown with avatar+name in options
  • Replaced hardcoded creator field in NewProjectModal with UserSelector component for consistent styling with bitácora modal
  • Enhanced project modal to show avatar left of creator name matching existing bitácora modal design pattern
  • Fixed ACTIVO badge display to only show for selected project using is_active property and --accent CSS variable
  • UserSelector component ready for reuse across all modals requiring user selection with avatar display
- July 9, 2025. ModernProjectCard implementation and NewProjectModal restructure - COMPLETED
  • Successfully replaced all ProjectCard references with new ModernProjectCard component based on user-provided design images
  • Implemented modern card layout with improved visual hierarchy: project name/status header, type/date info row, creator attribution footer
  • Applied proper responsive grid layout in mobile view with consistent gap-4 spacing between cards
  • Completely rebuilt NewProjectModal to follow ai-modal-template.md standards using CustomModalBody columns={2} prop
  • Fixed all duplicate and syntax errors in modal structure for stable functionality
  • Modal now properly displays all form fields in two-column layout: Creator/Date (row 1), Project Name (full width), Type/Modality (row 2), Status (full width)
  • Enhanced creator field to show all organization members with current user pre-selected by default
  • Added required field indicators (*) for mandatory fields and proper form validation
  • Mobile and desktop views now use identical modern card design for consistent user experience
- July 9, 2025. Two-column sidebar navigation implementation - COMPLETED
  • Created new two-column sidebar system similar to Linear/Notion with main categories and sub-menus
  • Updated navigationStore to include activeSidebarSection state for controlling right column (defaults to 'organization')
  • Created SidebarSubmenu component for displaying category-specific navigation options in right column 
  • Modified Sidebar.tsx to show only main category buttons (Organización, Datos Básicos, Diseño, Obra, Finanzas, etc.)
  • Enhanced Layout.tsx to integrate both sidebars with proper spacing calculations (40px main + variable submenu)
  • Main sidebar now permanently collapsed at 40px width showing only icons (no expansion capability)
  • Secondary sidebar submenu is always visible instead of conditional on active button
  • Added tooltips to main sidebar buttons showing labels on hover when collapsed
  • Removed all horizontal padding from main sidebar buttons to seamlessly connect with submenu
  • Fixed default active states: organization button and organization summary active on login
  • Maintained exact same design aesthetic while reorganizing navigation structure
Changelog:
- July 8, 2025. Mobile menu height optimization and task creation unit field fixes - COMPLETED
  • Modified mobile menu to use full screen height (h-screen) instead of 80vh with 20vh top margin
  • Removed "Unidad" field from CreateGeneratedTaskUserModal as unit is now template-defined
  • Added visual indicator showing template unit in create task modal (e.g., "Unidad definida por la plantilla: M2")
  • Fixed editable quantity field in budget table with real-time save functionality via handleUpdateQuantity
  • Users can now edit task quantities directly in budget table with automatic persistence
  • Prepared project for deployment with optimized mobile UX
- July 8, 2025. Fixed unit_id architecture and corrected task preview generation system - COMPLETED
  • Successfully moved unit_id from task_generated table to task_templates table as requested by user
  • Added "Paso 2: Unidad" section to TaskTemplateEditorModal with unit selector and save functionality  
  • Fixed NewAdminGeneratedTaskModal parameters.forEach error by correcting generatePreviewDescription parameter order
  • Corrected budget tasks query to use proper task_generated_view table instead of non-existent task_generated_view_1
  • Enhanced generatePreviewDescription function to properly use expression_template for accurate task name generation
  • System now correctly generates task descriptions like "Muros simples de ladrillo cerámico hueco de 12x18x33 con mortero de asiento de cemento de albañilería"
  • Fixed TaskTemplateEditorModal structure: Step 1 (Basic Info), Step 2 (Unit), Step 3 (Parameters) as requested
  • Added updateTemplateUnitMutation for real-time unit updates with proper cache invalidation and toast notifications
- July 8, 2025. Enhanced task search interface with improved UX and fixed budget selection persistence - COMPLETED
  • Improved TaskSearchCombo empty state with circular icon and clear messaging
  • Changed "Crear Tarea Personalizada" button to use conventional app primary colors (bg-accent text-accent-foreground)
  • Enhanced modal creation interface with emojis and visual section organization
  • Added gradient styling to task preview section for better visual hierarchy
  • Fixed budget selector initialization to properly load and maintain last_budget_id from user preferences
  • Corrected budget selection persistence issue on page refresh by removing conflicting useEffect
  • Enhanced console logging for better debugging of budget selection state changes
- July 8, 2025. Enhanced task generation system with is_system categorization and improved admin interface - COMPLETED
  • Added is_system boolean column to task_generated table for categorizing system vs user tasks
  • Updated NewAdminGeneratedTaskModal with is_system switch field above unit field for task categorization
  • Added "Tipo" column to AdminGeneratedTasks table showing Sistema/Usuario badges with proper color coding
  • Updated task creation/editing mutations to include is_system parameter in both create and update operations
  • Enhanced admin statistics to show system tasks count and user tasks count instead of public/private
  • Added comprehensive filtering by task type (all/system/user) with proper filter persistence
  • Modified form submission to properly handle is_system field extraction and database persistence
  • Updated clearFilters function to reset type filter to 'all' for complete filter reset functionality
- July 8, 2025. Fixed budget filtering and task search improvements plus temporary onboarding issue resolution - COMPLETED
  • Enhanced useBudgets hook to filter by both project_id AND organization_id to prevent data leaks between organizations
  • Modified useTaskSearch hook to remove organization filter so all tasks are available when adding to budgets (as requested)
  • Fixed temporary ProtectedRoute issue where null preferences caused infinite onboarding redirects
  • User manually recreated user_preferences database record to resolve missing preferences data
  • System now properly filters budgets by organization while allowing full task catalog access during budget creation
  • Improved data security by ensuring budgets only show within correct organizational boundaries
- July 8, 2025. Complete task description generation system and cache invalidation implementation - COMPLETED
  • Fixed useAllTaskParameterValues hook to properly JOIN with task_parameters table to access expression_template column
  • Task table now correctly displays full descriptions like "Muros Simples de ladrillo cerámico hueco de 12x18x33 con mortero de asiento de cemento de albañilería" 
  • Eliminated F5 refresh requirement by adding proper cache invalidation for 'all-task-parameter-values' query key
  • Updated all parameter CRUD operations (create, update, delete) to invalidate both parameter admin cache and task generation cache
  • Parameter option modifications now automatically refresh task generation display without page reload
  • Modal and table generation now use identical logic ensuring consistent task name generation throughout system
  • Removed all debugging logs for production-ready clean code quality
- July 8, 2025. Task parameter modal cleanup: eliminated Campo Obligatorio field and consolidated all parameter fields into single view - COMPLETED
  • Removed "Campo Obligatorio" field from parameter editing modal as requested by user
  • Consolidated all form fields into single view without accordion separation for cleaner interface
  • Added validation to prevent duplicate groups for same category with proper error messages
  • Enhanced subcategory dropdown to filter out categories that already have groups
  • Fixed all references to deleted database columns (is_required, role, semantic_role)
  • Modal now displays: Etiqueta, Nombre, Tipo, Plantilla de frase, and Groups section for select types
  • Improved user experience with toast notifications for successful group creation and error handling
- July 8, 2025. Fixed task preview generation to use expression_template from task_parameter_values - COMPLETED
  • Updated useTaskTemplateParameterOptions hook to query task_parameter_values table instead of non-existent task_template_parameter_options
  • Corrected preview generation logic to use expression_template column from task_parameter_values (e.g., "con mortero de {value}")
  • Fixed both preview display and actual task creation to properly use expression templates from selected parameter values
  • Task descriptions now generate correctly: "Muros Simples {{mortar_type}}" + "con mortero de {value}" = "Muros Simples con mortero de Cal y Cemento"
  • System now properly formats task names using semantic expressions instead of raw parameter labels
- July 8, 2025. Updated task_tasks column reference from "description" to "name" throughout system - COMPLETED
  • Fixed all database queries, interfaces, and references to use "name" column instead of "description" in task_tasks table
  • Updated BudgetTask interfaces in use-budget-tasks.ts and ConstructionBudgets.tsx to use name field
  • Corrected NewBudgetTaskModal to display task names properly using name field instead of description
  • Fixed AdminGeneratedTasks page to show task names correctly in table columns
  • Updated GeneratedTask interface and all CRUD operations in use-generated-tasks.ts to use name field
  • Modified NewAdminGeneratedTaskModal to create and update tasks using name field for consistency
  • System now properly displays task names throughout the application using consistent field naming
- July 8, 2025. Fixed task generation system with direct task_tasks table integration - COMPLETED
  • Eliminated all references to deleted RPC function and corrected code to work directly with task_tasks table
  • Fixed name_template processing to properly replace {{parameter-name}} placeholders with expression_template values
  • Corrected database column mapping to use actual task_tasks structure: code, template_id, param_values, description, is_public, organization_id
  • Removed non-existent 'task' column reference that was causing schema cache errors
  • Fixed generateTaskDescription function reference error by implementing inline description generation logic
  • System now successfully creates tasks with proper name generation: "Muros Simples {{mortar_type}}" → "Muros Simples Cal y Cemento."
  • Task creation flow verified working: template selection → parameter filling → description generation → database insertion
  • Cleaned up debugging logs for production-ready code quality
- July 7, 2025. TaskTemplateEditorModal modal aesthetics simplified with accordion structure and clean parameter display - COMPLETED
  • Refactored modal to follow ai-modal-template.md standards using Accordion components for better organization
  • Replaced Card-based layout with three main accordion sections: Estado de la Plantilla, Agregar Parámetro, and Parámetros de la Plantilla
  • Cleaned up parameter display in "Parámetros de la Plantilla" section to show only essential information
  • Removed position value and UUID group display as requested - now shows only parameter name, type, required status
  • Simplified grid layout from 4 columns to 3 columns for cleaner parameter visualization
  • Enhanced visual consistency with other modals using accordion collapsible interface
  • Modal now opens with "Estado de la Plantilla" accordion expanded by default for immediate context
  • Parameter cards use streamlined layout: name/type badges (left), required toggle (center), delete button (right)
- July 7, 2025. Enhanced AdminTaskParameters with "Grupos" column and UI improvements - COMPLETED
  • Added "Grupos" column in third position of CustomTable before Actions column
  • Fixed "GESTIONAR OPCIONES" button to show only CheckSquare icon without pencil button
  • Column currently shows "Por implementar" placeholder - ready for group badges implementation
  • Updated button styling to be cleaner with single checkbox icon for group management
  • Removed non-functional pencil edit button for group names as requested
  • Table now properly displays parameter options with groups association preview
- July 7, 2025. Fixed TaskParameterEditorModal structure and group assignment modal functionality - COMPLETED
  • Corrected modal structure issue that was causing main modal to appear as horizontal line
  • Fixed CustomModalLayout syntax with proper {{ }} structure for header/body/footer props
  • Moved group assignment modal outside main modal structure to prevent z-index and rendering conflicts
  • Eye button (👁️) now properly opens assignment modal for selecting which options belong to each group
  • Edit button (✏️) correctly edits only group name as expected by user
  • Removed debug console logs for production-ready clean code
  • Modal hierarchy now works correctly: main parameter editor + separate overlay for group option assignment
- July 7, 2025. Enhanced TaskParameterEditorModal with group-option assignment functionality - COMPLETED
  • Added comprehensive interface to assign task_parameter_values to task_parameter_option_groups via task_parameter_option_group_items table
  • Implemented dual-modal system: main parameter editor + group items assignment modal with checkbox interface
  • Created optimized SQL queries using separate calls for parameter values and selected items for better performance
  • Added real-time mutation system for adding/removing options from groups with proper cache invalidation
  • Built responsive checkbox interface with selection counter and visual feedback (badges, loading states)
  • Enhanced Eye (👁️) button functionality to open assignment modal showing all available options with current selection state
  • System now supports complete CRUD operations for group-option relationships with toast notifications
  • Fixed all button type="button" attributes to prevent unwanted form submissions during group management
- July 7, 2025. Complete task parameter system fixes with proper database separation and clean UI display - COMPLETED
  • Fixed TaskParameterEditorModal to properly separate Opciones Generales (task_parameter_values) from Grupos de Opciones (task_parameter_option_groups)
  • Corrected query keys and data mapping to display actual option groups instead of individual parameter values in groups section
  • Updated UI to show only labels without empty parentheses in options display for cleaner presentation
  • Enhanced options display to show label as primary text with optional name in parentheses for better user clarity
  • Eliminated all debugging console logs for production-ready code
  • Fixed database schema mapping: TaskParameterOption interface uses 'name' (code) and 'label' (visible text) fields
  • Added missing Tailwind CSS variables (--border, --card, --card-foreground, --background, --foreground) for proper theming
  • Resolved all TypeScript errors and null value warnings throughout parameter management system
- July 7, 2025. TaskTemplateEditorModal restoration and functionality recovery - COMPLETED
  • Successfully restored TaskTemplateEditorModal.tsx to working state after multiple failed repair attempts
  • Fixed modal appearing as white line by using correct CustomModalLayout structure instead of problematic structure
  • Restored complete CRUD functionality: create template, add parameters, toggle required status, delete parameters
  • Modal now uses proper Card components, CustomModalHeader/Body/Footer, and columns={1} for single-column layout
  • All parameter management features working: parameter selection, option groups for select types, position handling
  • Switch toggles for required/optional parameters functional with proper database updates
  • Template creation for categories without existing templates fully operational
  • System stable and no longer requires checkpoint rollbacks for basic functionality
- July 7, 2025. Complete mobile navigation fixes and financial movements sorting correction - COMPLETED
  • Fixed mobile menu layout to use 80vh height instead of 100vh to accommodate 20% top spacing with backdrop opacity
  • Added automatic scroll-to-top functionality when navigating on mobile - pages now always start from top instead of scrolled position
  • Corrected financial movements table sorting to properly use CustomTable defaultSort instead of overriding with manual sorting
  • Removed manual sorting logic that was using created_at instead of movement_date field for chronological ordering
  • Fixed default sort order to show newest movements first (desc) instead of oldest first, matching user expectations
  • Enhanced mobile navigation UX with smooth scroll behavior and proper timing for context changes
- July 7, 2025. Modern Landing page redesign with dark theme and authentication state detection - COMPLETED
  • Completely rebuilt Landing.tsx using dark theme with CSS variables from index.css (--layout-bg, --text-default, --accent, etc.)
  • Implemented authentication state detection to show user avatar and Dashboard button when logged in
  • Reorganized header layout like Supabase: logo + navigation (left), GitHub stars + auth buttons (right)
  • Updated all buttons to use proper CSS variables: --accent for primary, --button-secondary-bg for secondary, --button-ghost-bg for ghost
  • Added user dropdown menu with logout functionality when authenticated
  • Replaced hardcoded blue colors with --accent variable throughout all authentication pages (Login, Register, ForgotPassword)
  • Enhanced Google OAuth functionality in Login and Register pages using existing signInWithGoogle from authStore
  • Applied professional dark theme styling matching Supabase aesthetic with proper contrast and readability
  • Hero section follows "Build in a weekend, Scale to millions" messaging pattern with construction industry focus
- July 7, 2025. File reorganization and routing structure cleanup - COMPLETED
  • Moved Tasks.tsx to OrganizationTasks.tsx in organization directory for better organization
  • Moved NotFound.tsx to root pages directory for proper 404 handling across all routes
  • Moved SelectMode.tsx to Onboarding.tsx in root pages directory following naming convention
  • Updated NotFound.tsx to intelligently redirect based on authentication: unauthenticated users → "/" (landing), authenticated users → "/dashboard"
  • Fixed Route path="*" component={NotFound} for proper 404 handling of undefined routes
  • Updated all imports and references in App.tsx to match new file structure
  • Fixed "Mi Perfil" sidebar button route from /perfil to /profile for proper navigation
  • Verified all mobile menu routes are correctly configured for new file structure
- July 7, 2025. Complete route structure reorganization with landing page and authentication system - COMPLETED
  • Created Landing.tsx as public homepage with Supabase-style presentation, features showcase, and strong CTAs
  • Built complete authentication system: Login.tsx, Register.tsx, ForgotPassword.tsx with proper form validation
  • Created DashboardHome.tsx as main dashboard with quick actions and activity overview
  • Implemented AuthRedirect.tsx component for automatic route protection and redirection logic
  • Reorganized App.tsx with clean route structure: public routes (/, /login, /register) and protected routes (/dashboard, /organization, etc.)
  • Added intelligent redirection: unauthenticated users → /login, authenticated users visiting public routes → /dashboard
  • Eliminated all duplicate, deprecated, and malformed routes for clean navigation structure
  • Maintained all existing functionality while providing professional public-facing interface
  • Authentication flow: Landing → Register/Login → Onboarding (if needed) → Dashboard → App sections
- July 7, 2025. Fixed onboarding system redirect loop and double-click issue - COMPLETED
  • Fixed ProtectedRoute.tsx logic that was incorrectly redirecting users with completed onboarding back to select-mode
  • Changed redirect condition to only check onboarding_completed status instead of both completion and user_type
  • Users with onboarding_completed: TRUE are no longer redirected to onboarding regardless of user_type status
  • Added personal data verification as additional safety check for edge cases
  • Increased Step3SelectMode setTimeout delay from 100ms to 300ms to fix double-click requirement
  • Step 3 mode selection now properly completes onboarding with single click and redirects to dashboard
  • Enhanced console logging to debug onboarding flow and user state verification
- July 6, 2025. Enhanced project navigation with new sidebar structure and mobile organization selector fix - COMPLETED
  • Fixed mobile menu organization selector to automatically update project selection (like header behavior)
  • Added "Datos Básicos" button above "Diseño" in project sidebar with new "data" context navigation
  • Added "Post-Venta" button below "Comercialización" in project sidebar with restriction (coming soon)
  • Created new sidebar contexts: "data" and "postsale" with proper navigation structure
  • Reorganized project sidebar order: Datos Básicos → Diseño → Obra → Finanzas → Comercialización → Post-Venta
  • Updated both desktop Sidebar.tsx and mobile MobileMenu.tsx with consistent navigation patterns
  • Added proper context titles and animations for new mobile menu sections
  • Enhanced mobile organization change to fetch and set first project from new organization automatically
- July 6, 2025. Enhanced user linking system with improved display and automatic full_name generation - COMPLETED
  • Fixed contact list display to show linked user names and avatars properly instead of generic "Usuario de Archub" text
  • Updated contact creation/editing to automatically generate full_name field by combining first_name and last_name
  • Enhanced visual indicators in contact list: linked users show actual avatars and names from user data
  • Improved contact detail cards to use full_name for consistent display across all contact views
  • Added proper fallback logic: use full_name when available, otherwise combine first_name + last_name
  • Contact vinculación system now fully functional with proper data persistence and visual feedback
  • Changed contacts page from wide layout to normal layout for better user experience
  • Converted contact list from cards to CustomTable positioned below user detail cards
  • Enhanced UI structure: contact detail cards above, CustomTable with full contact management below
  • Restructured page to follow ai-page-template.md standard: moved all search, filters and actions to headerProps
  • Eliminated all cards and extra UI elements, keeping only clean CustomTable with integrated actions
  • Applied proper template pattern: search in header, filters as clickable buttons, actions in header actions area
  • Enhanced user search system: requires complete email for email searches (exact match), partial name search allowed
  • Added clear button (X) to user search input field with proper styling and functionality
  • Fixed select background transparency issue - now has proper bg-background styling
  • Added click outside to close and focus/blur event handling for user search dropdown
  • Removed all hardcoded grid layouts from NewContactModal, now uses CustomModalBody columns={1} pattern
  • Improved user search dropdown: better styling, larger click areas, shadow effects, and proper z-index
  • Added "CREAR CONTACTO" button in header actions replacing "Nuevo Contacto" text
  • Implemented "Invitar a Archub" button with placeholder functionality showing development toast message
  • Created ContactCard.tsx component for mobile view with avatar, full_name, email display and SwipeableCard integration
  • Enhanced ContactCard with proper badge display for linked users and contact types
  • Integrated ContactCard as renderCard function in CustomTable for mobile-first responsive design
  • Removed card click-to-edit functionality - editing now only accessible through SwipeableCard "Editar" button
  • Added proper card spacing (space-y-3) between contact cards like movements page for visual separation
  • Implemented MobileActionBarContext with search, create, filters, and clear actions for mobile bottom menu
  • Mobile action bar includes search focus, create contact modal trigger, filter toggle, and clear functionality
- July 6, 2025. Fixed NewMovementModal user display issue and created project "Datos Básicos" page - COMPLETED
  • Fixed NewMovementModal user dropdown showing "Usuario sin nombre" by correcting data structure access in member mapping
  • Modal now properly displays user names using member.full_name instead of member.user.full_name (useOrganizationMembers already flattens data)
  • Created ProjectBasicData.tsx page following ai-page-template.md structure with proper Layout, headerProps and breadcrumb navigation
  • Added "Datos Básicos" button to both desktop Sidebar.tsx and mobile MobileMenu.tsx below "Comercialización" in project context
  • Configured /project/basic-data route in App.tsx with proper ProtectedRoute wrapper for authentication
  • Renamed ProjectInstallmentsPage.tsx to FinancesInstallments.tsx with updated imports for better organization
  • Page uses Database icon for consistency and includes demo section showing configuration capabilities
  • All navigation changes applied consistently between desktop and mobile interfaces for seamless user experience
- July 5, 2025. Fixed installments modal currency field and database column errors - COMPLETED
  • Resolved currency field showing "N/A - Sin nombre" by using existing useOrganizationCurrencies hook
  • Fixed database error by removing non-existent 'main_category_id' column and using correct movement table structure
  • Corrected movement data to use proper columns: type_id, category_id, subcategory_id with hardcoded installment category IDs
  • Installments modal now successfully creates movements with proper currency display and database persistence
  • System automatically categorizes installments as INGRESO > PREVENTA > CUOTAS for proper financial tracking
- July 5, 2025. Complete project installments (aportes) system implementation with sidebar navigation integration - COMPLETED
  • Created ProjectInstallmentsPage.tsx in src/pages/finances/ with complete CRUD functionality for project installments management
  • Built NewInstallmentModal.tsx using proper CustomModalLayout pattern with TypeScript compliance and form validation
  • Implemented installments page that filters movements by "Cuotas" concept to display contact-based project contributions
  • Added comprehensive installments interface with summary card showing total contributed amounts and proper table display
  • Page includes search functionality, empty state handling with CustomEmptyState component, and proper error handling
  • Successfully added /finances/installments route to App.tsx with proper ProtectedRoute wrapper for authentication
  • Added "Aportes" button with CreditCard icon to finances sidebar navigation between "Movimientos" and "Preferencias de Finanzas"
  • Enhanced finances context in both desktop Sidebar.tsx with proper navigation to installments management page
  • Modal handles both create and edit scenarios with proper form validation, currency selection, wallet management, and contact assignment
  • System integrates with existing movement concepts database structure to track project funding contributions from investors
- July 5, 2025. Complete centralized auto-save system implementation with useDebouncedAutoSave hook - COMPLETED
  • Created reusable useDebouncedAutoSave hook in src/hooks/useDebouncedAutoSave.ts with 750ms debounce delay
  • Hook features: deep comparison to prevent unnecessary saves, skips first render, proper cleanup with timeout cancellation
  • Returns isSaving and lastSavedAt states for visual feedback integration
  • Successfully implemented in Profile page replacing all individual mutations with single debounced auto-save system
  • Fixed database schema issues: avatar_url saves to 'users' table, profile fields save to 'user_data' table
  • Eliminated multiple Supabase update calls - now batches changes with 750ms delay after last user input
  • Added visual "Guardando..." indicator with animated accent dot when saving in progress
  • System prevents server spam while maintaining responsive UX with instant visual feedback
  • Auto-save working perfectly: tested with name changes, theme changes, sidebar toggles - all save automatically
  • Pattern ready for adoption across all pages: FinancesPreferences, OrganizationPreferences, and other real-time edit forms
- July 5, 2025. Fixed CONFIGURACIÓN DE FINANZAS page to use real database structure and proper data management - COMPLETED
  • Rebuilt FinancesPreferences.tsx using authentic database tables: organization_currencies, organization_wallets, organization_preferences
  • Implemented proper data flow: default selections from organization_preferences table, secondary selections from organization tables
  • Fixed user preferences integration using existing hooks: useCurrencies, useOrganizationCurrencies, useOrganizationWallets
  • Added real-time mutations for updating default currency/wallet with proper is_default column management
  • Enhanced secondary currencies/wallets management with add/remove functionality from organization tables
  • Removed all references to non-existent fields and auto-save errors that were causing database issues
  • Default selections now properly excluded from secondary selection lists to prevent duplication
  • All data now saves correctly to is_default column in organization_wallets and organization_currencies tables
  • Applied proper error handling and toast notifications for successful preference updates
  • Page now matches PERFIL page styling exactly with two-column layout and proper form organization
- July 5, 2025. Complete RESUMEN DE DISEÑO redesign with real data integration matching RESUMEN DE FINANZAS and RESUMEN DE OBRA styling - COMPLETED
  • Rebuilt DesignDashboard.tsx to match exact styling and structure of FinancesDashboard and ConstructionDashboard pages
  • Created useDesignDashboard hook with comprehensive real data queries: summary, recent documents, phases with tasks, upcoming tasks
  • Replaced all mock data with authentic Supabase data: document counts, phase progress, task completion rates
  • Implemented identical card styling with proper icons, text-2xl font-bold numbers, and text-xs descriptions
  • Added CustomEmptyState components with proper action buttons when no data exists (matching other dashboards)
  • Enhanced document status badges with color coding: green for approved, blue for in review, red for rejected
  • Added real-time progress calculation based on completed vs total tasks across all design phases
  • Integrated Avatar components for user display in recent documents and upcoming tasks
  • Applied consistent grid layouts: 4-column metrics, 2-column content cards, proper spacing with space-y-6
  • All data now sourced from design_documents, design_project_phases, design_phase_tasks, and users tables
- July 5, 2025. Enhanced design documentation with created_by and design_phase_id fields plus modal field reordering - COMPLETED
  • Added created_by field (mandatory) with dropdown showing all organization members, pre-selects current user
  • Added design_phase_id field (optional) with dropdown showing both organization-specific and default phases (NULL)
  • Updated useDesignPhases hook to fetch phases with organization_id matching current org OR null (default phases)
  • Enhanced design documents query with JOIN to users table to display creator information on document cards
  • Added creator avatar and name display on document cards for better user identification
  • Reordered modal fields per user specification: Creado por, Fase de Diseño, Carpeta, Nombre, Descripción, Estado, Archivo
  • Added visual indicator "(Por defecto)" for system-wide design phases vs organization-specific phases
  • Fixed all missing hook exports: useDesignProjectPhases, useGanttPhasesWithTasks, useCreateDesignProjectPhase
  • Complete form validation ensures created_by is required while design_phase_id remains optional
- July 5, 2025. Complete document versioning system implementation with automatic version increments and field corrections - COMPLETED
  • Fixed all database schema references to use 'file_name' field instead of 'name' as specified by user requirements
  • Implemented complete versioning system: new documents start at version 1, editing creates new version with automatic increment
  • Enhanced version calculation logic to check highest existing version for same file_name, folder, and project
  • Updated all TypeScript interfaces across modal and documentation page to use file_name field consistently
  • Fixed cache invalidation system to ensure real-time updates without F5 refresh requirement after mutations
  • Added version indicators to document cards showing version numbers (v2, v3, etc.) for documents with multiple versions
  • Corrected all form fields, search functionality, download functionality, and delete dialogs to use file_name
  • Version creation workflow: file selection → auto-fill file_name → upload to Storage → save metadata with correct version number
  • All document display and management operations now properly use file_name field throughout entire system
- July 5, 2025. Design documentation system implementation with file upload functionality and complete modal restructure - COMPLETED
  • Added file_name field to design documents for proper document naming as requested
  • Fixed database schema alignment - removed references to non-existent fields (name, visibility, design_phase_id)
  • Reorganized NewDesignDocumentModal field order: NOMBRE, DESCRIPCIÓN, file upload as specified
  • All modal fields now use full width layout instead of 50% grid layout
  • Enhanced auto-fill functionality: file name auto-populates from selected file name (without extension)
  • Fixed filtering system to search by file_name and description instead of non-existent name field
  • Updated document cards to display file_name with fallback to "Documento sin nombre" for null values
  • Corrected download functionality to use file_name for downloaded file names
  • Simplified document grouping to use folder structure only (phase functionality removed for now)
  • All TypeScript errors resolved and interfaces aligned with actual database structure
  • File upload flow: file selection → auto-fill name → upload to Storage → save metadata with correct fields
- July 5, 2025. Fixed onboarding navigation loop and optimized mobile UX components - COMPLETED
  • Fixed Step3SelectMode double-click issue by adding setTimeout delay before onFinish() execution
  • Disabled tab navigation for HelpPopover components using tabIndex={-1} to prevent keyboard focus
  • Optimized mobile menu footer buttons: reduced height from h-14 to h-10 with vertical icon+text layout
  • Changed footer buttons to use smaller icons (h-4 w-4) with text labels (Perfil, Changelog, Admin)
  • Corrected onboarding redirect paths from '/dashboard' to '/organization/dashboard' to prevent navigation loops
  • Fixed both onboarding completion and mode change redirections to use proper dashboard route
- July 5, 2025. Enhanced onboarding system with detailed descriptions, help tooltips, and corrected enum values - COMPLETED
  • Updated Step3SelectMode with detailed descriptions for each user mode explaining specific functionality
  • Added HelpPopover components to all Step3SelectMode cards with comprehensive explanations
  • Fixed enum values to match database exactly: team_size now uses EN DASH (–) instead of ASCII dash (-)
  • Applied --accent color to all required field asterisks (*) across onboarding steps
  • Changed Step3SelectMode selection ring from blue to --accent for consistent theming
  • Verified all cards use proper CSS variables (--card-bg, --card-border) for theme consistency
  • Corrected main_use, user_role, discovery_source, and team_size enum values to prevent database errors
- July 5, 2025. Complete 3-step onboarding system with enhanced user data collection and theme management - COMPLETED
  • Implemented complete 3-step onboarding flow: Datos básicos, Descubrimiento, Modo de uso
  • Added organization_name field to Step 1 that saves to organizations.name table
  • Updated field labels to plural forms: "Nombre/s" and "Apellido/s" for better UX
  • Fixed theme selection functionality to properly apply themes using themeStore integration
  • Enhanced Step 3 to match visual consistency with previous steps - cards within main card layout
  • Removed "Bienvenido a Archub" text and standardized description sizes across all steps
  • Added discovered_by and discovered_by_other_text fields to user_data schema for acquisition tracking
  • Integrated theme application immediately when onboarding completes using setTheme function
  • Fixed TypeScript errors and null checking for supabase instances throughout SelectMode.tsx
  • Updated description text to "Completa tu información personal y preferencias iniciales. Luego puedes cambiarlo."
  • Organization name field now required and validated in Step 1 before proceeding to next step
- July 4, 2025. UI constants cleanup and breadcrumb navigation fixes - COMPLETED
  • Eliminated src/lib/constants/ui.ts file and replaced constant usage with direct CSS values
  • Updated sidebar-button.tsx to use h-9 and w-[18px] h-[18px] classes instead of BUTTON_SIZE and ICON_SIZE constants
  • Fixed Gallery breadcrumb to follow correct order: ORGANIZACIÓN / PROYECTO / ETAPA / Galería by removing accordion parent mapping
  • Breadcrumb now properly shows organization name, project name, stage context (Obra), and page title (Galería)
  • Removed hardcoded constants throughout application in favor of standard CSS/Tailwind classes
- July 4, 2025. Complete DesignDocumentation page with document management system and file upload capabilities - COMPLETED
  • Added design_documents table to shared/schema.ts with complete fields for document management
  • Created DesignDocumentation.tsx page following ai-page-template.md structure with document grid and filtering
  • Built NewDesignDocumentModal.tsx with file upload, metadata forms, and CRUD operations
  • Implemented document grouping by folder or design phase with switch toggle interface
  • Added file type detection, status management (pendiente/en_revision/aprobado/rechazado), and visibility controls
  • Created comprehensive document cards with download, edit, delete actions and proper badge styling
  • Integrated with Supabase Storage for design-documents bucket with proper file handling
  • Added /design/documentation route to App.tsx with proper ProtectedRoute wrapper
  • Enhanced modal system to use proper CustomModalLayout structure with header/body/footer components
  • Fixed userData structure access for user.id in authentication flow
  • Moved prompts folder from src/ to root level following project structure requirements
- July 4, 2025. Comprehensive sidebar reorganization and DISEÑO section expansion with consistent layout patterns - COMPLETED
  • Repositioned "Volver a..." navigation buttons below "Resumen de..." buttons and above dividers in all sidebar contexts
  • Expanded DISEÑO sidebar with 6 new items: Documentación (unrestricted), Datos (restricted), Cronograma (timeline), Tablero (board), Cómputo (compute), Preferencias de Diseño (restricted)
  • Fixed mobile menu animation system to prevent menu closing during context transitions between navigation states
  • Enhanced CustomRestricted component to allow admin users to bypass "coming_soon" restrictions while maintaining visual restriction badge
  • Synchronized all navigation changes between desktop Sidebar.tsx and mobile MobileMenu.tsx for consistent user experience
  • Added Database and Layout icons to support new DISEÑO sidebar items with proper import structure
- July 4, 2025. Enhanced mobile menu design with footer navigation and animated transitions - COMPLETED
  • Changed MobileMenu header title from "ARCHUB·" to current context name (Organización, Proyecto, Diseño, etc.)
  • Redesigned mobile menu with flex layout: header (fixed top), navigation (flex-grow), footer (fixed bottom)
  • Moved organization and project selectors from navigation area to footer with compact design
  • Added responsive footer grid with icon-only buttons (Mi Perfil, Changelog, Admin) matching header height (h-14)
  • Fixed CustomRestricted badge styling: black borders and icon with white background instead of pink
  • Footer selectors appear above content with proper z-index positioning for better mobile UX
  • Added smooth directional animations for context transitions: left slide for advancing hierarchy, right slide for returning
  • Navigation area now has maximum space for menu items without distractions
  • Admin button appears only for admin users in mobile footer with proper conditional rendering
- July 4, 2025. Enhanced navigation and UI improvements with real data dashboards - COMPLETED
  • Changed DISEÑO context default navigation from timeline to dashboard in both desktop and mobile navigation
  • Updated CustomRestricted icon color from pink to --accent background with accent-foreground text
  • Added CustomRestricted to Comercialización buttons in both desktop sidebar and mobile menu with reason="coming_soon"
  • Completely removed all mock data from ConstructionDashboard and FinancesDashboard - now uses only real Supabase data
  • ConstructionDashboard shows real metrics from site logs, budgets, personnel, and materials with proper empty states
  • FinancesDashboard displays authentic financial calculations from movements table with monthly summaries
  • Both dashboards include real activity feeds, proper data aggregation, and working quick action buttons
  • Enhanced data integrity throughout dashboard system with loading states and empty state handling
- July 4, 2025. Complete financial movements file attachment system implementation - COMPLETED
  • Added "📎 Archivos" accordion section to movement creation/editing modal with "+ Agregar Archivo" functionality
  • Created uploadMovementFiles.ts utility following site log files pattern for movement-files bucket integration
  • Implemented complete file management: add, edit name, upload, delete for both new and existing files
  • Enhanced both regular movement and conversion forms with identical file attachment capabilities
  • Files automatically upload to movement-files bucket and save metadata to movement_files table
  • Added proper file loading for editing movements with existing file display and deletion functionality
  • File uploads integrated with movement save operations: files upload after successful movement creation/editing
  • System supports all file types with proper MIME type detection and unique UUID-based file naming
  • Conversion files associate with first movement (egreso) while maintaining conversion group relationship
- July 4, 2025. Mobile card interaction refinement and tap-to-edit removal - COMPLETED
  • Removed onClick handlers from all mobile cards to eliminate tap-to-edit functionality
  • Modal editing now exclusively accessible through SwipeableCard "Editar" button for better UX
  • Updated MovementCard, ConversionCard, SiteLogCard, and ChangelogCard to remove cursor-pointer and onClick
  • Eliminated onCardClick handler from CustomTable in FinancesMovements.tsx
  • Preserved ProjectCard navigation onClick as it serves different purpose (project selection vs editing)
  • Enhanced mobile user experience with intentional swipe-to-reveal actions instead of accidental modal triggers
- July 4, 2025. ConversionCard visual styling refinement and CustomTable renderCard integration - COMPLETED
  • Fixed ConversionCard styling to match regular movement cards: same background, hover states, and text colors
  • Changed conversion border to blue only (border-blue-500) while maintaining standard card appearance
  • Replaced date display with currency pair format: "ARS - USD" in left bottom position
  • Maintained conversion amounts display: "$7,800 → $9,984,000" in blue text on right side
  • Successfully integrated ConversionCard into CustomTable renderCard function with proper movement detection
  • ConversionCard automatically renders for conversion groups while MovementCard renders for regular movements
  • SwipeableCard functionality preserved for mobile touch interactions with edit/delete/favorite actions
  • Visual consistency achieved: only border color distinguishes conversions from regular income/expense movements
- July 4, 2025. Final MovementCard UI polish and conversion modal field organization - COMPLETED
  • Restructured conversion modal with correct Origen/Destino grouping: Origen (Moneda, Billetera, Cantidad) → Destino (Moneda, Billetera, Cantidad)
  • Completely removed all arrow indicators (↓) from conversion table columns: Moneda, Billetera, and Cantidad for cleaner visual presentation
  • Fixed MovementCard mobile layout with proper two-row alignment: Category aligned with Amount, Subcategory aligned with Currency
  • Enhanced MovementCard to use justify-between layout ensuring perfect alignment between left and right elements
  • Removed description field from MovementCard.tsx for cleaner 2-row information layout as requested
  • Updated conversion modal section headers to "Origen" and "Destino" with simplified field labels (Moneda, Billetera, Cantidad)
  • Confirmed sorting arrows disabled for Moneda, Billetera, and Cantidad columns in conversions table
  • All UI improvements completed with professional mobile-optimized appearance
- July 4, 2025. Complete conversion editing and deletion system with proper update/create handling
  • Implemented unified createConversionMutation that handles both creation and editing based on metadata detection
  • Fixed conversion editing to update existing movements instead of creating duplicates using _isConversion metadata
  • Enhanced mutation to properly update both egreso and ingreso movements in conversion groups with correct field mapping
  • Added dynamic toast messages for conversion operations: "Conversión creada" vs "Conversión actualizada"
  • Implemented complete conversion deletion system with handleDeleteConversion function for group-level operations
  • Enhanced deleteMovementMutation to handle both individual movements and conversion groups using _isConversionDeletion metadata
  • Added custom confirmation dialog messages: "¿Eliminar conversión completa?" with description for both movements deletion
  • Fixed deletion to remove all movements in conversion group using .in() query with movementIds array
  • System now properly differentiates between editing/deleting individual movements vs conversion groups throughout interface
- July 4, 2025. Complete UI refinements and conversion edit functionality implementation
  • Fixed text spacing in description column to match category column formatting for visual consistency
  • Removed sorting arrows from Moneda, Billetera, and Cantidad columns to reduce card size and improve mobile UX
  • Implemented comprehensive conversion editing system with proper data loading and field population
  • Added handleEditConversion function to properly detect and handle conversion group editing vs individual movements
  • Enhanced modal detection system for conversions using _isConversion and _conversionData metadata markers
  • Modal now correctly opens in conversion mode when editing conversion groups, populating all conversion fields
  • Fixed edit functionality to load complete conversion data: from/to currencies, amounts, wallets, dates, and descriptions
  • Updated all edit triggers (card clicks and action buttons) to use handleEditConversion for conversion groups
  • Conversion editing now opens with proper form state showing all conversion parameters instead of single egreso movement
- July 4, 2025. Enhanced financial movements table with conversion grouping and professional visual styling
  • Implemented conversion group visualization system grouping movements with same conversion_group_id into single table rows
  • Added MovementOrGroup type union to handle both regular movements and conversion groups in table interface
  • Enhanced table columns with specialized rendering for conversions: currency arrows, dual amounts, and neutral styling
  • Created movement-row-conversion CSS class with blue background (rgba(59, 130, 246, 0.08)) and blue border for visual distinction
  • Conversion groups display format "Conversión USD → ARS" with proper from/to currency and amount visualization
  • Implemented comprehensive action system for conversion groups: favorite/unfavorite both movements, edit egreso movement, delete entire conversion
  • Actions work seamlessly: clicking conversion rows opens edit modal with proper data, hover actions function correctly
  • Enhanced user experience: conversion groups behave like unified entities while maintaining individual movement editing capabilities
- July 4, 2025. Fixed file upload system with proper RLS policy compliance and corrected authentication flow
  • Implemented proper file upload sequence: create database record first, then upload to Storage to satisfy RLS
  • Removed user.id prefix from file paths - now uses crypto.randomUUID() for unique filenames only
  • Fixed authentication to use real user.id from context (users table) instead of auth.uid() for RLS compliance
  • Updated uploadSiteLogFiles function to handle database insertion and Storage upload in correct order
  • Enhanced error handling with database record cleanup if Storage upload fails
  • Eliminated saveSiteLogFiles function - all operations now handled in single uploadSiteLogFiles call
  • Fixed NewSiteLogModal to pass required userId and organizationId parameters from userData context
  • System now properly respects Supabase RLS policies requiring site_log_files table entries for Storage access
- July 4, 2025. Complete gallery system implementation with mobile-first design and file upload restoration
  • Restored site-log-files bucket usage after user fixed RLS policies - files now upload to correct bucket
  • Re-enabled all database operations for site_log_files table with proper site_log_id relationships
  • Created ConstructionGallery.tsx page with modern mobile-first gallery interface following ai-page-template.md structure
  • Built comprehensive gallery grid with responsive layout: 2-6 columns based on screen size (mobile to desktop)
  • Implemented advanced lightbox with navigation controls, file info overlay, and download functionality
  • Added dual filtering system: file type (all/image/video) and date (monthly grouping with localized names)
  • Gallery displays files from all project bitácoras sorted by date (newest to oldest) as requested
  • Enhanced file cards with hover overlays showing creator info, date, and entry type badges
  • Integrated video playback support with Play button overlay and proper video controls in lightbox
  • Added "Galería" navigation button to construction sidebar with Images icon between Personal and Volver a Proyecto
  • Gallery route /construction/gallery properly configured in App.tsx with ProtectedRoute wrapper
  • Mobile-optimized interface matches phone gallery aesthetic with proper aspect ratios and touch interactions
- July 4, 2025. Complete AdminChangelogs system implementation with professional admin interface for changelog_entries management
  • Created AdminChangelogs.tsx page in src/pages/admin/ following ai-page-template.md structure with comprehensive table interface
  • Built NewAdminChangelogEntryModal.tsx in src/modals/admin/ with proper form validation and single-column layout
  • Added "Changelog" navigation button to admin sidebar under ADMINISTRACIÓN > Comunidad section
  • Implemented complete CRUD operations: create, edit, delete with confirmation dialogs and proper error handling
  • Enhanced filtering system with type filters (Novedad, Mejora, Arreglo de Errores) and visibility filters (public/private)
  • Statistics cards show Total Entries, Public Entries, Recent Entries (7 days), and Improvements count
  • Added /admin/changelogs route with proper AdminProtectedRoute wrapper in App.tsx
  • Table displays creation date, title, type badges with icons, creator info, visibility badges, and change date
  • All data sourced from authentic Supabase changelog_entries table with proper error handling and loading states
  • Modal uses single-column layout (columns={1}) eliminating hardcoded grid layouts as per system standards
- July 4, 2025. Enhanced floating actions system with card-style background and red filled heart favorites
  • Changed TableRowActions background to use standard card styling (bg-card, border-border) instead of gradient
  • Implemented red filled heart icon for favorite button when active - text-red-500 with fill-current class
  • Enhanced favorite button with isActive prop controlling red color state when is_favorite is true
  • Added scroll capability to CustomModalBody with overflow-y-auto and max-height constraints for long content
  • Floating actions now have proper card-style background with shadow-sm and border styling
  • Button hover states include background color changes and improved visual feedback for all variants
  • Fixed favorite button to use red filled heart icon (fill-current) instead of outline when favorited
  • Eliminated all hardcoded grid layouts from NewMovementModal - now fully managed by CustomModalBody columns prop
  • System provides complete visual hierarchy with card styling and intuitive red filled heart favorites
- July 4, 2025. Complete SwipeableCard integration across all mobile cards with iOS-style swipe functionality
  • Successfully integrated SwipeableCard component with all 4 card types: ProjectCard, SiteLogCard, MovementCard, and ChangelogCard
  • Removed action buttons from all cards since swipe actions now replace them for mobile interface consistency
  • Enhanced ProjectCard with proper callback functions (onEdit, onDelete, onSelect) for SwipeableCard integration
  • Applied SwipeableCard wrapper to SiteLogCard with Star (favorite), Edit, and Delete swipe actions
  • Updated MovementCard with SwipeableCard support including onEdit, onDelete, onToggleFavorite callback functions
  • Enhanced ChangelogCard with conditional admin-only swipe actions (Edit/Delete) and removed inline action buttons
  • All cards now provide WhatsApp/iOS Mail-style swipe functionality with proper action button reveal on mobile
  • Maintained desktop functionality while adding mobile-optimized swipe gestures for better mobile UX
  • Consistent SwipeableCard pattern applied across entire card system following established mobile design patterns
- July 4, 2025. Fixed navigation synchronization and breadcrumb improvements
  • Added missing routes /organization/projects and /organization/contacts to App.tsx for OrganizationProjects.tsx and OrganizationContacts.tsx
  • Changed contact icon from Users to Contact in both desktop sidebar and mobile menu to avoid duplication with members
  • Enhanced stage selector in header breadcrumb to include all project phases: design, construction, finances, commercialization
  • Added "Gestión de Organizaciones" button to organization context in both desktop and mobile menus linking to /organizations
  • Fixed breadcrumb stage selector with proper context switching and navigation to all phase dashboards
  • Corrected finanzas preferences route from /organization/preferences to /finances/preferences in both navigation systems
  • Stage breadcrumb now correctly displays "Diseño", "Obra", "Finanzas", "Comercialización" labels matching sidebar contexts
  • Enhanced dropdown stage selector to include all phases with proper navigation and context switching functionality
- July 4, 2025. Sidebar navigation fixes and visual improvements
  • Removed "Gestión de Organizaciones" button from organization context and eliminated empty "organizations" sidebar state
  • Fixed admin context structure: removed title, replaced with divider after "Resumen de Administración" 
  • Reduced divider padding from my-2 to my-1 for tighter spacing matching administration/plan divider
  • Added ChevronRight icons to stage navigation buttons: Diseño, Obra, Finanzas, Comercialización
  • Updated SidebarButton component to support rightIcon prop with proper rendering logic
  • Applied all navigation fixes consistently to both desktop Sidebar.tsx and mobile MobileMenu.tsx
  • Admin context now follows correct structure: Resumen → divider → Comunidad (accordion) → Tareas (accordion) → Materiales (accordion)
- July 4, 2025. Complete sidebar navigation updates and finances module restructuring
  • Eliminated "Tareas" access from sidebar footer as requested
  • Added "Proyectos" button to ORGANIZACIÓN context above "Actividad" linking to /organization/projects
  • Fixed "FINANZAS" button navigation to properly set sidebar context and navigate to /finances/dashboard
  • Added "Contactos" button to ORGANIZACIÓN context above "Miembros" linking to /organization/contacts
  • Moved OrganizationPreferences.tsx to FinancesPreferences.tsx in src/pages/finances/ directory
  • Created new FinancesDashboard.tsx page with comprehensive financial overview and statistics cards
  • Updated App.tsx routing to include /finances/dashboard and /finances/preferences routes
  • Applied all navigation changes consistently to both desktop Sidebar.tsx and mobile MobileMenu.tsx
  • Removed all OrganizationPreferences references and routes from App.tsx after successful file migration
  • Enhanced finances context in both desktop and mobile navigation with proper "Resumen de Finanzas" and "Preferencias de Finanzas" structure
  • Sidebar now provides clean hierarchical navigation: ORGANIZACIÓN → includes Proyectos/Contactos, FINANZAS → properly navigates to dashboard
  • All file imports and routing correctly point to new finances directory structure
- July 4, 2025. Complete sidebar navigation restructure with simplified context-based system
  • Eliminated problematic accordion-based contexts and removed all context titles except "ADMINISTRACIÓN"
  • Redesigned ORGANIZACIÓN context: Resumen de la Organización, Actividad, Miembros, Tareas (simple navigation)
  • Redesigned PROYECTO context: Resumen del Proyecto, Diseño, Obra, Finanzas, Comercialización, Volver a Organización
  • Created DISEÑO context: Resumen de Diseño, Cronograma, Volver a Proyecto (minimal structure)
  • Created OBRA context: Resumen de Obra, Presupuestos, Materiales, Bitácora, Personal, Volver a Proyecto
  • Created FINANZAS context: Resumen de Finanzas, Movimientos, Preferencias de Finanzas, Volver a Proyecto
  • Created COMERCIALIZACIÓN context: Resumen de Comercialización, unit listings, clients, statistics, Volver a Proyecto
  • Maintained ADMINISTRACIÓN context with accordion structure: Resumen de Administración + existing accordion sections
  • Applied all changes consistently to both desktop Sidebar.tsx and mobile MobileMenu.tsx
  • Navigation structure now provides clear hierarchical organization without confusing accordion nesting
  • Each context provides direct access to its relevant sections with proper "Volver a..." navigation
- July 4, 2025. Complete file reorganization and navigation improvements implementation
  • Moved CustomRestricted.tsx to src/components/ui-custom/misc/ for better organization
  • Moved Header.tsx, Layout.tsx, Sidebar.tsx, SidebarButton.tsx to src/components/layout/desktop/
  • Moved MobileActionBarContext.tsx to src/components/layout/mobile/
  • Updated all import paths across 30+ files to reflect new file structure
  • Fixed "Resumen del Proyecto" to navigate without changing sidebar state as requested
  • Removed "ADMINISTRACIÓN" button from organization context (now only in footer for admin users)
  • Added context titles ("Menu") above first button in design, construction, finances, commercialization, and admin contexts
  • Applied changes consistently to both desktop Sidebar.tsx and mobile MobileMenu.tsx
  • Enhanced navigation UX with clear visual hierarchy and improved context separation
  • File structure now follows desktop/, mobile/, and misc/ organization for better maintainability
- July 3, 2025. Reorganized sidebar navigation structure with simplified organization context and direct access to all main sections
  • Modified organization context in useNavigationStore to show streamlined navigation: Resumen de Organización, Resumen del Proyecto, and direct access buttons
  • Added direct navigation buttons in organization context for Diseño, Obra, Finanzas, and Comercialización sections
  • Created dedicated finances context with Resumen de Finanzas, Movimientos, and Preferencias pages
  • Updated both desktop Sidebar.tsx and mobile MobileMenu.tsx to maintain consistent navigation structure
  • Added finances context type to SidebarContext with proper context switching functionality
  • Navigation now provides single-click access to all major sections from organization level without deep accordion navigation
  • Enhanced context titles in mobile menu to include all navigation contexts (Diseño, Obra, Finanzas, Comercialización)
- July 3, 2025. Fixed generated task system with proper description handling and edit/create separation
  • Fixed task description generation by sending processed description (not template) to database via input_description parameter
  • Separated task creation and editing workflows: useCreateGeneratedTask for new tasks, useUpdateGeneratedTask for existing
  • Resolved duplicate task creation issue on edit by implementing proper edit/create logic separation
  • Task descriptions now display actual generated content (e.g., "Ejecución de Muros Simples de ladrillo-común") instead of template codes
  • Added comprehensive logging for debugging task creation and material management workflows
  • Modal correctly handles both creation ("Crear Tarea Generada") and editing ("Actualizar Tarea Generada") states
  • Task editing now updates existing records instead of creating duplicates with unique constraint violations
- July 3, 2025. Fixed bitácora modal structure and completed materials management system for generated tasks
  • Corrected bitácora modal by removing problematic padding="md" parameter from CustomModalBody
  • Fixed materials management to use correct database table structure: task_materials with amount (not quantity), organization_id
  • Updated TaskMaterial interface and all hooks to match actual database schema (task_id, material_id, amount, organization_id)
  • Implemented complete materials workflow: view existing materials, add new materials with quantity selection, delete materials
  • Added proper state management: materials reset when creating new tasks, task ID captured for materials association
  • Enhanced accordion with dynamic material count display showing actual material count from database
  • Materials section only enables after task creation, preventing orphaned material records
  • Fixed all TypeScript errors for proper amount field usage throughout materials management system
- July 3, 2025. Completed dynamic task generation modal with parameter loading and description generation
  • Fixed useTaskTemplateParameters hook to properly JOIN with task_parameters table through task_template_parameters junction
  • Enhanced TaskTemplate interface to include name_template, code_prefix, category_id, and action_id fields
  • Added columns={1} prop to NewAdminGeneratedTaskModal for single-column layout consistency
  • Implemented generateDescription function to replace {{parameter}} placeholders with actual user values
  • Added real-time preview of generated description showing how final task will appear
  • Fixed React key warnings by using composite keys for parameter fields
  • Simplified form schema using z.catchall(z.any()) for dynamic parameter validation
  • Modal now properly loads parameters from database, renders dynamic form fields, and generates descriptions
- July 3, 2025. Fixed task category and template modal layout issues and z-index problem in TemplateNameBuilder
  • Added columns={1} prop to CustomModalBody in NewAdminTaskCategoryModal.tsx for single-column layout
  • Added columns={1} prop to CustomModalBody in NewTaskTemplateModal.tsx for single-column layout  
  • Fixed z-index issue in TemplateNameBuilder PopoverContent with z-[9999] class for "Insertar Parámetro" button visibility
  • All modals now display correctly with proper single-column form layout and working parameter insertion dropdown
- July 3, 2025. Implemented minimalist SiteLogCard mobile component with inline action buttons and optimized layout
  • Created ultra-minimalist SiteLogCard.tsx with 3-row compact design: action buttons (top-right), type+date (inline), creator (bottom)
  • Removed weather display, public/private badges for cleaner mobile interface
  • Added Star (favorite) and Trash2 (delete) buttons positioned inline with card header for easy access
  • Reorganized layout: entry type badge and date/time on same line for space efficiency
  • Integrated MobileActionBar with 5 action slots: Home, Search, Create Entry (green button), Filters, Clear Filters
  • Added conditional rendering in ConstructionLogs.tsx: SiteLogCard for mobile, Collapsible for desktop
  • Fixed modal scrolling issues by removing duplicate overflow-y-auto from CustomModalBody and enhancing CustomModalLayout
  • Reverted modal footer to standard CustomModalFooter removing delete button per user request
  • Cards now clickable for editing with separate action buttons for favorites and deletion
  • MobileActionBar auto-configures on mobile with contextual actions and clears on component unmount
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