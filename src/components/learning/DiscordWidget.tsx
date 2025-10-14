import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SiDiscord } from 'react-icons/si';

const DISCORD_GUILD_ID = '868615664070443008';
const DISCORD_WIDGET_URL = `https://discord.com/widget?id=${DISCORD_GUILD_ID}&theme=dark`;

export function DiscordWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <SiDiscord className="h-5 w-5" style={{ color: '#5865F2' }} />
          Comunidad Discord
        </CardTitle>
        <CardDescription>
          Únete a la comunidad para compartir experiencias y resolver dudas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="px-6 pb-4">
          <iframe 
            src={DISCORD_WIDGET_URL}
            width="100%" 
            height="400" 
            style={{ 
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            title="Discord Server Widget"
          />
        </div>
      </CardContent>
    </Card>
  );
}
