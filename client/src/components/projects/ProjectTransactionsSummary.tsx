import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownLeft, ArrowDownUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: number;
  projectId: number;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
}

interface ProjectTransactionsSummaryProps {
  projectId: string | number;
}

export function ProjectTransactionsSummary({ projectId }: ProjectTransactionsSummaryProps) {
  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
  } = useQuery<Transaction[]>({
    queryKey: [`/api/projects/${projectId}/transactions`],
    enabled: !!projectId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calcular totales
  const totalIncome = transactions
    .filter(t => t.type === "ingreso")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === "egreso")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  // Generar datos para el gráfico de categorías
  const categorySummary = transactions.reduce((acc: Record<string, number>, transaction) => {
    const { category, amount, type } = transaction;
    if (!acc[category]) {
      acc[category] = 0;
    }
    
    if (type === "egreso") {
      acc[category] += amount;
    }
    
    return acc;
  }, {});

  const categoryChartData = Object.entries(categorySummary)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: amount
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Tomar las 5 categorías con mayor gasto

  // Colores para el gráfico de categorías
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // No mostrar nada si no hay transacciones
  if (!isLoadingTransactions && transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ingresos</p>
                {isLoadingTransactions ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</h3>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Egresos</p>
                {isLoadingTransactions ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</h3>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <ArrowDownLeft className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Balance</p>
                {isLoadingTransactions ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </h3>
                )}
              </div>
              <div className={`p-2 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full`}>
                <ArrowDownUp className={`h-6 w-6 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Categorías de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex justify-center items-center h-60">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : categoryChartData.length > 0 ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-60 text-gray-500">
                No hay datos suficientes para mostrar el gráfico
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Balance (Ingresos vs Egresos) */}
        <Card>
          <CardHeader>
            <CardTitle>Balance del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Ingresos', amount: totalIncome, fill: '#10b981' },
                      { name: 'Egresos', amount: totalExpenses, fill: '#ef4444' },
                      { name: 'Balance', amount: balance, fill: balance >= 0 ? '#10b981' : '#ef4444' }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat("es-AR", {
                          notation: "compact",
                          compactDisplay: "short",
                          currency: "ARS"
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Monto"]}
                    />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-60 text-gray-500">
                No hay datos suficientes para mostrar el gráfico
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}