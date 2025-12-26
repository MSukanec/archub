import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSiteLogs } from '../hooks/use-site-logs';
import * as getSiteLogsService from '../services/getSiteLogs';
vi.mock('../services/getSiteLogs', () => ({
  getSiteLogs: vi.fn()
}));
describe('useSiteLogs hook', () => {
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
  it('should fetch site logs successfully', async () => {
    const mockLogs = [
      { id: '1', log_date: '2025-11-17', comments: 'Test'}
    ];
    
    vi.spyOn(getSiteLogsService, 'getSiteLogs').mockResolvedValue(mockLogs);
    const { result } = renderHook(
      () => useSiteLogs('project-123', 'org-456'),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLogs);
  });
  it('should not fetch when projectId is undefined', () => {
    const { result } = renderHook(
      () => useSiteLogs(undefined, 'org-456'),
      { wrapper }
    );
    expect(result.current.isFetching).toBe(false);
  });
});
