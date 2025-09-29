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
  
  // Calcular el total y valor máximo para normalizar alturas
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...validData.map(item => item.value));
  
  // Colores CSS en orden
  const chartColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
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
  
  return (
    <div className={`${className}`}>
      {/* Container principal con las barras */}
      <div className="flex items-end justify-between gap-4 h-48 mb-6">
        {validData.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const heightPercentage = (item.value / maxValue) * 100;
          const color = chartColors[index % chartColors.length];
          
          return (
            <div key={`${item.label}-${index}`} className="flex-1 flex flex-col items-center">
              {/* Valor arriba de la barra */}
              <div className="mb-2 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatFn(item.value)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {percentage.toFixed(1)}%
                </div>
              </div>
              
              {/* Barra vertical */}
              <div className="w-full flex flex-col justify-end h-full">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 ease-out"
                  style={{
                    height: `${heightPercentage}%`,
                    backgroundColor: color,
                    minHeight: '20px'
                  }}
                />
              </div>
              
              {/* Label abajo de la barra */}
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {item.icon && (
                    <div className="flex-shrink-0" style={{ color }}>
                      {item.icon}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}