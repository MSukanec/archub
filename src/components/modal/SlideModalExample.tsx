import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Camera, Users, Cloud } from 'lucide-react';
import SlideModal from './SlideModal';
import { useSlideNavigation } from './useSlideNavigation';

// Vista principal del resumen
function ResumenBitacora() {
  const { navigateTo } = useSlideNavigation();
  
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Bitácora del Día</h3>
        <p className="text-sm text-muted-foreground">
          Registra los eventos y actividades del proyecto
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => navigateTo('clima')}
        >
          <Cloud className="h-6 w-6" />
          <span className="text-sm">Clima</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => navigateTo('equipo')}
        >
          <Users className="h-6 w-6" />
          <span className="text-sm">Personal</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => navigateTo('fotos')}
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Fotos</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => navigateTo('eventos')}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-sm">Eventos</span>
        </Button>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="notas">Notas generales</Label>
        <Textarea 
          id="notas"
          placeholder="Describe las actividades del día..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}

// Vista del formulario de clima
function FormularioClima() {
  const { navigateTo } = useSlideNavigation();
  
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Condiciones Climáticas</h3>
        <p className="text-sm text-muted-foreground">
          Registra el estado del tiempo durante el día
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="temperatura">Temperatura (°C)</Label>
          <Input 
            id="temperatura"
            type="number"
            placeholder="25"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="humedad">Humedad (%)</Label>
          <Input 
            id="humedad"
            type="number"
            placeholder="60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="viento">Velocidad del viento (km/h)</Label>
          <Input 
            id="viento"
            type="number"
            placeholder="15"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condiciones">Condiciones</Label>
          <select className="w-full p-2 border rounded-md" id="condiciones">
            <option value="">Seleccionar...</option>
            <option value="soleado">Soleado</option>
            <option value="nublado">Nublado</option>
            <option value="lluvioso">Lluvioso</option>
            <option value="tormentoso">Tormentoso</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea 
            id="observaciones"
            placeholder="Detalles adicionales sobre el clima..."
            className="min-h-[80px]"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigateTo('main')}
        >
          Volver
        </Button>
        <Button 
          className="flex-1"
          onClick={() => navigateTo('equipo')}
        >
          Siguiente: Personal
        </Button>
      </div>
    </div>
  );
}

// Vista del formulario de equipo/personal
function FormularioEquipo() {
  const { navigateTo } = useSlideNavigation();
  
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Personal en Obra</h3>
        <p className="text-sm text-muted-foreground">
          Registra el personal que trabajó hoy
        </p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nuevo miembro</CardTitle>
          <CardDescription className="text-sm">
            Agrega personal a la bitácora del día
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input 
              id="nombre"
              placeholder="Juan Pérez"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo/Función</Label>
            <select className="w-full p-2 border rounded-md" id="cargo">
              <option value="">Seleccionar...</option>
              <option value="maestro">Maestro de obra</option>
              <option value="oficial">Oficial</option>
              <option value="ayudante">Ayudante</option>
              <option value="ingeniero">Ingeniero</option>
              <option value="arquitecto">Arquitecto</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="horas">Horas trabajadas</Label>
            <Input 
              id="horas"
              type="number"
              placeholder="8"
              min="1"
              max="24"
            />
          </div>
          
          <Button className="w-full">
            + Agregar Personal
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigateTo('clima')}
        >
          Anterior: Clima
        </Button>
        <Button 
          className="flex-1"
          onClick={() => navigateTo('fotos')}
        >
          Siguiente: Fotos
        </Button>
      </div>
    </div>
  );
}

// Vista del formulario de fotos
function FormularioFotos() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Galería del Día</h3>
        <p className="text-sm text-muted-foreground">
          Sube fotos del progreso y actividades
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-4">
          Arrastra imágenes aquí o haz clic para seleccionar
        </p>
        <Button variant="outline">
          Seleccionar Archivos
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="descripcion-fotos">Descripción de las fotos</Label>
        <Textarea 
          id="descripcion-fotos"
          placeholder="Describe qué muestran las fotos..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

// Vista de eventos
function FormularioEventos() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Eventos del Día</h3>
        <p className="text-sm text-muted-foreground">
          Registra eventos importantes o incidencias
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipo-evento">Tipo de evento</Label>
          <select className="w-full p-2 border rounded-md" id="tipo-evento">
            <option value="">Seleccionar...</option>
            <option value="inicio-actividad">Inicio de actividad</option>
            <option value="finalizacion">Finalización</option>
            <option value="incidencia">Incidencia</option>
            <option value="entrega-material">Entrega de material</option>
            <option value="visita">Visita</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hora-evento">Hora del evento</Label>
          <Input 
            id="hora-evento"
            type="time"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descripcion-evento">Descripción del evento</Label>
          <Textarea 
            id="descripcion-evento"
            placeholder="Describe el evento en detalle..."
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}

// Componente principal del ejemplo
export default function SlideModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSaveAll = () => {
    alert('Guardando toda la información de la bitácora...');
    setIsOpen(false);
  };
  
  const views = {
    main: <ResumenBitacora />,
    clima: <FormularioClima />,
    equipo: <FormularioEquipo />,
    fotos: <FormularioFotos />,
    eventos: <FormularioEventos />
  };
  
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold">SlideModal Example</h1>
        <p className="text-muted-foreground">
          Ejemplo de modal con múltiples vistas y navegación animada
        </p>
        <Button onClick={() => setIsOpen(true)}>
          Abrir Bitácora
        </Button>
      </div>
      
      <SlideModal
        isOpen={isOpen}
        title="Bitácora del Día"
        initialView="main"
        views={views}
        onClose={() => setIsOpen(false)}
        onSaveAll={handleSaveAll}
      />
    </div>
  );
}