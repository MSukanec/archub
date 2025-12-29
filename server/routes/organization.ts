import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { handleGetOrganizationMembers, handleRemoveMember, handleLeaveOrganization } from '../controllers/organization/members.controller.js';
import {
  handleGetPendingInvitations,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleInviteMember
} from '../controllers/organization/invitations.controller.js';
import {
  handleGetUserProfile,
  handleUpdateUserProfile
} from '../controllers/organization/profile.controller.js';
import { handleGetOrganizationClientsSummary } from '../controllers/organization/clients.controller.js';
import { 
  handleListOrganizationClientPayments,
  handleGetOrganizationClientPaymentsMetrics
} from '../controllers/organization/clientPayments.controller.js';
import { handleGetOrganizationUsageStats } from '../lib/handlers/organization/getOrganizationUsageStats.js';
import { handleGetOrganizationRoles } from '../controllers/organization/roles.controller.js';
import { 
  handleGetRolesWithPermissions, 
  handleUpdateRolePermissions 
} from '../controllers/organization/permissions.controller.js';
import { handleCreateOrganization } from '../controllers/organization/create.controller.js';

/**
 * Register organization-related endpoints (members, invitations, profile, clients)
 */
export function registerOrganizationRoutes(app: Express, deps: RouteDeps): void {
  // ========== ORGANIZATION - CREATE ENDPOINTS ==========
  
  // POST /api/organizations - Create a new organization (admin only)
  app.post("/api/organizations", handleCreateOrganization);

  // ========== ORGANIZATION - ROLES ENDPOINTS ==========
  
  // GET /api/roles - Get roles for an organization (query param: organizationId)
  app.get("/api/roles", handleGetOrganizationRoles);

  // ========== ORGANIZATION - PERMISSIONS ENDPOINTS ==========
  
  // GET /api/organizations/:organizationId/roles-permissions - Get roles with their permissions
  app.get("/api/organizations/:organizationId/roles-permissions", handleGetRolesWithPermissions);
  
  // PUT /api/roles/:roleId/permissions - Update permissions for a role
  app.put("/api/roles/:roleId/permissions", handleUpdateRolePermissions);

  // ========== ORGANIZATION - MEMBERS ENDPOINTS ==========
  
  // GET /api/organization-members/:organizationId - Get all members of an organization
  app.get("/api/organization-members/:organizationId", handleGetOrganizationMembers);
  
  // DELETE /api/organizations/:organizationId/members/:memberId - Remove a member from an organization
  app.delete("/api/organizations/:organizationId/members/:memberId", handleRemoveMember);
  
  // POST /api/organizations/:organizationId/leave - Leave an organization (voluntary)
  app.post("/api/organizations/:organizationId/leave", handleLeaveOrganization);

  // ========== ORGANIZATION - USAGE STATS ENDPOINTS ==========
  
  // GET /api/organizations/:organizationId/usage-stats - Get usage stats for downgrade impact calculation
  app.get("/api/organizations/:organizationId/usage-stats", handleGetOrganizationUsageStats);

  // ========== ORGANIZATION - CLIENTS ENDPOINTS ==========
  
  // GET /api/organizations/:organizationId/clients/summary - Get all clients for an organization
  app.get("/api/organizations/:organizationId/clients/summary", handleGetOrganizationClientsSummary);

  // ========== ORGANIZATION - CLIENT PAYMENTS ENDPOINTS ==========
  
  // GET /api/organizations/:organizationId/client-payments/metrics - Get payment metrics (KPIs) for an organization
  app.get("/api/organizations/:organizationId/client-payments/metrics", handleGetOrganizationClientPaymentsMetrics);

  // GET /api/organizations/:organizationId/client-payments - Get all client payments for an organization
  app.get("/api/organizations/:organizationId/client-payments", handleListOrganizationClientPayments);

  // ========== ORGANIZATION - INVITATIONS ENDPOINTS ==========
  
  // GET /api/pending-invitations/:userId - Get pending invitations for a user
  app.get("/api/pending-invitations/:userId", handleGetPendingInvitations);
  
  // POST /api/accept-invitation - Accept an organization invitation
  app.post("/api/accept-invitation", handleAcceptInvitation);
  
  // POST /api/reject-invitation - Reject an organization invitation
  app.post("/api/reject-invitation", handleRejectInvitation);
  
  // POST /api/invite-member - Invite a new member to an organization
  app.post("/api/invite-member", handleInviteMember);

  // ========== USER - PROFILE ENDPOINTS ==========
  
  // GET /api/user/profile - Get current user's profile
  app.get("/api/user/profile", handleGetUserProfile);
  
  // PATCH /api/user/profile - Update current user's profile
  app.patch("/api/user/profile", handleUpdateUserProfile);
}
