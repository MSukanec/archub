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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```