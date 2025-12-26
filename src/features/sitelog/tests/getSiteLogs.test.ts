import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteLogs } from '../services/getSiteLogs';
import { supabase } from '@/lib/supabase';
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));
describe('getSiteLogs service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should return site logs with relations for valid project', async () => {
    const mockSiteLogs = [
      { id: '1', log_date: '2025-11-17', comments: 'Test log', creator: null }
    ];
    
    const mockFrom = vi.fn((table: string) => {
      if (table === 'site_logs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSiteLogs, error: null })
              })
            })
          })
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      };
    });
    
    (supabase.from as any) = mockFrom;
    const result = await getSiteLogs('project-123', 'org-456');
    expect(result).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('site_logs');
  });
  it('should return empty array when no logs found', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;
    const result = await getSiteLogs('project-123', 'org-456');
    expect(result).toEqual([]);
  });
  it('should throw error when Supabase query fails', async () => {
    const mockError = new Error('Database connection failed');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ 
              data: null, 
              error: mockError 
            })
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;
    await expect(getSiteLogs('project-123', 'org-456')).rejects.toThrow('Database connection failed');
  });
});
