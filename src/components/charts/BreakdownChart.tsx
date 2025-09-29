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
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Líneas verticales que atraviesan TODA la altura del componente */}
      {segments.map((segment, index) => (
        <div
          key={`line-${segment.label}-${index}`}
          className="absolute w-px inset-y-0"
          style={{
            left: `${segment.startPos}%`,
            backgroundColor: segment.color,
            zIndex: 10
          }}
        />
      ))}

      {/* Valores de dinero y porcentajes arriba */}
      <div className="relative flex-none h-16">
        {segments.map((segment, index) => (
          <div
            key={`values-${segment.label}-${index}`}
            className="absolute flex flex-col items-start"
            style={{
              left: `${segment.startPos}%`,
              transform: 'translateX(8px)',
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
        ))}
      </div>

      {/* Iconos y labels */}
      <div className="relative flex-none h-12">
        {segments.map((segment, index) => (
          <div
            key={`labels-${segment.label}-${index}`}
            className="absolute flex flex-col items-start"
            style={{
              left: `${segment.startPos}%`,
              transform: 'translateX(8px)',
              top: 0
            }}
          >
            {/* Icono */}
            {segment.icon && (
              <div className="mb-1" style={{ color: segment.color }}>
                {segment.icon}
              </div>
            )}
            {/* Label - sin wrap para que "Mano de Obra" esté en una línea */}
            <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {segment.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Barra horizontal pegada al fondo con mt-auto */}
      <div className="relative flex-none mt-auto">
        <div className="flex w-full h-6 rounded-sm">
          {segments.map((segment, index) => (
            <div
              key={`bar-${segment.label}-${index}`}
              className="h-full"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}