import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CurrencyDetailCardProps {
  item: {
    contact?: {
      first_name?: string;
      last_name?: string;
      company_name?: string;
    };
    client?: {
      currency_id?: string;
      committed_amount?: number;
    };
    dollarizedTotal?: number;
    commitmentPercentage?: number;
    contributionPercentage?: number;
    remainingAmount?: number;
  };
}

export default function CurrencyDetailCard({ item }: CurrencyDetailCardProps) {
  if (!item.contact) {
    return (
      </div>
    );
  }

  const displayName = item.contact.company_name || 
                     `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim();
  const initials = item.contact.company_name 
    ? item.contact.company_name.charAt(0).toUpperCase()
    : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
        {/* Left side: Avatar and name */}
          </Avatar>
          <div>
            {item.contact.company_name && (
                {item.contact.first_name} {item.contact.last_name}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Currency and Total */}
            {item.dollarizedTotal ? 
              `US$ ${item.dollarizedTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
              : '-'
            }
          </div>
        </div>
      </div>
    </div>
  );
}