import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

type Props = { 
  vimeoId: string;
  initialPosition?: number;
  onProgress?: (sec: number, pct: number) => void 
};

export default function VimeoPlayer({ vimeoId, initialPosition = 0, onProgress }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastLoadedVideoRef = useRef<string | null>(null);
  const lastAppliedPositionRef = useRef<number>(0);
  
  // 1) Crear el player una sola vez (sin vimeoId en dependencias)
  useEffect(() => {
    if (!iframeRef.current) return;
    
    playerRef.current = new Player(iframeRef.current);
    const player = playerRef.current;

    // Configurar eventos básicos
    player.on("timeupdate", (e: any) => {
      const currentSec = Math.floor(e.seconds);
      lastAppliedPositionRef.current = currentSec;
      onProgress?.(currentSec, Math.round(e.percent * 100));
    });
    
    player.on("pause", () => {
      player.getCurrentTime().then(sec => {
        player.getDuration().then(duration => {
          const pct = duration > 0 ? (sec / duration) * 100 : 0;
          onProgress?.(Math.floor(sec), Math.round(pct));
        });
      });
    });
    
    player.on("ended", () => onProgress?.(0, 100));

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, []); // Solo al montar/desmontar

  // 2) Cuando cambia vimeoId, cargar el nuevo video en la misma instancia
  useEffect(() => {
    if (!playerRef.current || !vimeoId) return;
    
    // Load video if it's a new ID
    if (lastLoadedVideoRef.current !== vimeoId) {
      console.log('🎬 Cambiando a video Vimeo ID:', vimeoId);
      
      playerRef.current.loadVideo(vimeoId)
        .then(async () => {
          console.log('✅ Video cargado exitosamente:', vimeoId);
          lastLoadedVideoRef.current = vimeoId;
          
          // Restore position on new video load
          if (initialPosition > 0) {
            await playerRef.current?.setCurrentTime(initialPosition);
            lastAppliedPositionRef.current = initialPosition;
            console.log('⏱️ Posición restaurada a:', initialPosition, 'segundos');
          }
        })
        .catch((error) => {
          console.error('❌ Error al cargar video Vimeo:', error);
        });
    }
    // If same video but position changed significantly, seek
    else if (initialPosition > 0 && Math.abs(initialPosition - lastAppliedPositionRef.current) > 2) {
      // Only seek if position changed by more than 2 seconds (avoid auto-save micro-seeks)
      playerRef.current.setCurrentTime(initialPosition)
        .then(() => {
          lastAppliedPositionRef.current = initialPosition;
          console.log('⏱️ Posición actualizada a:', initialPosition, 'segundos');
        })
        .catch((error) => {
          console.error('❌ Error al actualizar posición:', error);
        });
    }
  }, [vimeoId, initialPosition]);

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
