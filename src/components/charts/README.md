# Charts (Nivel 1)

## ¿Qué es un Chart de Nivel 1?

Los charts de Nivel 1 son **gráficos puros y agnósticos** que:
- Renderizan visualizaciones de datos
- Reciben datos y configuración por props
- **NO usan Card ni contenedores**
- **NO tienen títulos ni headers**
- **NO manejan layout externo**
- **NO conocen el dominio de negocio**

## Responsabilidades

| SÍ hace | NO hace |
|---------|---------|
| Renderizar gráficos (líneas, barras, pie, etc.) | Envolver en Card |
| Manejar tooltips internos | Agregar títulos o headers |
| Formatear valores en ejes | Consultar datos |
| Manejar estados loading/empty | Definir layout de página |
| Aplicar colores y estilos visuales | Conocer dominio (gastos, materiales, etc.) |

## Componentes en esta carpeta

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `MonthlyTrendChart` | Area Chart | Tendencia mensual con gradiente |
| `CategoryBreakdownChart` | Donut Chart | Distribución por categoría |

## Ejemplo de uso CORRECTO

```tsx
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// El CONSUMIDOR (página o widget) agrega el Card y título
function MyDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyTrendChart 
          data={myData}
          height={280}
        />
      </CardContent>
    </Card>
  );
}
```

## Ejemplo de uso INCORRECTO

```tsx
// ❌ MAL: El chart NO debe tener Card interno
function BadChart({ data }) {
  return (
    <Card>  {/* ❌ NO hacer esto */}
      <CardHeader>
        <CardTitle>Mi Gráfico</CardTitle>  {/* ❌ NO hacer esto */}
      </CardHeader>
      <ResponsiveContainer>
        <AreaChart data={data}>...</AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

## Relación con otros niveles

```
Nivel 2 (Dashboard Blocks) ──usa──▶ Nivel 1 (Charts)
                                         │
                                         ▼
                               Nivel 0 (UI Primitives)
```

Los Dashboard Blocks de Nivel 2 consumen estos charts y los envuelven en Cards con títulos.

## Cómo agregar un nuevo Chart

1. Crear el componente en esta carpeta
2. NO usar Card ni contenedores
3. Recibir `data`, `height`, `color`, etc. por props
4. Manejar estados `isLoading` y `empty` internamente
5. Usar clases Tailwind compatibles con dark mode
