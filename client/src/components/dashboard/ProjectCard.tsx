import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectCardProps {
  id: number;
  name: string;
  totalBudget?: number;
  status: string;
  imageUrl: string;
  updatedAt: Date;
  onClick?: () => void;
}

export function ProjectCard({
  id,
  name,
  totalBudget,
  status,
  imageUrl,
  updatedAt,
  onClick,
}: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planificación";
      case "in_progress":
        return "En progreso";
      case "review":
        return "Revisión";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const formatBudget = (amount?: number) => {
    if (!amount) return "No definido";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const timeAgo = formatDistanceToNow(new Date(updatedAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="h-40 bg-gray-300 relative">
        {imageUrl && (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50"></div>
          </>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-1">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Presupuesto total: {formatBudget(totalBudget)}
        </p>
        <div className="mt-3 flex justify-between items-center">
          <Badge variant="outline" className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
          <span className="text-sm text-gray-500">
            Actualizado {timeAgo}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
