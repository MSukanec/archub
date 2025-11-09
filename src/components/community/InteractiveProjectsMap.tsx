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
  });

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
        ">
          <div style="
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 16px solid transparent;
            border-right: 16px solid transparent;
            border-top: 20px solid ${color};
          "></div>
          <div style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 24px;
            background-color: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
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
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
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

  if (projects.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-gray-600">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No hay proyectos con ubicación disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 shadow-lg">
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
              icon={createCustomIcon(project.color || '#84cc16')}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <Card className="border-0 shadow-none p-0">
                  <div className="space-y-3">
                    {project.imageUrl && (
                      <div className="w-full h-32 bg-gray-200 rounded-md overflow-hidden">
                        <img 
                          src={project.imageUrl} 
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {project.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building2 className="h-4 w-4" />
                        <span>{project.organizationName}</span>
                      </div>
                      
                      {(project.address || project.city || project.country) && (
                        <div className="flex items-start gap-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            {project.address && <div>{project.address}</div>}
                            <div>
                              {[project.city, project.state, project.country]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <MapController projects={projects} />
      </MapContainer>
    </div>
  );
}
