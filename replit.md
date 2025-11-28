# Seencel - Construction Management Platform

## Overview
Seencel is a comprehensive construction management platform designed to optimize operations, enhance collaboration, and improve efficiency in the construction industry. It provides tools for project tracking, team management, budget monitoring, financial management with multi-currency support, robust document management, a detailed project dashboard with KPIs, and a learning module for professional development. Seencel aims to streamline workflows and provide a unified platform for all construction project needs, with a business vision to transform the construction industry through intelligent, integrated management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: "new-york" style with a neutral color palette, dark mode, reusable UI components using `shadcn/ui` and Tailwind CSS.
- **Typography System**: Unified Inter Variable Font with Apple-style optical letter-spacing.
- **Dynamic Color System**: Project-based color theming using `chroma-js` for intelligent color calculations, including dynamic accent colors and organic radial gradients.
- **Modal Architecture**: Enterprise SaaS-level modal system with stacking, dirty form blocking, size variants, portal rendering, and a registry pattern.
- **Navigation**: Redesigned sidebar with project selector, breadcrumb-style main header, and a centralized "general" hub with a two-level sidebar system.
- **Layout Architecture**: Experience-based layouts (`src/layouts/`) including Dashboard Layout (authenticated app) and Marketing Layout (public-facing pages).
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
- **Payment Architecture**: Unified `payments` table supporting multiple gateways and centralized checkout.
- **Access Control**: `PlanRestricted` component system for organization membership and subscription plans.
- **Cost System**: Three-tier cost system (Seencel Cost, Organization Cost, Independent Cost).
- **Media Uploads**: Unified component for image and multi-file uploads using a scalable `MEDIA_FILES` + `MEDIA_LINKS` architecture.
- **Unified Uploader Component**: `src/components/shared/Uploader.tsx` consolidates all file upload functionality:
  - `mode`: 'single' | 'multiple' for file count
  - `variant`: 'dropzone' (default) | 'hero' (project covers) | 'compact' (inline display)
  - `accept`: 'all' | 'images' | 'media' | 'documents' or custom Record
  - Supports `compressionPreset`, `compressOnDrop`, `maxSize`, `showLightbox`
  - Hero variant: Large image preview with drag-drop for project cover images
- **Image Compression System**: Client-side automatic image compression with predefined presets.
- **Date Utilities (CRITICAL)**: All date handling MUST use `src/lib/date-utils.ts` to avoid timezone issues:
  - `parseLocalDate(input)`: Convert database date strings to Date objects (prevents day shift)
  - `formatDateForDB(date)`: Convert Date objects to YYYY-MM-DD for database storage
  - `formatDate/formatDateShort/formatDateCompact`: Display dates to users
  - **NEVER use** `new Date("YYYY-MM-DD")` directly - it causes timezone shift issues!
- **3-Bucket Storage Architecture**: Organized file storage across three Supabase buckets (public-assets, private-assets, social-assets) with automatic routing and metadata persistence.
- **Public Media Access**: `is_public` flag in `media_links` for controlled public accessibility.
- **Project Selector Filtering**: Header project selector displays only `active` projects.
- **Project Activity Tracking**: `last_active_at` timestamp updated automatically via backend API.
- **HeroLayout Pattern**: Specialized `HeroLayout` component for pages with full-width hero sections.
- **Modal Naming Standard**: Modals follow `<Entity>Form.tsx` naming convention, stored in `forms/` folders, and support CREATE/EDIT/VIEW modes within a single component.
- **Delete/Replace Pattern**: Universal delete confirmation modal with optional replace functionality, enabling zero-downtime deletion with data migration.
- **Universal Import System**: 5-step wizard (Preview → Mapping → Validation → Conflicts → Summary) with reusable hooks for parsing, auto-mapping, validation, and AI-powered suggestions. Includes AI-Powered Column Mapping using OpenAI gpt-4o-mini and organizational memory.
- **Client Unit Migration**: Architecture change to one client per project, with unit information now commitment-specific (`unit_name`, `unit_description` in `client_commitments`).
- **Lab Neural Network Renderer System**: Extensible node rendering architecture for neural network graphs, including `SphereNodeRenderer` and `AvatarNodeRenderer` with type-specific styling and image caching.

## 🔒 PROTECTED PAYMENT FLOWS - DO NOT MODIFY

### PayPal Course Payment Flow (PRODUCTION-READY ✅)
**Status:** COMPLETE, TESTED, WITH COUPON SUPPORT - November 28, 2025

**Protected Files** - These files are LOCKED and handle PayPal course payments with coupon support. Do not modify without explicit review:
```
server/controllers/payments/paypal.controller.ts
server/lib/handlers/checkout/paypal/createCourseOrder.ts
server/lib/handlers/checkout/paypal/captureCourseOrder.ts
server/lib/handlers/checkout/shared/coupons.ts
server/lib/handlers/checkout/shared/payments.ts
server/lib/handlers/checkout/shared/enrollments.ts
server/lib/handlers/checkout/shared/events.ts
server/routes/payments.ts (POST /api/checkout/paypal/create-course, GET /api/checkout/paypal/capture-and-redirect)
src/features/learning/hooks/use-course-enrollment.ts
src/pages/learning/courses/CourseView.tsx (payment flow UI)
```

**Critical Rules:**
- ID Resolution: Frontend uses `auth_id`, backend must resolve to `users.id` for all DB operations
- Price from Database: Always fetch from `courses.price`, never trust client
- Coupon Redemption: Direct insert to `coupon_redemptions` (not RPC) using service role
- Payment Status: Automatically set to 'completed' when captured

**Full Documentation:** See `prompts/documentation/Payment_Course_Paypal.md`

**Future Payment Methods** - Create separate handlers, DO NOT reuse course payment files:
- Mercado Pago Courses → new handlers in `server/lib/handlers/checkout/mp/`
- PayPal Subscriptions → new handlers (subscription-specific, separate from courses)

### PayPal Subscription Payment Flow (PRODUCTION-READY ✅)
**Status:** COMPLETE, TESTED - November 28, 2025

**Protected Files:**
```
server/lib/handlers/checkout/paypal/createSubscriptionOrder.ts
server/lib/handlers/checkout/paypal/captureSubscriptionOrder.ts
server/lib/handlers/checkout/paypal/processWebhook.ts (subscription section)
server/lib/handlers/checkout/shared/subscriptions.ts
server/routes/payments.ts (POST /api/checkout/paypal/create-subscription, GET /api/checkout/paypal/capture-subscription)
```

**Critical Rules:**
- ID Resolution: `auth_id` in custom_id must be resolved to `users.id` before DB operations
- Guard clause: If user resolution fails, return early (webhook will retry)
- Idempotent: Use `paymentResult.inserted` check before upgradeOrganizationPlan
- Payment ID: Use `paymentResult.paymentId` (UUID) for organization_subscriptions and billing_cycles

**Full Documentation:** See `prompts/documentation/Payment_Subscription_PayPal.md`

### Mercado Pago Subscription Payment Flow (PRODUCTION-READY ✅)
**Status:** COMPLETE, TESTED - November 28, 2025

**Protected Files:**
```
server/lib/handlers/checkout/mp/createSubscriptionPreference.ts
server/lib/handlers/checkout/mp/processWebhook.ts (subscription section)
server/lib/handlers/checkout/shared/subscriptions.ts
server/routes/payments.ts (POST /api/checkout/mp/create-subscription, webhook handling)
```

**Critical Rules:**
- ID Resolution: metadata `user_id` is auth_id, must resolve to `users.id`
- ARS Conversion: Use exchange_rates table for USD→ARS conversion
- Duplicate Prevention: Check for existing active subscription before creating
- Idempotent: Same pattern as PayPal with `paymentResult.inserted` check

**Full Documentation:** See `prompts/documentation/Payment_Subscription_MercadoPago.md`

### Bank Transfer Receipt Upload Flow
**Status:** COMPLETE - November 28, 2025

**Architecture:**
- Entity type: `course_purchase_receipt`
- Storage: `private-assets/marketplace/receipts/{course_id}/{user_id}/{btp_id}{ext}`
- Database columns: `image_bucket` + `image_path` (NOT receipt_url)
- Uses adminClient (service role) for upload to private bucket
- Admin access via time-limited signed URLs (1 hour expiry)

**Key Files:**
```
server/routes/bank-transfer.ts (POST /api/bank-transfer/upload, GET /api/admin/bank-transfer/receipt/:btp_id)
src/lib/storage/types.ts (EntityType)
src/lib/storage/config.ts (course_purchase_receipt config)
src/pages/checkout/CheckoutPage.tsx (upload UI)
src/features/finances/modals/admin/BankTransferReceiptModal.tsx (admin view)
```

**Critical Rules:**
- Always use `adminClient` for uploads to private-assets bucket
- Store `image_bucket` and `image_path` separately (not combined URL)
- Generate signed URLs on-demand for admin viewing
- Compression preset: 'document' (for PDFs and scanned images)

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