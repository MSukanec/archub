import type { Request, Response } from 'express';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';

export async function getHeroSections(req: Request, res: Response) {
  try {
    const sectionType = req.query.section_type as string || 'learning_dashboard';
    
    const result = await db.execute(sql`
      SELECT 
        hs.*,
        mf.file_url as media_url,
        mf.file_type as media_type
      FROM hero_sections hs
      LEFT JOIN media_links ml ON ml.hero_section_id = hs.id
      LEFT JOIN media_files mf ON mf.id = ml.media_file_id AND mf.is_deleted = false
      WHERE hs.section_type = ${sectionType} 
      AND hs.is_active = true
      ORDER BY hs.order_index ASC
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('[HeroSections] Error fetching hero sections:', error);
    res.status(500).json({ error: 'Failed to fetch hero sections' });
  }
}

export async function getAllHeroSections(req: Request, res: Response) {
  try {
    const sectionType = req.query.section_type as string || 'learning_dashboard';
    
    const result = await db.execute(sql`
      SELECT 
        hs.*,
        mf.file_url as media_url,
        mf.file_type as media_type
      FROM hero_sections hs
      LEFT JOIN media_links ml ON ml.hero_section_id = hs.id
      LEFT JOIN media_files mf ON mf.id = ml.media_file_id AND mf.is_deleted = false
      WHERE hs.section_type = ${sectionType}
      ORDER BY hs.order_index ASC
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('[HeroSections] Error fetching all hero sections:', error);
    res.status(500).json({ error: 'Failed to fetch hero sections' });
  }
}

export async function createHeroSection(req: Request, res: Response) {
  try {
    const { 
      section_type = 'learning_dashboard',
      title, 
      description, 
      primary_button_text,
      primary_button_action,
      primary_button_action_type = 'url',
      secondary_button_text,
      secondary_button_action,
      secondary_button_action_type = 'url',
      is_active = true
    } = req.body;

    const maxOrderResult = await db.execute(sql`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order 
      FROM hero_sections 
      WHERE section_type = ${section_type}
    `);
    const nextOrder = (maxOrderResult.rows[0] as any)?.next_order || 0;

    const result = await db.execute(sql`
      INSERT INTO hero_sections (
        section_type, order_index, title, description, 
        primary_button_text, primary_button_action, 
        primary_button_action_type, secondary_button_text, secondary_button_action,
        secondary_button_action_type, is_active
      ) VALUES (
        ${section_type}, ${nextOrder}, ${title}, ${description},
        ${primary_button_text}, ${primary_button_action},
        ${primary_button_action_type}, ${secondary_button_text}, ${secondary_button_action},
        ${secondary_button_action_type}, ${is_active}
      )
      RETURNING *
    `);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[HeroSections] Error creating hero section:', error);
    res.status(500).json({ error: 'Failed to create hero section' });
  }
}

export async function updateHeroSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      primary_button_text,
      primary_button_action,
      primary_button_action_type,
      secondary_button_text,
      secondary_button_action,
      secondary_button_action_type,
      is_active,
      order_index
    } = req.body;

    const result = await db.execute(sql`
      UPDATE hero_sections SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        primary_button_text = ${primary_button_text},
        primary_button_action = ${primary_button_action},
        primary_button_action_type = COALESCE(${primary_button_action_type}, primary_button_action_type),
        secondary_button_text = ${secondary_button_text},
        secondary_button_action = ${secondary_button_action},
        secondary_button_action_type = COALESCE(${secondary_button_action_type}, secondary_button_action_type),
        is_active = COALESCE(${is_active}, is_active),
        order_index = COALESCE(${order_index}, order_index),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hero section not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[HeroSections] Error updating hero section:', error);
    res.status(500).json({ error: 'Failed to update hero section' });
  }
}

export async function deleteHeroSection(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Soft delete associated media files
    await db.execute(sql`
      UPDATE media_files SET is_deleted = true, updated_at = now()
      WHERE id IN (
        SELECT media_file_id FROM media_links WHERE hero_section_id = ${id}
      )
    `);

    await db.execute(sql`DELETE FROM hero_sections WHERE id = ${id}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[HeroSections] Error deleting hero section:', error);
    res.status(500).json({ error: 'Failed to delete hero section' });
  }
}

export async function reorderHeroSections(req: Request, res: Response) {
  try {
    const { sections } = req.body;

    for (const section of sections) {
      await db.execute(sql`
        UPDATE hero_sections 
        SET order_index = ${section.order_index}, updated_at = now()
        WHERE id = ${section.id}
      `);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[HeroSections] Error reordering hero sections:', error);
    res.status(500).json({ error: 'Failed to reorder hero sections' });
  }
}
