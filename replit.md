# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## CRITICAL RULES FOR AI AGENT
**⚠️ DATABASE ACCESS**: The AI agent does NOT have direct access to the database. Only the user can execute SQL in Supabase. When database changes are needed:
1. Generate the SQL statement
2. Ask the user to execute it in Supabase SQL Editor
3. NEVER attempt `db:push`, `execute_sql_tool`, or direct database connections - they will fail

**⚠️ getUserData FUNCTION**: The `getUserData` function in `server/lib/handlers/checkout/shared/user.ts` searches by `auth_id` (Supabase Auth UUID), NOT by `id` (internal table UUID). This is documented in `prompts/documentation/GET_USER_FUNCTION.md`.

**⚠️ PayPal vs MercadoPago Differences**:
- PayPal subscriptions use `custom_id` field which has no size limit - no auxiliary table needed
- MercadoPago Preapproval has 64-char limit on `external_reference` and NO metadata field - requires `mp_subscription_preferences` table for data lookup

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, reusable UI components using `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors and organic radial gradients.
- **Modal Architecture**: Enterprise SaaS-level modal system with stacking, dirty form blocking, size variants, portal rendering, and a registry pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system.
- **Layout Architecture**: Experience-based layouts (`src/layouts/`) including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages). **Header Actions documentation**: `prompts/documentation/layout/DashboardLayout.md` - use `actionButton` prop for single actions, `actions` array for multiple/complex actions.
- **Content Theming System**: Unified CSS theming layer with dynamic background switching via `useContentBackground` hook.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Wouter, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Supabase Auth (Email/password, Google OAuth).
- **Data Flow**: React Query for server state, Express.js for REST APIs, Drizzle ORM for database operations with cache invalidation.
- **Performance Optimizations**: Code-splitting, lazy loading, database views, smart caching, optimized backend endpoints.

### System Design Choices
- **Module Architecture**: Feature-Sliced Design for core modules (PROJECTS, SUBCONTRACTS, PERSONNEL, CLIENTS, FINANCES, LEARNING, MEDIA, SITELOG, etc.).
- **Multi-tenancy**: Services consistently filter data by `organization_id`.
- **Soft Delete**: Implemented for key entities.
- **Core Feature Management**: Comprehensive CRUD operations for Projects, Subcontracts, Personnel, Materials, Financial, Contacts, Sitelog, Project Types, and Project Modalities.
- **Learning Module**: Supports course management, video integration, progress tracking, notes, enrollment, pricing, and payment integration.
- **AI Assistant**: Clean frontend/backend separation, orchestrating context-aware GPT-4o powered responses.
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout, including production-ready PayPal course and subscription flows, Mercado Pago subscription flows, and bank transfer receipt uploads. PayPal subscriptions now support recurring billing via Billing Plans API (Nov 2025) with automatic renewal, stored in `plans.paypal_plan_monthly_id` / `paypal_plan_annual_id`, and tracked via `organization_subscriptions.provider_subscription_id`.
- **Proration System**: Fair upgrade pricing via `calculateProration()` in `server/lib/handlers/checkout/shared/proration.ts`. Calculates remaining value from current subscription as credit, applied to new plan price. **Currently only works with MercadoPago** - PayPal proration is temporarily disabled because PayPal billing plans only have a single REGULAR cycle (overriding the price affects all future renewals). To fix: rebuild PayPal plans with TRIAL + REGULAR cycles so only the first payment can be overridden. Frontend displays breakdown in checkout with note about PayPal limitation. Backend recalculates server-side for security. Endpoint: `POST /api/checkout/calculate-proration`.
- **MercadoPago Recurring Subscriptions**: Implemented via Preapproval API with dual-flow strategy:
  - **Recurring subscriptions** (auto-renewal) when MP plan IDs exist (stored in `plans.mp_plan_monthly_id`, `plans.mp_plan_annual_id`)
  - **Fallback to one-time payments** when plan IDs not yet synced
  - **Admin setup required**: Administrator must execute `POST /api/admin/mp/sync-plans` to create payment plans in MercadoPago and populate plan IDs in database. This is a one-time setup per plan.
  - **Auxiliary table**: `mp_subscription_preferences` stores subscription data (user_id, org_id, plan, billing_period) because MP's `external_reference` has 64-char limit and no metadata field
  - **Return handler**: `handleSubscriptionReturn.ts` processes user return from MP checkout with multiple fallback strategies to find subscription data
  - **Webhook handling**: Automatic renewal events processed via `subscription_preapproval` (user authorization) and `subscription_authorized_payment` (recurring charges) webhooks with idempotency checks.
  - **Implementation files**: `server/lib/handlers/checkout/mp/subscriptions-api.ts` (MP API wrapper), `createRecurringSubscription.ts` (recurring checkout flow), `handleSubscriptionReturn.ts` (return URL handler), `sync-plans.ts` (admin sync endpoint), `processWebhook.ts` (webhook handlers)
- **Subscription Modifications**: MercadoPago supports native updates via `PUT /preapproval/{id}` (implemented in `server/lib/handlers/checkout/mp/updateSubscription.ts`). Endpoint: `POST /api/checkout/mp/update-subscription`. PayPal does NOT support native updates - requires cancel + recreate strategy (pending). Documentation in `prompts/documentation/checkouts/Subscription_Modifications.md`.
- **Subscription Coupons**: Unified coupon system supporting both courses and subscriptions via `coupons.applies_to` field ('courses', 'subscriptions', 'all'). Plan-specific coupons use `coupon_plans` junction table. 100% discount coupons bypass payment gateways entirely, creating subscriptions directly. Currency-aware validation: MP flows validate in ARS, PayPal in USD. Per-user limits enforced via `coupon_redemptions` lookup. Documentation in `prompts/documentation/checkouts/SUBSCRIPTION_COUPONS.md`. Key files: `subscription-coupons.ts` (validation), `createRecurringSubscription.ts` (MP flow), `createSubscriptionOrder.ts` (PayPal flow), `SubscriptionCheckout.tsx` (frontend UI), `CouponFormModal.tsx` (admin UI).
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component for image and multi-file uploads using a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture, with client-side image compression and a 3-bucket storage architecture (public-assets, private-assets, social-assets).
- **Date Utilities (CRITICAL)**: All date handling MUST use `src/lib/date-utils.ts` to avoid timezone issues.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **Modal Naming Standard**: Modals follow `<Entity>Form.tsx` naming convention, stored in `forms/` folders, and support CREATE/EDIT/VIEW modes within a single component.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality, enabling zero-downtime deletion with data migration.
- **Universal Import System**: 5-step wizard with reusable hooks for parsing, auto-mapping, validation, and AI-powered suggestions (GPT-4o mini).
- **Subscription Expiry Notification System**: Scheduled daily job for multi-recipient email notifications before and on subscription expiry, with idempotency via `subscription_notifications_log` table.
- **Founders Program**: Annual subscribers (PRO/TEAMS) receive permanent founder status (`organizations.settings.is_founder`) and lifetime access to bonus course via `app_settings.founder_bonus_course_id`. Integrated into `upgradeOrganizationPlan` for both PayPal and MercadoPago flows. **Bonus Course Access Management**: 
  - **Org-level**: Enrollments are suspended (not deleted) when org downgrades to FREE via `suspendBonusCourseEnrollments()`, preserving progress data. Enrollments are reactivated via `reactivateBonusCourseEnrollments()` when org upgrades to paid plan. Implemented in `server/lib/handlers/checkout/shared/subscriptions.ts`.
  - **User-level**: When a member is removed from a founder org, their bonus course enrollment is suspended via `suspendUserBonusCourseEnrollment()`. When they rejoin (re-accept invitation), their enrollment is reactivated via `reactivateUserBonusCourseEnrollment()`. Implemented in `server/lib/handlers/checkout/shared/user-enrollments.ts`.
- **Member Removal Endpoint**: `DELETE /api/organizations/:orgId/members/:memberId` removes a member (soft delete) and suspends their bonus course enrollment. Only owners/admins can remove members. Implemented in `server/lib/handlers/organization/removeMember.ts`.
- **Soft-Lock System**: Plan limit enforcement via `is_over_limit` flags on `projects` and `organization_members`. Uses `applyPlanLimits()` function with intelligent ordering (oldest first, admins protected).
- **Automated Downgrade Execution**: Hourly cron job (`execute-scheduled-downgrades.ts`) processes two types of expired subscriptions: (1) active subscriptions with `scheduled_downgrade_plan_id` - executes the planned downgrade, (2) cancelled subscriptions without scheduled downgrade - moves to FREE plan. Both paths apply soft-lock limits and suspend bonus course enrollments when transitioning to FREE.
- **Downgrade Impact Calculation**: `DowngradeModal` fetches usage stats and calculates resources to be locked before user confirms downgrade.
- **Lab Neural Network Renderer System**: Extensible node rendering architecture for neural network graphs.

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
- **Mercado Pago**: Payment gateway.
- **PayPal**: Payment gateway.
- **Vimeo**: Video hosting and integration.
- **OpenAI**: GPT-4o for AI-powered features.
- **Google Maps Platform**: For location services and interactive maps.
- **yet-another-react-lightbox**: Unified media lightbox.
- **browser-image-compression**: Client-side image compression for optimized uploads.
- **@dnd-kit**: Modern drag-and-drop toolkit.
- **node-cron**: Scheduled tasks for automated notifications and maintenance.