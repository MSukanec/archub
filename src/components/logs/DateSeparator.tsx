import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/40"></div>
      </div>
      <div className="relative px-4 bg-background">
        <span className="text-xs font-medium text-muted-foreground">
          {capitalizedDate}
        </span>
      </div>
    </div>
  );
}
