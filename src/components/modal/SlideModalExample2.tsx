import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Camera, Users, Cloud } from 'lucide-react';
import { SlideModal, SlideModalHeader, SlideModalBody, SlideModalFooter, SlideModalSectionBlock, useSlideNavigation } from './index';

// Vista principal del resumen usando nuevos componentes
function ResumenBitacora() {
  const { navigateTo } = useSlideNavigation();
  
  return (
    <>
      <SlideModalHeader 
        title="Bitácora del Día"
        showBack={false}
        onClose={() => {}} // Se maneja desde el SlideModal principal
      />
      
      <SlideModalBody>
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Registra los eventos y actividades del proyecto
            </p>
          </div>
          
          {/* Sección de Clima */}
          <SlideModalSectionBlock 
            title="Condiciones Climáticas" 
            onAdd={() => navigateTo('clima')}
            addLabel="Registrar"
            icon={<Cloud className="h-4 w-4" />}
            hideIfEmpty={true}
            isEmpty={true}
          >
            <p className="text-xs text-muted-foreground">No hay datos de clima registrados</p>
          </SlideModalSectionBlock>
          
          {/* Sección de Personal */}
          <SlideModalSectionBlock 
            title="Personal en Obra" 
            onAdd={() => navigateTo('equipo')}
            addLabel="Añadir"
            icon={<Users className="h-4 w-4" />}
          >
            <div className="flex gap-2 flex-wrap">
              <div className="px-2 py-1 bg-[var(--muted)] rounded text-xs">Juan Pérez - Maestro</div>
              <div className="px-2 py-1 bg-[var(--muted)] rounded text-xs">Ana García - Oficial</div>
            </div>
          </SlideModalSectionBlock>
          
          {/* Sección de Fotos */}
          <SlideModalSectionBlock 
            title="Galería del Día" 
            onAdd={() => navigateTo('fotos')}
            addLabel="Subir"
            icon={<Camera className="h-4 w-4" />}
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square bg-[var(--muted)] rounded flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="aspect-square bg-[var(--muted)] rounded flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="aspect-square bg-[var(--muted)] rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+3</span>
              </div>
            </div>
          </SlideModalSectionBlock>
          
          {/* Sección de Eventos */}
          <SlideModalSectionBlock 
            title="Eventos del Día" 
            onAdd={() => navigateTo('eventos')}
            addLabel="Crear"
            icon={<Calendar className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <div className="text-xs p-2 bg-[var(--muted)] rounded">
                <div className="font-medium">08:00 - Inicio de jornada</div>
                <div className="text-muted-foreground">Llegada del equipo principal</div>
              </div>
              <div className="text-xs p-2 bg-[var(--muted)] rounded">
                <div className="font-medium">14:30 - Entrega de materiales</div>
                <div className="text-muted-foreground">Cemento y hierro para columnas</div>
              </div>
            </div>
          </SlideModalSectionBlock>
          
          <div className="space-y-3">
            <Label htmlFor="notas">Notas generales</Label>
            <Textarea 
              id="notas"
              placeholder="Describe las actividades del día..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </SlideModalBody>
      
      <SlideModalFooter>
        <Button variant="outline" className="flex-1">
          Guardar Borrador
        </Button>
        <Button className="flex-1">
          Finalizar Día
        </Button>
      </SlideModalFooter>
    </>
  );
}

// Vista del formulario de clima usando nuevos componentes
function FormularioClima() {
  const { navigateTo, goBack } = useSlideNavigation();
  
  return (
    <>
      <SlideModalHeader 
        title="Condiciones Climáticas"
        showBack={true}
        onBack={goBack}
      />
      
      <SlideModalBody>
        <div className="space-y-4">
          <div className="text-center space-y-2">
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
        </div>
      </SlideModalBody>
      
      <SlideModalFooter>
        <Button 
          variant="outline" 
          onClick={() => navigateTo('main')}
        >
          Volver
        </Button>
        <Button 
          onClick={() => navigateTo('equipo')}
        >
          Siguiente: Personal
        </Button>
      </SlideModalFooter>
    </>
  );
}

// Vista del formulario de equipo/personal usando nuevos componentes
function FormularioEquipo() {
  const { navigateTo, goBack } = useSlideNavigation();
  
  return (
    <>
      <SlideModalHeader 
        title="Personal en Obra"
        showBack={true}
        onBack={goBack}
      />
      
      <SlideModalBody>
        <div className="space-y-4">
          <div className="text-center space-y-2">
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
        </div>
      </SlideModalBody>
      
      <SlideModalFooter>
        <Button 
          variant="outline" 
          onClick={() => navigateTo('clima')}
        >
          Anterior: Clima
        </Button>
        <Button 
          onClick={() => navigateTo('fotos')}
        >
          Siguiente: Fotos
        </Button>
      </SlideModalFooter>
    </>
  );
}

// Vista del formulario de fotos usando nuevos componentes
function FormularioFotos() {
  const { goBack } = useSlideNavigation();
  
  return (
    <>
      <SlideModalHeader 
        title="Galería del Día"
        showBack={true}
        onBack={goBack}
      />
      
      <SlideModalBody>
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Sube fotos del progreso y actividades
            </p>
          </div>
          
          {/* Zona de subida de archivos */}
          <SlideModalSectionBlock 
            title="Subir Archivos" 
            onAdd={() => {}}
            addLabel="Examinar"
            icon={<Camera className="h-4 w-4" />}
          >
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Arrastra archivos aquí o haz clic en "Examinar"
              </p>
            </div>
          </SlideModalSectionBlock>
          
          {/* Fotos existentes */}
          <SlideModalSectionBlock 
            title="Fotos Actuales" 
            isEmpty={false}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-square bg-[var(--muted)] rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">IMG_001.jpg</span>
              </div>
              <div className="aspect-square bg-[var(--muted)] rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">IMG_002.jpg</span>
              </div>
            </div>
          </SlideModalSectionBlock>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion-fotos">Descripción de las fotos</Label>
            <Textarea 
              id="descripcion-fotos"
              placeholder="Describe qué muestran las fotos..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      </SlideModalBody>
      
      <SlideModalFooter>
        <Button variant="outline" className="flex-1">
          Guardar Fotos
        </Button>
        <Button className="flex-1">
          Continuar
        </Button>
      </SlideModalFooter>
    </>
  );
}

// Vista de eventos usando nuevos componentes
function FormularioEventos() {
  const { goBack } = useSlideNavigation();
  
  return (
    <>
      <SlideModalHeader 
        title="Eventos del Día"
        showBack={true}
        onBack={goBack}
      />
      
      <SlideModalBody>
        <div className="space-y-4">
          <div className="text-center space-y-2">
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
      </SlideModalBody>
      
      <SlideModalFooter>
        <Button variant="outline" className="flex-1">
          Agregar Evento
        </Button>
        <Button className="flex-1">
          Finalizar
        </Button>
      </SlideModalFooter>
    </>
  );
}

// Componente principal del ejemplo mejorado
export default function SlideModalExample2() {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleSaveAll = () => {
    alert('Guardando toda la información de la bitácora...');
    setIsOpen(false);
  };
  
  // Nota: En este ejemplo, cada vista maneja su propio header, body y footer
  // No usamos el header/footer automático del SlideModal
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
        <h1 className="text-2xl font-bold">SlideModal con Header/Body/Footer</h1>
        <p className="text-muted-foreground">
          Ejemplo avanzado usando los nuevos componentes SlideModalHeader, SlideModalBody y SlideModalFooter
        </p>
        <Button onClick={() => setIsOpen(true)}>
          Abrir Bitácora Avanzada
        </Button>
      </div>
      
      <SlideModal
        isOpen={isOpen}
        initialView="main"
        views={views}
        onClose={() => setIsOpen(false)}
        // No usamos title, onSaveAll aquí porque cada vista maneja su propio header/footer
      />
    </div>
  );
}