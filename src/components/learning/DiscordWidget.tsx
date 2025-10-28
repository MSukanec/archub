import { Button } from '@/components/ui/button';
import { SiDiscord } from 'react-icons/si';

const DISCORD_INVITE_URL = 'https://discord.com/channels/868615664070443008';

export function DiscordWidget() {
  return (
    <Button
      className="w-full h-full"
      onClick={() => window.open(DISCORD_INVITE_URL, '_blank')}
      data-testid="button-discord"
    >
      <SiDiscord className="h-5 w-5 mr-2" style={{ color: 'currentColor' }} />
      Unirse a Discord
    </Button>
  );
}
