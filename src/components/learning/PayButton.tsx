import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

interface PayButtonProps {
  courseSlug: string;
  currency?: 'ARS' | 'USD';
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export default function PayButton({
  courseSlug,
  currency = 'ARS',
  className,
  variant = 'default',
  size = 'sm'
}: PayButtonProps) {
  const { openModal } = useGlobalModalStore();

  const handlePay = () => {
    openModal('payment-method', {
      courseSlug,
      currency
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePay}
      className={className}
      data-testid="button-pay-course"
    >
      <ShoppingCart className="h-4 w-4 mr-1" />
      Suscribirme
    </Button>
  );
}
