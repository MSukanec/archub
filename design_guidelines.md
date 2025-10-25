# Archub Construction Management Platform - Home Dashboard Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach with Linear/Notion inspiration
- **Justification:** Post-login dashboard prioritizes utility, information hierarchy, and professional functionality over marketing appeal
- **Key References:** Linear's clean layouts, Notion's content organization, Procore's construction-focused UX
- **Principles:** Professional clarity, efficient navigation, data-forward design, spatial confidence

## Typography System

**Font Stack:** Inter (primary), JetBrains Mono (data/metrics)

**Hierarchy:**
- Hero/Dashboard Title: 3xl/4xl, font-semibold (Welcome back, [User])
- Section Headers: xl/2xl, font-semibold
- Card Titles: base/lg, font-medium
- Body Text: sm/base, font-normal
- Metrics/Data: lg/xl, font-semibold (JetBrains Mono)
- Labels/Meta: xs/sm, font-medium, opacity-60

## Layout System

**Spacing Primitives:** Use Tailwind units of 3, 4, 6, and 8 exclusively
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Container margins: mx-4, mx-6, mx-8

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-6
- Dashboard grid: 12-column system
- Sidebar (if needed): 64-80 fixed width on desktop, collapsible on mobile
- Content area: Remaining space with internal max-w-6xl

## Component Library

### 1. Dashboard Header
- Full-width bar with user greeting and quick stats
- Left: "Welcome back, [Name]" with current date/time
- Right: 3-4 key metrics in horizontal cards (Active Projects, Team Members, Tasks Due, Budget Status)
- Each metric card: Icon + Number + Label in compact horizontal layout
- Height: Compact (h-20 to h-24)

### 2. Hero Section with Image
**Structure:** Two-column asymmetric layout (60/40 split on desktop)
- **Left Column:** 
  - Large heading: "Your Projects at a Glance"
  - Subheading describing current activity
  - Primary CTA: "New Project" button with gradient accent background (yellow-green), backdrop-blur-md for glass effect
  - Secondary action link: "View All Projects"
- **Right Column:** 
  - Hero image showing construction site/team collaboration
  - Image treatment: rounded-2xl, subtle shadow, aspect ratio 4:3
  - No overlay needed - image complements rather than backgrounds text
- **Mobile:** Stack vertically, image first then content

### 3. Quick Access Cards Grid
**Layout:** 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3), gap-6

**Card Types:**
1. **Active Projects Card** - List of 3-5 recent projects with progress bars
2. **Recent Activity Feed** - Timeline of recent team actions/updates
3. **Tasks Overview** - Today's tasks categorized by priority
4. **Team Status** - Who's working on what, availability indicators
5. **Documents Hub** - Recent uploads, quick access to file categories
6. **Schedule Preview** - Upcoming milestones and deadlines

**Card Anatomy:**
- Rounded corners: rounded-xl
- Padding: p-6
- Border: border with subtle color in light mode, more prominent in dark
- Header: Icon + Title + "View All" link
- Content area: max-height with scroll if needed
- Minimum height: min-h-64 for consistency

### 4. Stats Dashboard Section
**Layout:** 4-column grid (grid-cols-2 lg:grid-cols-4), gap-4
- Each stat card: Icon, large number, label, trend indicator (↑/↓ with percentage)
- Cards use gradient accent subtly on hover
- Metrics: Budget Utilization, Schedule Adherence, Safety Score, Resource Efficiency
- Compact height: p-4

### 5. Project Status Overview
**Visual:** Horizontal scrollable cards or 2-column grid
- Each project card shows: Thumbnail image, Project name, Progress percentage, Status badge, Quick action buttons
- Progress visualization: Linear bar with gradient fill
- Status badges: Pill-shaped with semantic colors (not specified now)
- Card size: Consistent aspect ratio, image at top

### 6. Action Bar
**Position:** Sticky bottom or floating bottom-right
- Circular FAB: "+" button for quick actions
- Expandable menu: New Project, Upload Document, Create Task, Invite Member
- Uses gradient accent for primary button

## Images

**Hero Image:**
- Placement: Right column of hero section, above the fold
- Description: Professional construction site photo - modern building under construction with crane visible, showing teamwork or progress. High-quality, aspirational but realistic. Should convey professionalism and modern construction practices.
- Treatment: rounded-2xl corners, subtle shadow (shadow-xl)
- Aspect ratio: 4:3 or 16:10
- No overlay needed - stands alone as complementary visual

**Project Thumbnails:**
- Size: Square or 16:9 thumbnails for each project card
- Description: Actual project site photos or architectural renderings
- Treatment: rounded-lg, object-cover

**General Image Strategy:** Use real construction photography to ground the platform in the industry. Images should show modern equipment, professional teams, and quality work environments.

## Navigation Structure

**Top Navigation Bar:**
- Logo left (with yellow-green gradient)
- Main nav center: Projects, Team, Schedule, Documents, Reports
- Right: Search, Notifications bell, User avatar dropdown
- Height: h-16, backdrop-blur for glass effect if needed

**Breadcrumbs:** Below nav for deeper pages (not on home)

## Animations & Interactions

**Minimal Motion:**
- Card hover: Subtle lift (translate-y-1) and shadow enhancement, no scale
- Button states: Standard opacity/brightness changes
- Loading states: Skeleton screens, no spinners
- Page transitions: None - instant

**Avoid:** Scroll animations, parallax, entrance animations, complex transitions

## Accessibility & Consistency

- Focus states: Ring with gradient accent color
- All interactive elements: min-height of h-10 (40px)
- Form inputs: Consistent h-12 height, rounded-lg, clear labels above fields
- Icon size: w-5 h-5 standard, w-6 h-6 for emphasis
- Semantic HTML throughout
- ARIA labels for all icon-only buttons

## Responsive Behavior

**Desktop (lg+):** Full multi-column layouts as specified
**Tablet (md):** 2-column grids, maintain card layouts
**Mobile (base):** Single column, stack all sections vertically, collapsible navigation drawer