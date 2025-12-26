import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeneralCosts } from '../hooks/use-general-costs';
import * as getGeneralCostsService from '../services/getGeneralCosts';

/**
 * Tests for useGeneralCosts hook
 * 
 * Validates that the hook correctly:
 * - Fetches general costs using React Query
 * - Handles undefined organizationId (enabled: false)
 * - Returns proper loading and success states
 */

// Mock del service
vi.mock('../services/getGeneralCosts', () => ({
  getGeneralCosts: vi.fn()
}));

describe('useGeneralCosts hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch general costs successfully', async () => {
    const mockCosts = [
      { 
        id: '1', 
        organization_id: 'org-456',
        name: 'Test Cost',
        description: 'Test description',
        created_at: '2025-11-17T10:00:00Z',
        updated_at: null
      }
    ];
    
    vi.spyOn(getGeneralCostsService, 'getGeneralCosts').mockResolvedValue(mockCosts);

    const { result } = renderHook(
      () => useGeneralCosts('org-456'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCosts);
  });

  it('should not fetch when organizationId is undefined', () => {
    const { result } = renderHook(
      () => useGeneralCosts(null),
      { wrapper }
    );

    expect(result.current.isFetching).toBe(false);
  });
});
