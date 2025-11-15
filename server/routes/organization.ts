import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { handleGetOrganizationMembers } from '../controllers/organization/members.controller.js';
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

/**
 * Register organization-related endpoints (members, invitations, profile)
 */
export function registerOrganizationRoutes(app: Express, deps: RouteDeps): void {
  // ========== ORGANIZATION - MEMBERS ENDPOINTS ==========
  
  // GET /api/organization-members/:organizationId - Get all members of an organization
  app.get("/api/organization-members/:organizationId", handleGetOrganizationMembers);

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
