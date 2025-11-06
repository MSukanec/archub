import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta, 
  StatCardContent 
} from '@/components/ui-custom/stat-card';
import { Button } from '@/components/ui/button';
import { Home, Users, DollarSign, TrendingUp } from 'lucide-react';

const AdminLayoutTab = () => {
  return (
    <div className="space-y-8" data-testid="admin-layout-tab">
      {/* Sección: Card Component (shadcn/ui) */}
      <div>
        <h2 className="text-2xl font-bold mb-4" data-testid="heading-card-section">Card Component (shadcn/ui)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card básica */}
          <Card data-testid="card-basic">
            <CardHeader>
              <CardTitle>Card Básica</CardTitle>
              <CardDescription>Ejemplo de una card simple</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Este es el contenido de la card. Aquí puedes poner cualquier tipo de información.
              </p>
            </CardContent>
          </Card>

          {/* Card con ícono en header */}
          <Card data-testid="card-with-icon">
            <CardHeader icon={Home} title="Card con Ícono" description="Header con ícono personalizado" />
            <CardContent>
              <p className="text-sm">
                Esta card tiene un ícono en el header usando el prop especial de CardHeader.
              </p>
            </CardContent>
          </Card>

          {/* Card con footer */}
          <Card data-testid="card-with-footer">
            <CardHeader>
              <CardTitle>Card con Footer</CardTitle>
              <CardDescription>Incluye botones en el footer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Esta card incluye un footer con acciones.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm" data-testid="button-cancel">Cancelar</Button>
              <Button size="sm" data-testid="button-accept">Aceptar</Button>
            </CardFooter>
          </Card>

          {/* Card sin border */}
          <Card className="border-0 shadow-none bg-muted/30" data-testid="card-no-border">
            <CardHeader>
              <CardTitle>Card Sin Borde</CardTitle>
              <CardDescription>Sin border ni shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Esta card no tiene borde ni sombra, solo fondo.
              </p>
            </CardContent>
          </Card>

          {/* Card con contenido personalizado */}
          <Card data-testid="card-custom-content">
            <CardHeader>
              <CardTitle>Card Personalizada</CardTitle>
              <CardDescription>Con múltiples elementos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-sm" data-testid="text-active-users">25 usuarios activos</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-sm" data-testid="text-amount">$1,234.56</span>
              </div>
            </CardContent>
          </Card>

          {/* Card clickeable */}
          <Card className="cursor-pointer hover:shadow-xl transition-shadow" data-testid="card-clickable">
            <CardHeader>
              <CardTitle>Card Clickeable</CardTitle>
              <CardDescription>Hover para ver efecto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Esta card tiene hover effect y puede ser clickeable.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Sección: StatCard Component (ui-custom) */}
      <div>
        <h2 className="text-2xl font-bold mb-4" data-testid="heading-statcard-section">StatCard Component (ui-custom) - KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* StatCard básica */}
          <StatCard data-testid="statcard-total-users">
            <StatCardTitle showArrow={false} data-testid="title-total-users">Total Usuarios</StatCardTitle>
            <StatCardValue data-testid="value-total-users">1,234</StatCardValue>
            <StatCardMeta data-testid="meta-total-users">+12% desde el mes pasado</StatCardMeta>
          </StatCard>

          {/* StatCard con link */}
          <StatCard href="/admin/administration" data-testid="statcard-active-users">
            <StatCardTitle data-testid="title-active-users">Usuarios Activos</StatCardTitle>
            <StatCardValue data-testid="value-active-users">856</StatCardValue>
            <StatCardMeta className="text-accent" data-testid="meta-active-users">Clickeable - Ver más</StatCardMeta>
          </StatCard>

          {/* StatCard con onClick */}
          <StatCard onCardClick={() => alert('Card clicked!')} data-testid="statcard-total-revenue">
            <StatCardTitle data-testid="title-total-revenue">Ingresos Totales</StatCardTitle>
            <StatCardValue data-testid="value-total-revenue">$45,231</StatCardValue>
            <StatCardMeta data-testid="meta-total-revenue">+20.1% respecto al trimestre anterior</StatCardMeta>
          </StatCard>

          {/* StatCard con contenido personalizado */}
          <StatCard data-testid="statcard-active-projects">
            <StatCardTitle showArrow={false} data-testid="title-active-projects">Proyectos Activos</StatCardTitle>
            <StatCardValue data-testid="value-active-projects">12</StatCardValue>
            <StatCardContent data-testid="content-active-projects">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground" data-testid="text-projects-trend">+3 este mes</span>
              </div>
            </StatCardContent>
          </StatCard>

          {/* StatCard variant minimal */}
          <StatCard variant="minimal" data-testid="statcard-pending-tasks">
            <StatCardTitle showArrow={false} data-testid="title-pending-tasks">Tareas Pendientes</StatCardTitle>
            <StatCardValue className="text-4xl" data-testid="value-pending-tasks">48</StatCardValue>
            <StatCardMeta data-testid="meta-pending-tasks">15 de alta prioridad</StatCardMeta>
          </StatCard>

          {/* StatCard con número largo */}
          <StatCard data-testid="statcard-total-sales">
            <StatCardTitle showArrow={false} data-testid="title-total-sales">Total Ventas</StatCardTitle>
            <StatCardValue className="text-3xl" data-testid="value-total-sales">$1,234,567</StatCardValue>
            <StatCardMeta data-testid="meta-total-sales">Año fiscal 2024</StatCardMeta>
          </StatCard>

          {/* StatCard con porcentaje */}
          <StatCard data-testid="statcard-conversion-rate">
            <StatCardTitle showArrow={false} data-testid="title-conversion-rate">Tasa de Conversión</StatCardTitle>
            <StatCardValue className="text-accent" data-testid="value-conversion-rate">68.5%</StatCardValue>
            <StatCardMeta data-testid="meta-conversion-rate">Objetivo: 70%</StatCardMeta>
          </StatCard>

          {/* StatCard con custom className */}
          <StatCard className="bg-accent/10 border-accent/30" data-testid="statcard-uptime">
            <StatCardTitle showArrow={false} className="text-accent" data-testid="title-uptime">
              Destacado
            </StatCardTitle>
            <StatCardValue className="text-accent" data-testid="value-uptime">99.9%</StatCardValue>
            <StatCardMeta className="text-accent/80" data-testid="meta-uptime">Uptime del sistema</StatCardMeta>
          </StatCard>

        </div>
      </div>

      {/* Sección: Comparativa de uso */}
      <div>
        <h2 className="text-2xl font-bold mb-4" data-testid="heading-usage-guide">Guía de Uso</h2>
        <Card data-testid="card-usage-guide">
          <CardHeader>
            <CardTitle>¿Cuándo usar cada componente?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Card (shadcn/ui)</h3>
              <p className="text-sm text-muted-foreground">
                Usar para contenido general, formularios, listas, detalles de entidades. 
                Es versátil y acepta cualquier tipo de contenido. Soporta header con ícono,
                footer con acciones, y múltiples variantes de estilo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">StatCard (ui-custom)</h3>
              <p className="text-sm text-muted-foreground">
                Usar específicamente para mostrar KPIs, métricas y estadísticas. 
                Optimizado para mostrar un número grande con título y metadata.
                Incluye hover effect con "Ver más" cuando es clickeable.
                Ideal para dashboards y resúmenes ejecutivos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AdminLayoutTab;
