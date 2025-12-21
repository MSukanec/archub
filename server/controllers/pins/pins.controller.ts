import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase/admin';

interface SavePinBody {
  title: string;
  url: string;
  image: string;
}

export async function getPins(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('pins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Pins] Error fetching pins:', error);
      return res.status(500).json({ 
        error: error.message 
      });
    }

    return res.json(data || []);
  } catch (error: any) {
    console.error('[Pins] Unexpected error:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error' 
    });
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function setCorsHeaders(res: Response) {
  res.set(CORS_HEADERS);
}

export function savePinPreflight(req: Request, res: Response) {
  setCorsHeaders(res);
  return res.status(204).send();
}

export async function savePin(req: Request, res: Response) {
  setCorsHeaders(res);
  
  try {
    const body = req.body as SavePinBody;
    
    console.log('[Pins] Received payload:', {
      title: body.title,
      url: body.url,
      image: body.image?.substring(0, 100) + '...',
    });

    if (!body.title || !body.url || !body.image) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, url, image' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('pins')
      .insert({
        title: body.title,
        source_url: body.url,
        image_url: body.image,
      })
      .select()
      .single();

    if (error) {
      console.error('[Pins] Error inserting pin:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message 
      });
    }

    console.log('[Pins] Pin saved successfully:', data.id);
    return res.json({ ok: true, id: data.id });

  } catch (error: any) {
    console.error('[Pins] Unexpected error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Unknown error' 
    });
  }
}
