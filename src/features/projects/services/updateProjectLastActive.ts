import { apiRequest } from '@/lib/queryClient';
import type { Project } from '../types';

/**
 * Updates the last_active_at timestamp for a project.
 * Called when a user selects or interacts with a project.
 * 
 * @param projectId - ID of the project
 * @param organizationId - Organization ID for authorization
 * @returns Updated project object
 * @throws {Error} If update fails
 */
export async function updateProjectLastActive(
  projectId: string,
  organizationId: string
): Promise<Project> {
  if (!projectId || !organizationId) {
    throw new Error('Project ID and Organization ID are required');
  }

  const response = await apiRequest('PUT', `/api/projects/${projectId}/last-active`, {
    organization_id: organizationId,
  });

  if (response.ok) {
    const project = await response.json();
    return project;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to update project last_active_at');
}
