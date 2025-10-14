import { supabase } from '@/lib/supabase';

interface AnnounceCourseParams {
  courseTitle: string;
  courseDescription?: string;
  courseUrl?: string;
}

interface AnnounceModuleParams {
  courseTitle: string;
  moduleTitle: string;
}

interface AnnounceCustomParams {
  title: string;
  message: string;
}

async function sendDiscordAnnouncement(body: any): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not initialized');
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('No active session');
      return false;
    }

    const response = await fetch('/api/discord/announce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Discord announcement failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord announcement:', error);
    return false;
  }
}

export async function announceCourse(params: AnnounceCourseParams): Promise<boolean> {
  return sendDiscordAnnouncement({
    type: 'course',
    courseTitle: params.courseTitle,
    courseDescription: params.courseDescription,
    courseUrl: params.courseUrl,
  });
}

export async function announceModule(params: AnnounceModuleParams): Promise<boolean> {
  return sendDiscordAnnouncement({
    type: 'module',
    courseTitle: params.courseTitle,
    moduleTitle: params.moduleTitle,
  });
}

export async function announceCustom(params: AnnounceCustomParams): Promise<boolean> {
  return sendDiscordAnnouncement({
    type: 'custom',
    title: params.title,
    message: params.message,
  });
}
