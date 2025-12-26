import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

/**
 * Generic reusable map item interface
 * Consumers should extend this with their specific properties
 */
export interface MapItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
  logo?: string;
  [key: string]: any; // Allow additional properties per use case
}

interface InteractiveMapProps<T extends MapItem> {
  items: T[];
  isLoading: boolean;
  error?: Error | null;
  onItemClick?: (item: T) => void;
  renderPopup: (item: T) => React.ReactNode;
  height?: number;
  emptyMessage?: string;
}

function MapController({ items }: { items: MapItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (items.length > 0) {
      const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [items, map]);

  return null;
}

export function InteractiveMap<T extends MapItem>({
  items,
  isLoading,
  error,
  onItemClick,
  renderPopup,
  height = 600,
  emptyMessage = 'No hay elementos con ubicación disponibles'
}: InteractiveMapProps<T>) {
  const createCustomIcon = (color?: string, logoUrl?: string) => {
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2z"></path>
        </svg>`;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: 48px;
          height: 52px;
        ">
          <div style="
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-top: 24px solid var(--accent);
          "></div>
          <div style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background-color: ${logoUrl ? 'white' : (color || '#84cc16')};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          ">
            ${logoHtml}
          </div>
        </div>
      `,
      iconSize: [48, 52],
      iconAnchor: [24, 52],
      popupAnchor: [0, -52],
    });
  };

  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 40;
    let fontSize = '14px';
    
    if (count > 100) {
      size = 60;
      fontSize = '18px';
    } else if (count > 50) {
      size = 50;
      fontSize = '16px';
    }

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: ${fontSize};
          font-family: 'Inter', sans-serif;
        ">
          ${count}
        </div>
      `,
      className: 'custom-cluster-icon',
      iconSize: L.point(size, size),
    });
  };

  if (isLoading) {
    return (
      <div style={{ width: '100%', height: `${height}px` }} className="flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', height: `${height}px` }} className="flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-red-500">
          <p>Error al cargar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-[1000] pointer-events-none">
          <div className="text-center text-gray-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{emptyMessage}</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={[0, 0]}
        zoom={2}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {items.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={80}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {items.map((item) => (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={createCustomIcon(item.color, item.logo)}
                eventHandlers={{
                  click: () => onItemClick?.(item),
                }}
              >
                <Popup className="custom-popup" maxWidth={280}>
                  {renderPopup(item)}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {items.length > 0 && <MapController items={items} />}
      </MapContainer>
    </div>
  );
}
