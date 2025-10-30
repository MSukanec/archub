import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useLocation } from 'wouter';

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
  const [, navigate] = useLocation();

  const handlePay = () => {
    navigate(`/checkout?course=${courseSlug}`);
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
