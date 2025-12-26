/**
 * Tests for useGalleryFiles hook
 * 
 * These tests verify that the hook correctly integrates with React Query
 * and uses the getGalleryFiles service.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGalleryFiles } from '../hooks/use-gallery-files';

// Mock the service
vi.mock('../services/getGalleryFiles', () => ({
  getGalleryFiles: vi.fn(() => Promise.resolve([]))
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGalleryFiles', () => {
  it('should not fetch when organizationId is undefined', () => {
    const { result } = renderHook(
      () => useGalleryFiles(undefined, 'project-id'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch when organizationId is provided', async () => {
    const { result } = renderHook(
      () => useGalleryFiles('org-id', 'project-id'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
