import { format } from "date-fns";
import { es } from "date-fns/locale";
interface DateSeparatorProps {
  date: Date;
}
export function DateSeparator({ date }: DateSeparatorProps) {
  const formattedDate = format(date, "EEEE d 'de'MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  return (
    <div className="relative flex items-center my-6">
      <div className="flex-shrink-0 pr-4">
        <span className="text-xs font-medium text-border/60">
          {capitalizedDate}
        </span>
      </div>
      <div className="flex-grow border-t border-border/40"></div>
    </div>
  );
}
