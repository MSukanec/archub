import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteLogTypes } from '../services/getSiteLogTypes';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('getSiteLogTypes service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return site log types for valid organization', async () => {
    const mockTypes = [
      { id: '1', name: 'Bitácora General', is_default: true, organization_id: null },
      { id: '2', name: 'Visita de Inspección', is_default: false, organization_id: 'org-123' }
    ];
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTypes, error: null })
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getSiteLogTypes('org-123');

    expect(result).toEqual(mockTypes);
    expect(mockFrom).toHaveBeenCalledWith('site_log_types');
  });

  it('should return empty array when no types found', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getSiteLogTypes('org-123');
    expect(result).toEqual([]);
  });

  it('should throw error when Supabase query fails', async () => {
    const mockError = new Error('Database connection failed');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    await expect(getSiteLogTypes('org-123')).rejects.toThrow('Database connection failed');
  });

  it('should return empty array when organizationId is not provided', async () => {
    const result = await getSiteLogTypes('');
    expect(result).toEqual([]);
  });
});
