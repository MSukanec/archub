# IdentityBadge Component

## Overview

`IdentityBadge` is a **universal, business-logic-agnostic identity component** for displaying people (users, contacts, partners, members, etc.) throughout the application.

It provides a consistent, professional representation of identity across all contexts following SaaS best practices (Notion, Linear, Slack style).

## Purpose

Standardize how identity is displayed by providing:
- **Single source of truth** for identity UI
- **Consistent behavior** across tables, modals, selects, and views
- **Automatic initials generation** with smart fallbacks
- **Flexible sizing and layouts** for different contexts
- **Professional appearance** with accessibility built-in

## Props

```typescript
interface IdentityBadgeProps {
  name: string | null | undefined;        // Required: Person's name
  avatarUrl?: string | null;               // Optional: Avatar image URL
  size?: 'xs' | 'sm' | 'md' | 'lg';       // Default: 'md'
  layout?: 'row' | 'column';               // Default: 'row'
  showName?: boolean;                      // Default: true
  subLabel?: string | null;                // Optional: Secondary text below name
  interactive?: boolean;                   // Default: false
  className?: string;                      // Optional: Additional CSS classes
}
```

### Prop Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string \| null | Required | The person's name. Used for initials generation. |
| `avatarUrl` | string \| null | undefined | Avatar image URL. If not provided, initials are shown. |
| `size` | 'xs' \| 'sm' \| 'md' \| 'lg' | 'md' | Avatar and text size variant. |
| `layout` | 'row' \| 'column' | 'row' | Avatar and text arrangement. Row: horizontal (default). Column: vertical. |
| `showName` | boolean | true | Whether to display the name text. |
| `subLabel` | string \| null | undefined | Optional secondary label (email, role, company, etc.). |
| `interactive` | boolean | false | Apply hover/pointer styles. Use when component is clickable. |
| `className` | string | undefined | Additional Tailwind classes. |

## Internal Logic

### Initials Generation

```typescript
// Examples
"John Doe"        → "JD"
"María García"    → "MG"
"João"            → "JO"
""                → "?"
null              → "?"
```

**Rules:**
- Two-word names: First letter of first + second word
- Single-word names: First two letters
- Empty or null: Fallback to "?"

### Avatar Fallback

```
1. If avatarUrl provided → Show image
2. Else if name exists   → Show initials
3. Else                  → Show "?"
```

### Sizing

- **xs**: Very small avatars (badges, inline mentions)
- **sm**: Small avatars (compact lists)
- **md**: Medium avatars (default, most use cases)
- **lg**: Large avatars (detail views, hero sections)

Text scales proportionally with avatar size.

## Visual Identification: Accent Border

⚠️ **TEMPORARY VISUAL MARKER**

The component includes a **visible accent-colored ring** around the avatar to help identify where the new component is already being used during migration.

```css
ring-2 ring-offset-0 ring-primary/60
```

**Why?** During the migration from ad-hoc implementations to this standardized component, visual markers help developers and designers quickly see:
- ✅ Which pages/sections already use `IdentityBadge`
- ❌ Which sections still need migration

### How to Remove the Border

Once migration is complete, remove the border by editing `src/components/shared/IdentityBadge.tsx`:

```typescript
// Line ~92 - Remove or comment out this line:
'ring-2 ring-offset-0 ring-primary/60'
```

Then in one search-replace across the codebase, remove references to the old ad-hoc identity implementations.

## Usage Examples

### Basic Usage

```tsx
import { IdentityBadge } from '@/components/shared/IdentityBadge';

<IdentityBadge name="John Doe" />
```

### With Avatar

```tsx
<IdentityBadge 
  name="John Doe" 
  avatarUrl="https://example.com/avatar.jpg"
/>
```

### Compact Size in Table

```tsx
<IdentityBadge 
  name={contact.full_name} 
  avatarUrl={contact.avatar_url}
  size="sm"
  interactive
/>
```

### In Select/Dropdown

```tsx
<IdentityBadge 
  name={contact.full_name} 
  subLabel={contact.email}
  size="sm"
/>
```

### Column Layout (Detail View)

```tsx
<IdentityBadge 
  name={partner.name} 
  avatarUrl={partner.avatar_url}
  size="lg"
  layout="column"
  subLabel={partner.company_name}
/>
```

### Avatar Only (in Accordion)

```tsx
<IdentityBadge 
  name={partner.name}
  showName={false}
  size="md"
/>
```

## Migration Strategy

### Phase 1: Identify Current Usage
- Tables showing user/contact/partner names
- Modals with identity displays
- Select/dropdown components
- Detail views and cards

### Phase 2: Replace One Context at a Time
- Don't refactor everything at once
- Replace sections methodically:
  1. Modal: "Add Partner" contact select
  2. Table: Partners List (PartnersListTab)
  3. Table: Partner Transactions
  4. Accordion: Partner Balances

### Phase 3: Verify Visual Consistency
- Check that identity displays look consistent
- Verify sizing is appropriate for context
- Ensure accessible alt text works correctly

### Phase 4: Remove Border & Cleanup
- Once all critical paths use `IdentityBadge`
- Remove the visible accent border
- Remove old ad-hoc implementations

## Accessibility

- ✅ Proper `alt` attributes on avatar images
- ✅ Semantic HTML structure
- ✅ Fallback text when images fail to load
- ✅ Color contrast compliant (follows theme)
- ✅ Works with screen readers

## Not Included (By Design)

❌ Role badges or permission indicators  
❌ Status indicators (online, offline)  
❌ Activity tracking  
❌ Context-specific actions  
❌ Edit/delete buttons

**Why?** These are business-context specific. Use this component as the **base identity display**, then add contextual elements around it.

## Example: Adding Context Around Identity

```tsx
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Badge } from '@/components/ui/badge';

function ContactCard({ contact }) {
  return (
    <div className="flex items-center justify-between">
      <IdentityBadge 
        name={contact.full_name}
        avatarUrl={contact.avatar_url}
        size="md"
      />
      {contact.role && (
        <Badge variant="secondary">{contact.role}</Badge>
      )}
    </div>
  );
}
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| No role/permission info | Business logic is context-specific. Keep component pure. |
| Automatic initials | Reduces data dependencies. Works offline or with incomplete data. |
| Visible accent border | Visual marker helps track migration progress without code changes. |
| Flexible layout | Accommodates different UI contexts without creating variants. |
| Size variants | Professional sizing hierarchy for different information densities. |

## Future Enhancements

Once baseline migration is complete, consider:

- [ ] Status indicator support (online/offline)
- [ ] Presence visualization
- [ ] Tooltip with additional info
- [ ] Context menu integration
- [ ] Loading skeleton variant
- [ ] Animated transitions
- [ ] Color customization per context

## Related Components

- `Avatar` - Low-level Radix UI avatar primitive
- Custom table cells - May use `IdentityBadge` internally
- Contact select fields - Uses `IdentityBadge` in options

## Troubleshooting

### Q: Avatar showing "?" instead of initials
**A:** The `name` prop is null, empty, or whitespace. Provide a valid name or pass `showName={false}` if name is optional.

### Q: Initials truncated or cut off
**A:** The component handles this automatically. If text looks wrong, check that parent container has adequate width.

### Q: How do I customize colors?
**A:** The component uses the theme's primary color for the accent border and text. To customize further, pass additional `className` props or override in theme.

### Q: Can I remove the accent border?
**A:** Yes! This is a temporary migration marker. See "How to Remove the Border" section above.

---

**Last Updated:** 2025-12-13  
**Status:** Active Migration  
**Locations Using IdentityBadge:** See implementation list below

### Implementation Tracking

Update this list as new locations adopt the component:

- ✅ `src/features/partners/forms/PartnerFormFields.tsx` - Contact select options
- ✅ `src/pages/partners/tabs/PartnersListTab.tsx` - Partners table
- ✅ `src/pages/partners/tabs/PartnerTransactionsTab.tsx` - Transactions table
- ✅ `src/pages/partners/tabs/PartnerBalancesTab.tsx` - Balance accordion
