import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

type Props = { 
  vimeoId: string; 
  onProgress?: (sec: number, pct: number) => void 
};

export default function VimeoPlayer({ vimeoId, onProgress }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    const player = new Player(iframeRef.current);

    // eventos básicos
    player.on("timeupdate", (e: any) => {
      // e.seconds, e.percent (0..1), e.duration
      onProgress?.(Math.floor(e.seconds), Math.round(e.percent * 100));
    });
    
    player.on("pause", () => {
      player.getCurrentTime().then(sec => {
        player.getPercent().then(pct => {
          onProgress?.(Math.floor(sec), Math.round(pct * 100));
        });
      });
    });
    
    player.on("ended", () => onProgress?.(0, 100));

    return () => {
      player.destroy();
    };
  }, [vimeoId, onProgress]);

  return (
    <iframe
      ref={iframeRef}
      src={`https://player.vimeo.com/video/${vimeoId}?autopause=1&muted=0`}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="w-full aspect-video rounded-xl"
      data-testid={`vimeo-player-${vimeoId}`}
    />
  );
}
