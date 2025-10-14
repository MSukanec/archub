// Discord integration utilities

interface DiscordMessage {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
    timestamp?: string;
  }>;
}

export async function sendDiscordNotification(message: DiscordMessage): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured, skipping Discord notification');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

export function createCourseAnnouncementEmbed(courseTitle: string, courseDescription?: string, courseUrl?: string) {
  return {
    embeds: [{
      title: '🎓 Nuevo Curso Publicado',
      description: courseDescription || 'Un nuevo curso está disponible en la plataforma',
      color: 0x84cc16, // Lime green matching --accent
      fields: [
        {
          name: 'Curso',
          value: courseTitle,
          inline: false,
        },
        ...(courseUrl ? [{
          name: 'Enlace',
          value: courseUrl,
          inline: false,
        }] : []),
      ],
      footer: {
        text: 'Archub - Plataforma de Capacitación',
      },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function createModuleAnnouncementEmbed(courseTitle: string, moduleTitle: string) {
  return {
    embeds: [{
      title: '📚 Nuevo Módulo Disponible',
      description: `Se ha agregado un nuevo módulo al curso **${courseTitle}**`,
      color: 0x84cc16,
      fields: [
        {
          name: 'Módulo',
          value: moduleTitle,
          inline: false,
        },
      ],
      footer: {
        text: 'Archub - Plataforma de Capacitación',
      },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function createCustomAnnouncement(title: string, message: string) {
  return {
    embeds: [{
      title: title,
      description: message,
      color: 0x84cc16,
      footer: {
        text: 'Archub - Plataforma de Capacitación',
      },
      timestamp: new Date().toISOString(),
    }],
  };
}
