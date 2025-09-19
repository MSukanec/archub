/**
 * Generate organization avatar initials
 * 
 * Rules:
 * - Two words: first letter of each word ("Acme Corp" → "AC")
 * - One word: first two letters ("Acme" → "AC")  
 * - Empty/whitespace: "OR" (ORganization)
 * - Normalize: trim, uppercase, collapse whitespace
 * - Handle hyphenated names properly
 * 
 * @param name - Organization name
 * @returns Two uppercase letters for avatar initials
 */
export function getOrganizationInitials(name: string): string {
  // Handle empty, null, undefined, or whitespace-only strings
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'OR';
  }

  // Normalize: trim and collapse multiple spaces into single spaces
  const normalized = name.trim().replace(/\s+/g, ' ');
  
  // Split by spaces to get words
  const words = normalized.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'OR';
  }
  
  if (words.length === 1) {
    // Single word: take first two letters
    const word = words[0];
    
    // Handle hyphenated names like "Acme-Corp" - treat as two words
    if (word.includes('-')) {
      const hyphenatedParts = word.split('-').filter(part => part.length > 0);
      if (hyphenatedParts.length >= 2) {
        return (hyphenatedParts[0][0] + hyphenatedParts[1][0]).toUpperCase();
      }
    }
    
    // Regular single word - take first two characters
    if (word.length === 1) {
      return (word[0] + word[0]).toUpperCase(); // "A" → "AA"
    }
    
    return word.slice(0, 2).toUpperCase();
  }
  
  // Multiple words: take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}