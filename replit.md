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