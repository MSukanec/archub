import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase/admin';
import { nanoid } from 'nanoid';
import dns from 'dns/promises';
import https from 'https';
import { extractToken, createAuthenticatedClient } from '../../lib/auth/helpers';

interface SavePinBody {
  title: string;
  source_url: string;
  image_url: string;
  project_id: string;
  board_id?: string;
}

interface GetPinsQuery {
  organization_id?: string;
  project_id?: string;
}

export async function getPins(req: Request, res: Response) {
  try {
    const { organization_id, project_id } = req.query as GetPinsQuery;

    let query = supabaseAdmin
      .from('pins')
      .select(`
        *,
        media_file:media_files(id, bucket, file_path, file_name, file_type)
      `)
      .order('created_at', { ascending: false });

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Pins] Error fetching pins:', error);
      return res.status(500).json({ 
        error: error.message 
      });
    }

    const pinsWithSignedUrls = await Promise.all(
      (data || []).map(async (pin: any) => {
        let signed_url: string | null = null;
        
        if (pin.media_file?.bucket && pin.media_file?.file_path) {
          const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from(pin.media_file.bucket)
            .createSignedUrl(pin.media_file.file_path, 3600);
          
          if (!signedError && signedData?.signedUrl) {
            signed_url = signedData.signedUrl;
          }
        } else if (pin.image_url) {
          signed_url = pin.image_url;
        }

        return {
          ...pin,
          signed_url,
          media_file: undefined,
        };
      })
    );

    return res.json(pinsWithSignedUrls);
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max
const DOWNLOAD_TIMEOUT = 30000; // 30 seconds
const MAX_REDIRECTS = 3;
const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
];

function isPrivateIPv4(a: number, b: number): boolean {
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIP(ip: string): boolean {
  const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();
  
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = cleanIp.match(ipv4Pattern);
  
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    return isPrivateIPv4(a, b);
  }
  
  const ipv4MappedPattern = /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i;
  const ipv4MappedMatch = cleanIp.match(ipv4MappedPattern);
  if (ipv4MappedMatch) {
    const [, a, b] = ipv4MappedMatch.map(Number);
    return isPrivateIPv4(a, b);
  }
  
  const ipv4MappedHexPattern = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i;
  const ipv4MappedHexMatch = cleanIp.match(ipv4MappedHexPattern);
  if (ipv4MappedHexMatch) {
    const high = parseInt(ipv4MappedHexMatch[1], 16);
    const low = parseInt(ipv4MappedHexMatch[2], 16);
    const a = (high >> 8) & 0xff;
    const b = high & 0xff;
    return isPrivateIPv4(a, b);
  }
  
  if (cleanIp === '::1') return true;
  if (cleanIp === '::') return true;
  if (cleanIp.startsWith('fe80:')) return true;
  if (cleanIp.startsWith('fc00:')) return true;
  if (cleanIp.startsWith('fd00:')) return true;
  if (cleanIp.startsWith('ff')) return true;
  if (cleanIp.startsWith('::ffff:')) return true;
  if (cleanIp.startsWith('64:ff9b::')) return true;
  if (cleanIp.startsWith('100::')) return true;
  if (cleanIp.startsWith('2001:db8:')) return true;
  if (cleanIp.startsWith('2001:0db8:')) return true;
  if (cleanIp.startsWith('2001:10:')) return true;
  if (cleanIp.startsWith('2001:20:')) return true;
  if (cleanIp.startsWith('0000:') || cleanIp.startsWith('0:')) return true;
  
  return false;
}

async function validateAndResolveUrl(imageUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = new URL(imageUrl);
    
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }
    
    if (BLOCKED_HOSTNAMES.includes(url.hostname.toLowerCase())) {
      return { valid: false, error: 'Blocked hostname' };
    }
    
    if (url.port && !['443', ''].includes(url.port)) {
      return { valid: false, error: 'Non-standard ports are not allowed' };
    }
    
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Pattern.test(url.hostname)) {
      if (isPrivateOrReservedIP(url.hostname)) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      return { valid: true };
    }
    
    try {
      const addresses = await dns.lookup(url.hostname, { all: true });
      
      for (const addr of addresses) {
        if (isPrivateOrReservedIP(addr.address)) {
          console.error('[Pins] DNS resolved to private IP:', url.hostname, '->', addr.address);
          return { valid: false, error: 'Domain resolves to private IP' };
        }
      }
    } catch (dnsError) {
      console.error('[Pins] DNS lookup failed:', dnsError);
      return { valid: false, error: 'DNS resolution failed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

function createSafeAgent(): https.Agent {
  return new https.Agent({
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { all: true })
        .then((addresses) => {
          for (const addr of addresses) {
            if (isPrivateOrReservedIP(addr.address)) {
              callback(new Error(`DNS resolved to private IP: ${addr.address}`), '', 4);
              return;
            }
          }
          const first = addresses[0];
          if (first) {
            callback(null, first.address, first.family);
          } else {
            callback(new Error('No addresses found'), '', 4);
          }
        })
        .catch((err) => {
          callback(err, '', 4);
        });
    },
    timeout: DOWNLOAD_TIMEOUT,
  });
}

function fetchWithSafeAgent(url: string, agent: https.Agent): Promise<{ statusCode: number; headers: Record<string, string | string[] | undefined>; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const req = https.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Host': parsedUrl.hostname,
      },
      timeout: DOWNLOAD_TIMEOUT,
    }, (res) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;
      
      res.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_IMAGE_SIZE) {
          req.destroy();
          reject(new Error('Response too large'));
          return;
        }
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers as Record<string, string | string[] | undefined>,
          buffer: Buffer.concat(chunks),
        });
      });
      
      res.on('error', reject);
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string; fileName: string } | null> {
  try {
    let currentUrl = imageUrl;
    let redirectCount = 0;
    const safeAgent = createSafeAgent();
    
    while (redirectCount <= MAX_REDIRECTS) {
      const validation = await validateAndResolveUrl(currentUrl);
      if (!validation.valid) {
        console.error('[Pins] URL validation failed:', validation.error, 'URL:', currentUrl);
        safeAgent.destroy();
        return null;
      }
      
      console.log('[Pins] Fetching image from:', currentUrl.substring(0, 100));
      
      try {
        const response = await fetchWithSafeAgent(currentUrl, safeAgent);
        
        if (response.statusCode >= 300 && response.statusCode < 400) {
          const location = response.headers['location'];
          const locationStr = Array.isArray(location) ? location[0] : location;
          if (!locationStr) {
            console.error('[Pins] Redirect without location header');
            safeAgent.destroy();
            return null;
          }
          
          currentUrl = new URL(locationStr, currentUrl).toString();
          redirectCount++;
          console.log('[Pins] Following redirect to:', currentUrl.substring(0, 100));
          continue;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          console.error('[Pins] Failed to download image:', response.statusCode);
          safeAgent.destroy();
          return null;
        }
        
        const contentTypeHeader = response.headers['content-type'];
        const contentType = (Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader) || 'image/jpeg';
        
        if (!contentType.startsWith('image/')) {
          console.error('[Pins] Not an image content type:', contentType);
          safeAgent.destroy();
          return null;
        }
        
        if (response.buffer.length > MAX_IMAGE_SIZE) {
          console.error('[Pins] Downloaded image too large:', response.buffer.length);
          safeAgent.destroy();
          return null;
        }

        const urlPath = new URL(imageUrl).pathname;
        let fileName = urlPath.split('/').pop() || `pin-${nanoid(8)}`;
        
        if (!fileName.includes('.')) {
          const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
          fileName = `${fileName}.${ext}`;
        }

        console.log('[Pins] Downloaded image:', { size: response.buffer.length, contentType, fileName });
        safeAgent.destroy();
        return { buffer: response.buffer, contentType, fileName };
      } catch (fetchError: any) {
        if (fetchError.message?.includes('private IP')) {
          console.error('[Pins] SSRF blocked - DNS rebinding attempt detected');
        } else {
          console.error('[Pins] Fetch error:', fetchError.message);
        }
        safeAgent.destroy();
        return null;
      }
    }
    
    console.error('[Pins] Too many redirects');
    safeAgent.destroy();
    return null;
  } catch (error: any) {
    console.error('[Pins] Error downloading image:', error);
    return null;
  }
}

function getFileType(mimeType: string): 'image' | 'video' | 'pdf' | 'doc' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
  return 'other';
}

export async function savePin(req: Request, res: Response) {
  setCorsHeaders(res);
  
  try {
    const body = req.body as SavePinBody;
    
    console.log('[Pins] Received payload:', {
      title: body.title,
      source_url: body.source_url,
      image_url: body.image_url?.substring(0, 100) + '...',
      project_id: body.project_id,
      board_id: body.board_id,
    });

    // === PASO 1: VALIDACIONES ===
    
    // 1.1 Verificar autenticación
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1.2 Obtener userId de la base de datos
    const { data: dbUser, error: dbUserError } = await authenticatedSupabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    const userId = dbUser.id;

    // 1.3 Obtener organización activa desde user_preferences
    const { data: userPrefs, error: prefsError } = await authenticatedSupabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs?.last_organization_id) {
      return res.status(400).json({ error: 'No active organization found' });
    }
    const organizationId = userPrefs.last_organization_id;

    // 1.4 Obtener organization_member_id
    const { data: member, error: memberError } = await authenticatedSupabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'User is not a member of the active organization' });
    }
    const organizationMemberId = member.id;

    // 1.5 Validar campos requeridos
    if (!body.title || !body.source_url || !body.image_url || !body.project_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, source_url, image_url, project_id' 
      });
    }

    // 1.6 Verificar que project_id pertenezca a la organización activa
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, organization_id')
      .eq('id', body.project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.organization_id !== organizationId) {
      return res.status(403).json({ error: 'Project does not belong to active organization' });
    }

    // === PASO 2: CREAR EL PIN ===
    
    let mediaFileId: string | null = null;

    // 2.1 Descargar imagen y subirla al storage
    const downloaded = await downloadImage(body.image_url);
    
    if (downloaded) {
      const uniqueFileName = `${nanoid(12)}-${downloaded.fileName}`;
      const storagePath = `organizations/${organizationId}/moodboard/pins/${uniqueFileName}`;

      console.log('[Pins] Uploading to storage:', storagePath);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('private-assets')
        .upload(storagePath, downloaded.buffer, {
          contentType: downloaded.contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Pins] Storage upload error:', uploadError);
      } else {
        const { data: mediaFile, error: mediaFileError } = await supabaseAdmin
          .from('media_files')
          .insert({
            bucket: 'private-assets',
            file_path: storagePath,
            file_name: downloaded.fileName,
            file_type: getFileType(downloaded.contentType),
            file_size: downloaded.buffer.length,
            is_public: false,
            is_deleted: false,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (mediaFileError) {
          console.error('[Pins] Error creating media_file:', mediaFileError);
          await supabaseAdmin.storage.from('private-assets').remove([storagePath]);
        } else {
          mediaFileId = mediaFile.id;
          console.log('[Pins] Created media_file:', mediaFileId);
        }
      }
    }

    // 2.2 Insertar el pin
    const { data: pin, error: pinError } = await supabaseAdmin
      .from('pins')
      .insert({
        title: body.title,
        source_url: body.source_url,
        image_url: mediaFileId ? null : body.image_url,
        organization_id: organizationId,
        project_id: body.project_id,
        media_file_id: mediaFileId,
      })
      .select()
      .single();

    if (pinError) {
      console.error('[Pins] Error inserting pin:', pinError);
      return res.status(500).json({ ok: false, error: pinError.message });
    }

    // 2.3 Crear media_link si tenemos mediaFileId
    if (mediaFileId) {
      const { error: linkError } = await supabaseAdmin
        .from('media_links')
        .insert({
          media_file_id: mediaFileId,
          organization_id: organizationId,
          project_id: body.project_id,
          pin_id: pin.id,
          category: 'inspiration_pin',
          visibility: 'organization',
          is_public: false,
        });

      if (linkError) {
        console.error('[Pins] Error creating media_link:', linkError);
      } else {
        console.log('[Pins] Created media_link for pin:', pin.id);
      }
    }

    // === PASO 3: RESOLVER EL BOARD ===
    
    let boardId: string;

    if (body.board_id) {
      // Caso A: Viene board_id - validar que exista, pertenezca al proyecto y a la organización
      const { data: board, error: boardError } = await supabaseAdmin
        .from('pin_boards')
        .select('id, organization_id, project_id')
        .eq('id', body.board_id)
        .single();

      if (boardError || !board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      if (board.organization_id !== organizationId || board.project_id !== body.project_id) {
        return res.status(403).json({ error: 'Board does not belong to the specified project' });
      }

      boardId = board.id;
    } else {
      // Caso B: No viene board_id - buscar o crear "Inspiración"
      const { data: existingBoard, error: searchError } = await supabaseAdmin
        .from('pin_boards')
        .select('id')
        .eq('project_id', body.project_id)
        .eq('name', 'Inspiración')
        .maybeSingle();

      if (searchError) {
        console.error('[Pins] Error searching for default board:', searchError);
        return res.status(500).json({ ok: false, error: 'Error searching for default board' });
      }

      if (existingBoard) {
        boardId = existingBoard.id;
        console.log('[Pins] Using existing "Inspiración" board:', boardId);
      } else {
        // Crear el board "Inspiración"
        const { data: newBoard, error: createBoardError } = await supabaseAdmin
          .from('pin_boards')
          .insert({
            organization_id: organizationId,
            project_id: body.project_id,
            name: 'Inspiración',
            description: null,
            created_by: organizationMemberId,
          })
          .select()
          .single();

        if (createBoardError || !newBoard) {
          console.error('[Pins] Error creating default board:', createBoardError);
          return res.status(500).json({ ok: false, error: 'Error creating default board' });
        }

        boardId = newBoard.id;
        console.log('[Pins] Created new "Inspiración" board:', boardId);
      }
    }

    // === PASO 4: ASOCIAR PIN AL BOARD ===
    
    const { error: itemError } = await supabaseAdmin
      .from('pin_board_items')
      .insert({
        pin_id: pin.id,
        board_id: boardId,
        position: null,
      });

    if (itemError) {
      console.error('[Pins] Error associating pin to board:', itemError);
      // No fallamos completamente, el pin ya está creado
    } else {
      console.log('[Pins] Pin associated to board:', { pin_id: pin.id, board_id: boardId });
    }

    console.log('[Pins] Pin saved successfully:', pin.id);
    return res.json({ 
      ok: true, 
      id: pin.id, 
      media_file_id: mediaFileId,
      board_id: boardId,
    });

  } catch (error: any) {
    console.error('[Pins] Unexpected error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Unknown error' 
    });
  }
}
