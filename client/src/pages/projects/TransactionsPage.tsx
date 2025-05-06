import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownUp, DollarSign, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

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

// Simulación de datos de transacciones
const demoTransactions = [
  { 
    id: 1, 
    date: new Date(2025, 4, 1), 
    type: "ingreso", 
    category: "anticipo", 
    description: "Anticipo del cliente", 
    amount: 50000 
  },
  { 
    id: 2, 
    date: new Date(2025, 4, 3), 
    type: "egreso", 
    category: "materiales", 
    description: "Compra de materiales", 
    amount: 15000 
  },
  { 
    id: 3, 
    date: new Date(2025, 4, 5), 
    type: "egreso", 
    category: "mano_de_obra", 
    description: "Pago a trabajadores", 
    amount: 12000 
  },
  { 
    id: 4, 
    date: new Date(2025, 4, 10), 
    type: "ingreso", 
    category: "pago_parcial", 
    description: "Pago parcial del cliente", 
    amount: 30000 
  }
];

interface TransactionsPageProps {
  projectId: string;
}

export default function TransactionsPage({ projectId }: TransactionsPageProps) {
  const [, setLocation] = useLocation();
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch project details
  const { data: project } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const formatDate = (date: Date) => {
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
  const totalIncome = demoTransactions
    .filter(t => t.type === "ingreso")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = demoTransactions
    .filter(t => t.type === "egreso")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  // Filtrar transacciones según la pestaña activa
  const filteredTransactions = activeTab === "all" 
    ? demoTransactions 
    : demoTransactions.filter(t => t.type === activeTab);

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
          <CardHeader>
            <CardTitle>Registros de Movimientos</CardTitle>
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
                      {filteredTransactions.length === 0 ? (
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
                              <Badge variant={transaction.type === "ingreso" ? "success" : "destructive"}>
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
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Tipo de Movimiento</Label>
                  <Select defaultValue="ingreso">
                    <SelectTrigger id="transaction-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction-date">Fecha</Label>
                  <Input id="transaction-date" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction-category">Categoría</Label>
                <Select defaultValue="otros">
                  <SelectTrigger id="transaction-category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anticipo">Anticipo</SelectItem>
                    <SelectItem value="pago_parcial">Pago Parcial</SelectItem>
                    <SelectItem value="pago_final">Pago Final</SelectItem>
                    <SelectItem value="materiales">Materiales</SelectItem>
                    <SelectItem value="mano_de_obra">Mano de Obra</SelectItem>
                    <SelectItem value="herramientas">Herramientas</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="impuestos">Impuestos</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction-description">Descripción</Label>
                <Input id="transaction-description" placeholder="Describe este movimiento..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction-amount">Monto</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input id="transaction-amount" className="pl-10" placeholder="0.00" type="number" step="0.01" />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  // Aquí se manejaría la creación real de la transacción
                  setIsAddTransactionOpen(false);
                }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}