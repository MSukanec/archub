import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { Building2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProjectLocation {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  organizationLogo?: string;
  color: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
}

function MapController({ projects }: { projects: ProjectLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (projects.length > 0) {
      const bounds = L.latLngBounds(projects.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [projects, map]);

  return null;
}

export function InteractiveProjectsMap() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectLocation[]>({
    queryKey: ['/api/community/projects'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  const createCustomIcon = (color: string, logoUrl?: string) => {
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
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
            background-color: ${logoUrl ? 'white' : color};
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
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa de proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-red-500">
          <p>Error al cargar los proyectos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {projects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-[1000] pointer-events-none">
          <div className="text-center text-gray-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No hay proyectos con ubicación disponibles</p>
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
        
        {projects.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={80}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {projects.map((project) => (
              <Marker
                key={project.id}
                position={[project.lat, project.lng]}
                icon={createCustomIcon(project.color || '#84cc16', project.organizationLogo)}
              >
                <Popup className="custom-popup" maxWidth={250}>
                  <div className="p-2">
                    <h3 className="font-semibold text-base text-gray-900 mb-1">
                      {project.organizationName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {project.name}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {projects.length > 0 && <MapController projects={projects} />}
      </MapContainer>
    </div>
  );
}
