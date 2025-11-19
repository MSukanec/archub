import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGeneralCosts } from '../services/getGeneralCosts';
import { supabase } from '@/lib/supabase';

/**
 * Tests for getGeneralCosts service
 * 
 * Validates that the service correctly:
 * - Fetches general costs from Supabase
 * - Returns empty array when no data found
 * - Throws errors when queries fail
 */

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('getGeneralCosts service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return general costs for valid organization', async () => {
    const mockGeneralCosts = [
      { 
        id: '1', 
        organization_id: 'org-456', 
        name: 'Test Cost',
        description: 'Test description',
        created_at: '2025-11-17T10:00:00Z',
        updated_at: null
      }
    ];
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockGeneralCosts, 
            error: null 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getGeneralCosts('org-456');

    expect(result).toBeDefined();
    expect(result).toEqual(mockGeneralCosts);
    expect(mockFrom).toHaveBeenCalledWith('general_costs');
  });

  it('should return empty array when no data found', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [], 
            error: null 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getGeneralCosts('org-456');
    expect(result).toEqual([]);
  });

  it('should throw error when Supabase query fails', async () => {
    const mockError = new Error('Database connection failed');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: mockError 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    await expect(getGeneralCosts('org-456'))
      .rejects.toThrow('Database connection failed');
  });
});
