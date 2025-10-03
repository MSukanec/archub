import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

type Props = { 
  vimeoId: string; 
  onProgress?: (sec: number, pct: number) => void 
};

export default function VimeoPlayer({ vimeoId, onProgress }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  
  // 1) Crear el player una sola vez (sin vimeoId en dependencias)
  useEffect(() => {
    if (!iframeRef.current) return;
    
    playerRef.current = new Player(iframeRef.current);
    const player = playerRef.current;

    // Configurar eventos básicos
    player.on("timeupdate", (e: any) => {
      onProgress?.(Math.floor(e.seconds), Math.round(e.percent * 100));
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
    
    console.log('🎬 Cambiando a video Vimeo ID:', vimeoId);
    
    playerRef.current.loadVideo(vimeoId)
      .then(() => {
        console.log('✅ Video cargado exitosamente:', vimeoId);
        // Aquí podrías cargar el progreso guardado si lo tienes:
        // const lastPosition = progressMap[currentLessonId]?.last_position_sec ?? 0;
        // if (lastPosition > 0) playerRef.current?.setCurrentTime(lastPosition);
      })
      .catch((error) => {
        console.error('❌ Error al cargar video Vimeo:', error);
      });
  }, [vimeoId]);

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
