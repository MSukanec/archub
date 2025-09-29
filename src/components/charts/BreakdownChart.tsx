interface BreakdownItem {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

interface BreakdownChartProps {
  data: BreakdownItem[];
  className?: string;
  formatValue?: (value: number) => string;
}

export function BreakdownChart({ data, className = "", formatValue }: BreakdownChartProps) {
  // Filtrar datos con valores válidos
  const validData = data.filter(item => item.value > 0);
  
  // Calcular el total
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  
  // Colores CSS en orden
  const chartColors = [
    'var(--chart-1)',
    'var(--chart-2)', 
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ];
  
  // Función por defecto para formatear valores
  const defaultFormatValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatFn = formatValue || defaultFormatValue;
  
  if (validData.length === 0 || total === 0) {
    return (
      <div className={`text-center text-muted-foreground py-8 ${className}`}>
        No hay datos para mostrar
      </div>
    );
  }
  
  // Calcular porcentajes acumulados para posicionamiento
  let cumulativePercentage = 0;
  const segments = validData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const color = chartColors[index % chartColors.length];
    const startPos = cumulativePercentage;
    cumulativePercentage += percentage;
    
    return {
      ...item,
      percentage,
      color,
      startPos,
      endPos: cumulativePercentage
    };
  });
  
  return (
    <div className={`relative ${className}`}>
      {/* Valores de dinero y porcentajes arriba */}
      <div className="relative h-16 mb-6">
        {segments.map((segment, index) => {
          const centerPos = segment.startPos + (segment.percentage / 2);
          
          return (
            <div
              key={`values-${segment.label}-${index}`}
              className="absolute flex flex-col items-center"
              style={{
                left: `${centerPos}%`,
                transform: 'translateX(-50%)',
                top: 0
              }}
            >
              <div className="text-lg font-bold text-foreground">
                {formatFn(segment.value)}
              </div>
              <div className="text-sm text-muted-foreground">
                {segment.percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Iconos y labels ARRIBA de la barra */}
      <div className="relative h-12 mb-2">
        {segments.map((segment, index) => {
          const centerPos = segment.startPos + (segment.percentage / 2);
          
          return (
            <div
              key={`labels-${segment.label}-${index}`}
              className="absolute flex flex-col items-center"
              style={{
                left: `${centerPos}%`,
                transform: 'translateX(-50%)',
                top: 0
              }}
            >
              {/* Icono */}
              {segment.icon && (
                <div className="mb-1" style={{ color: segment.color }}>
                  {segment.icon}
                </div>
              )}
              {/* Label */}
              <div className="text-sm font-medium text-muted-foreground text-center">
                {segment.label}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Barra horizontal GRUESA */}
      <div className="relative">
        {/* La barra principal */}
        <div className="flex w-full h-4 rounded-sm">
          {segments.map((segment, index) => (
            <div
              key={`bar-${segment.label}-${index}`}
              className="h-full relative"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color
              }}
            />
          ))}
        </div>
        
        {/* Líneas verticales separadoras del color del segmento */}
        {segments.slice(0, -1).map((segment, index) => {
          const linePosition = segment.endPos;
          const nextSegment = segments[index + 1];
          return (
            <div
              key={`line-${index}`}
              className="absolute w-px"
              style={{
                left: `${linePosition}%`,
                top: '-12px',
                height: '28px',
                backgroundColor: nextSegment.color,
                zIndex: 10
              }}
            />
          );
        })}
      </div>
    </div>
  );
}