/**
 * Format contact name with fallback logic
 * Priority: company_name > full_name > first_name + last_name > 'Cliente'
 */
export function formatContactName(contact: {
  company_name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null | undefined): string {
  if (!contact) return 'Cliente';
  
  // Priority 1: Company name
  if (contact.company_name?.trim()) {
    return contact.company_name.trim();
  }
  
  // Priority 2: Full name
  if (contact.full_name?.trim()) {
    return contact.full_name.trim();
  }
  
  // Priority 3: First + Last name
  const firstName = contact.first_name?.trim() || '';
  const lastName = contact.last_name?.trim() || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  // Fallback
  return 'Cliente';
}
