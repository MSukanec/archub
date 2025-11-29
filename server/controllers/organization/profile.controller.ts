import type { Request, Response } from 'express';
import { extractToken, requireUser, HttpError } from '../../lib/auth/helpers.js';

export async function handleGetUserProfile(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    // Fetch user profile data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Fetch user_data
    const { data: userData } = await supabase
      .from('user_data')
      .select('first_name, last_name, country, birthdate, phone_e164')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch user_preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('sidebar_docked, theme, layout')
      .eq('user_id', userId)
      .maybeSingle();

    // Combine all data
    const profile = {
      ...user,
      first_name: userData?.first_name || null,
      last_name: userData?.last_name || null,
      country: userData?.country || null,
      birthdate: userData?.birthdate || null,
      phone_e164: userData?.phone_e164 || null,
      sidebar_docked: preferences?.sidebar_docked ?? true,
      theme: preferences?.theme || 'system',
      layout: preferences?.layout || 'classic',
    };

    return res.status(200).json(profile);
  } catch (error: any) {
    console.error('Error in handleGetUserProfile:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
}

export async function handleUpdateUserProfile(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const {
      user_id,
      first_name,
      last_name,
      country,
      birthdate,
      avatar_url,
      phone_e164,
      sidebar_docked,
      theme,
      layout,
    } = req.body;

    // Validate that we're updating the correct user
    if (user_id && user_id !== userId) {
      return res.status(403).json({ error: 'Cannot update another user\'s profile' });
    }

    // Handle user_data updates
    let userDataUpdates: any = {};
    if (first_name !== undefined) userDataUpdates.first_name = first_name;
    if (last_name !== undefined) userDataUpdates.last_name = last_name;
    if (country !== undefined) userDataUpdates.country = country;
    if (birthdate !== undefined) userDataUpdates.birthdate = birthdate;
    if (phone_e164 !== undefined) userDataUpdates.phone_e164 = phone_e164;

    // Update user_data if there are changes
    if (Object.keys(userDataUpdates).length > 0) {
      const { data: existingUserData } = await supabase
        .from('user_data')
        .select('id')
        .eq('user_id', userId);

      if (existingUserData && existingUserData.length > 0) {
        const { error: updateError } = await supabase
          .from('user_data')
          .update(userDataUpdates)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating user_data:', updateError);
          return res.status(500).json({ error: updateError.message });
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_data')
          .insert({ user_id: userId, ...userDataUpdates });

        if (insertError) {
          console.error('Error inserting user_data:', insertError);
          return res.status(500).json({ error: insertError.message });
        }
      }
    }

    // Handle user_preferences updates
    let preferencesUpdates: any = {};
    if (sidebar_docked !== undefined) preferencesUpdates.sidebar_docked = sidebar_docked;
    if (theme !== undefined) preferencesUpdates.theme = theme;
    if (layout !== undefined) preferencesUpdates.layout = layout;

    if (Object.keys(preferencesUpdates).length > 0) {
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId);

      if (existingPrefs && existingPrefs.length > 0) {
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update(preferencesUpdates)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating user_preferences:', updateError);
          return res.status(500).json({ error: updateError.message });
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId, ...preferencesUpdates });

        if (insertError) {
          console.error('Error inserting user_preferences:', insertError);
          return res.status(500).json({ error: insertError.message });
        }
      }
    }

    // Update avatar_url in users table if provided
    if (avatar_url !== undefined) {
      const { error: avatarError } = await supabase
        .from('users')
        .update({ avatar_url })
        .eq('id', userId);

      if (avatarError) {
        console.error('Error updating avatar:', avatarError);
        return res.status(500).json({ error: avatarError.message });
      }
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Error in handleUpdateUserProfile:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to update user profile' });
  }
}
