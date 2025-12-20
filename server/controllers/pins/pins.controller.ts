import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase/admin';

interface SavePinBody {
  title: string;
  url: string;
  image: string;
}

export async function savePin(req: Request, res: Response) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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
