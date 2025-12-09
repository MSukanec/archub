import type { Request, Response } from "express";
import { getAdminClient, extractToken } from "../../routes/_base.js";
import { requireUser, HttpError } from "../../lib/auth/helpers.js";
import { insertPdfTemplateSchema } from "@shared/schema";

/**
 * Verify that a user belongs to an organization
 * Returns true if valid, false otherwise
 * Uses the internal user_id (not auth_id)
 */
async function verifyOrganizationMembership(userId: string, organizationId: string): Promise<boolean> {
  const { data: member, error } = await getAdminClient()
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) {
    console.error('Error verifying organization membership:', error);
    return false;
  }
  
  return !!member;
}

/**
 * Get PDF template for an organization
 * GET /api/organizations/:organizationId/pdf-template
 */
export async function handleGetPdfTemplate(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const token = extractToken(req.headers.authorization);
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }
    
    // Get authenticated user with internal userId (mapped from auth_id)
    const { userId } = await requireUser(token);
    
    // Verify user belongs to organization
    const isMember = await verifyOrganizationMembership(userId, organizationId);
    if (!isMember) {
      return res.status(403).json({ error: "No tienes acceso a esta organización" });
    }
    
    // Get PDF template for organization
    const { data: template, error } = await getAdminClient()
      .from('pdf_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching PDF template:', error);
      return res.status(500).json({ error: "Failed to fetch PDF template" });
    }
    
    // Return template or null if not exists
    return res.json({ template });
  } catch (error: any) {
    console.error('Error in handleGetPdfTemplate:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

/**
 * Create PDF template for an organization
 * POST /api/organizations/:organizationId/pdf-template
 */
export async function handleCreatePdfTemplate(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const token = extractToken(req.headers.authorization);
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }
    
    // Get authenticated user with internal userId (mapped from auth_id)
    const { userId } = await requireUser(token);
    
    // Verify user belongs to organization (RLS handles permission checks)
    const isMember = await verifyOrganizationMembership(userId, organizationId);
    if (!isMember) {
      return res.status(403).json({ error: "No tienes acceso a esta organización" });
    }
    
    // Check if template already exists
    const { data: existingTemplate } = await getAdminClient()
      .from('pdf_templates')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (existingTemplate) {
      return res.status(400).json({ error: "PDF template already exists for this organization" });
    }
    
    // Validate request body with Zod schema
    const validationResult = insertPdfTemplateSchema.safeParse({
      ...req.body,
      organization_id: organizationId,
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid template data", 
        details: validationResult.error.flatten() 
      });
    }
    
    // Create new template with validated data
    const { data: template, error } = await getAdminClient()
      .from('pdf_templates')
      .insert(validationResult.data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating PDF template:', error);
      return res.status(500).json({ error: "Failed to create PDF template" });
    }
    
    return res.status(201).json({ template });
  } catch (error: any) {
    console.error('Error in handleCreatePdfTemplate:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

/**
 * Update PDF template for an organization
 * PATCH /api/organizations/:organizationId/pdf-template
 */
export async function handleUpdatePdfTemplate(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const token = extractToken(req.headers.authorization);
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }
    
    // Get authenticated user with internal userId (mapped from auth_id)
    const { userId } = await requireUser(token);
    
    // Verify user belongs to organization (RLS handles permission checks)
    const isMember = await verifyOrganizationMembership(userId, organizationId);
    if (!isMember) {
      return res.status(403).json({ error: "No tienes acceso a esta organización" });
    }
    
    // Reject empty payloads
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty" });
    }
    
    // Validate request body with Zod schema (partial for updates)
    const validationResult = insertPdfTemplateSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid template data", 
        details: validationResult.error.flatten() 
      });
    }
    
    // Check if template exists
    const { data: existingTemplate } = await getAdminClient()
      .from('pdf_templates')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (!existingTemplate) {
      // If template doesn't exist, create it first
      const createValidation = insertPdfTemplateSchema.safeParse({
        ...req.body,
        organization_id: organizationId,
      });
      
      if (!createValidation.success) {
        return res.status(400).json({ 
          error: "Invalid template data for creation", 
          details: createValidation.error.flatten() 
        });
      }
      
      const { data: newTemplate, error: createError } = await getAdminClient()
        .from('pdf_templates')
        .insert(createValidation.data)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating PDF template:', createError);
        return res.status(500).json({ error: "Failed to create PDF template" });
      }
      
      return res.json({ template: newTemplate });
    }
    
    // Update existing template with validated data
    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };
    
    // Remove fields that shouldn't be updated
    delete (updateData as any).id;
    delete (updateData as any).organization_id;
    delete (updateData as any).created_at;
    
    const { data: template, error } = await getAdminClient()
      .from('pdf_templates')
      .update(updateData)
      .eq('organization_id', organizationId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating PDF template:', error);
      return res.status(500).json({ error: "Failed to update PDF template" });
    }
    
    return res.json({ template });
  } catch (error: any) {
    console.error('Error in handleUpdatePdfTemplate:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
