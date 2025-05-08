import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownUp, DollarSign, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExportTransactionsButton } from "@/components/projects/ExportTransactionsButton";

import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interfaz para los datos de transacciones que vienen de la API
interface Transaction {
  id: number;
  projectId: number;
  date: string; // Viene como string ISO desde la API
  type: string; // "ingreso" o "egreso"
  category: string;
  description: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface TransactionsPageProps {
  projectId: string;
}

export default function TransactionsPage({ projectId }: TransactionsPageProps) {
  const [, setLocation] = useLocation();
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    type: "ingreso",
    date: new Date().toISOString().slice(0, 10),
    category: "anticipo",
    description: "",
    amount: ""
  });

  const { toast } = useToast();
  
  // Fetch project details
  const { data: project } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions
  } = useQuery<Transaction[]>({
    queryKey: [`/api/projects/${projectId}/transactions`],
    enabled: !!projectId,
  });

  // Mutation para agregar una nueva transacción
  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<Transaction, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${projectId}/transactions`,
        transactionData
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear la transacción");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Cerrar el diálogo y actualizar la lista de transacciones
      setIsAddTransactionOpen(false);
      // Resetear el formulario
      setFormData({
        type: "ingreso",
        date: new Date().toISOString().slice(0, 10),
        category: "anticipo",
        description: "",
        amount: ""
      });
      // Refrescar la lista de transacciones
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/transactions`] });
      toast({
        title: "Transacción creada",
        description: "La transacción ha sido registrada correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler para el envío del formulario
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.description) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número mayor a cero",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar los datos para enviar
    const transactionData = {
      date: formData.date, // Enviamos la fecha como string en formato YYYY-MM-DD
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount)
    };
    
    // Enviar la mutación
    addTransactionMutation.mutate(transactionData);
  };

  // Handler para cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace('transaction-', '');
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

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

  // Filtrar transacciones según la pestaña activa
  const filteredTransactions = activeTab === "all" 
    ? transactions 
    : transactions.filter(t => t.type === activeTab);

  return (
    <MainLayout
      sidebarType={SidebarTypes.ProjectSidebar}
      selectedProject={projectId}
    >
      <div className="p-6">
        {/* Header and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(`/projects/${projectId}`)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Proyecto
            </Button>
            <h1 className="text-2xl font-bold">Movimientos del Proyecto</h1>
          </div>
          
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddTransactionOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Movimiento
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ingresos</p>
                  <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</h3>
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
                  <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</h3>
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
                  <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </h3>
                </div>
                <div className={`p-2 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full`}>
                  <ArrowDownUp className={`h-6 w-6 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registros de Movimientos</CardTitle>
            <ExportTransactionsButton projectId={projectId} />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="ingreso">Ingresos</TabsTrigger>
                <TabsTrigger value="egreso">Egresos</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingTransactions ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Cargando movimientos...
                          </TableCell>
                        </TableRow>
                      ) : filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No hay movimientos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <Badge className={transaction.type === "ingreso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {transaction.type === "ingreso" ? "Ingreso" : "Egreso"}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">
                              {transaction.category.replace("_", " ")}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              transaction.type === "ingreso" ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.type === "ingreso" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog para agregar transacción */}
        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Movimiento</DialogTitle>
              <DialogDescription>
                Registra un nuevo ingreso o egreso para este proyecto.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitTransaction}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Tipo de Movimiento</Label>
                    <select 
                      id="transaction-type" 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-date">Fecha</Label>
                    <Input 
                      id="transaction-date" 
                      type="date" 
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction-category">Categoría</Label>
                  <select 
                    id="transaction-category" 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="anticipo">Anticipo</option>
                    <option value="pago_parcial">Pago Parcial</option>
                    <option value="pago_final">Pago Final</option>
                    <option value="materiales">Materiales</option>
                    <option value="mano_de_obra">Mano de Obra</option>
                    <option value="herramientas">Herramientas</option>
                    <option value="transporte">Transporte</option>
                    <option value="impuestos">Impuestos</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction-description">Descripción</Label>
                  <Input 
                    id="transaction-description" 
                    placeholder="Describe este movimiento..." 
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction-amount">Monto</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input 
                      id="transaction-amount" 
                      className="pl-10" 
                      placeholder="0.00" 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={addTransactionMutation.isPending}
                >
                  {addTransactionMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}