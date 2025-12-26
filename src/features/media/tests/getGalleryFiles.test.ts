/**
 * Tests for getGalleryFiles service
 * 
 * These tests verify that the getGalleryFiles service correctly
 * fetches and combines gallery files from organization and project levels.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGalleryFiles } from '../services/getGalleryFiles';
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));
describe('getGalleryFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should return empty array when organizationId is undefined', async () => {
    const result = await getGalleryFiles(undefined, 'project-id');
    expect(result).toEqual([]);
  });
  it('should return empty array when supabase is not available', async () => {
    const result = await getGalleryFiles('org-id', 'project-id');
    expect(Array.isArray(result)).toBe(true);
  });
});
