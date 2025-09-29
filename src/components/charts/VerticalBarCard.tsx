interface BarData {
  value: number;
  color?: string;
}

interface VerticalBarCardProps {
  name: string;
  amount: string;
  changeLabel: string;
  color: string;
  share: string;
  series: BarData[];
  className?: string;
}

export function VerticalBarCard({
  name,
  amount,
  changeLabel,
  color,
  share,
  series,
  className = ""
}: VerticalBarCardProps) {
  // Filtrar datos válidos
  const validData = series.filter(item => item.value > 0);
  
  if (validData.length === 0) {
    return (
      <div className={`grid grid-rows-[auto_1fr_auto] min-h-[160px] bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          No hay datos para mostrar
        </div>
      </div>
    );
  }

  // Calcular valor máximo para normalizar las alturas
  const maxValue = Math.max(...validData.map(item => item.value));
  
  // Colores por defecto
  const defaultColors = [
    'var(--accent)',
    'var(--accent-2)', 
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ];

  // Preparar datos para las barras
  const bars = validData.map((item, index) => ({
    ...item,
    height: maxValue > 0 ? (item.value / maxValue) * 100 : 0,
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  return (
    <div className={`grid grid-rows-[auto_1fr_auto] min-h-[160px] bg-card border border-border rounded-lg p-4 ${className}`}>
      {/* Fila 1: Encabezado (auto) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground">
            {amount}
          </span>
          <span className="text-sm text-muted-foreground">
            {changeLabel}
          </span>
        </div>
      </div>

      {/* Fila 2: Gráfico de barras verticales (1fr) */}
      <div className="flex items-end justify-center gap-2 h-full min-h-[80px]">
        {bars.map((bar, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
            style={{
              height: `${bar.height}%`,
              backgroundColor: bar.color,
              minHeight: bar.height > 0 ? '4px' : '0px' // Mínimo visible
            }}
          />
        ))}
      </div>

      {/* Fila 3: Footer (auto) */}
      <div className="mt-3 pt-3 relative">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {share}
          </span>
        </div>
        
        {/* Línea de color horizontal en el fondo */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}