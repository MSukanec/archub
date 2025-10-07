import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PayButtonProps {
  userId: string;
  courseSlug: string;
  price: number;
  currency?: 'ARS' | 'USD';
  months?: number | null;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export default function PayButton({
  userId,
  courseSlug,
  price,
  currency = 'ARS',
  months = null,
  className,
  variant = 'default',
  size = 'sm'
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      if (!supabase) {
        throw new Error('Supabase no está disponible');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        throw new Error('Debes iniciar sesión para comprar un curso');
      }
      
      // Get anon key from environment
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!anonKey) {
        throw new Error('Configuración de Supabase incompleta');
      }
      
      const response = await fetch('https://wtatvsgeivymcppowrfy.functions.supabase.co/create_mp_preference', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${userToken || anonKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          course_slug: courseSlug,
          price,
          currency,
          months
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Error ${response.status}: No se pudo crear la preferencia`;
        throw new Error(errorMessage);
      }

      const paymentUrl = data.sandbox_init_point || data.init_point;
      
      if (!paymentUrl) {
        throw new Error('Preferencia sin URL de pago');
      }

      // Redirect to Mercado Pago
      window.location.href = paymentUrl;
    } catch (error: any) {
      toast({
        title: 'Error al procesar el pago',
        description: error.message || 'No se pudo iniciar el proceso de pago',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePay}
      disabled={loading}
      className={className}
      data-testid="button-pay-course"
    >
      <ShoppingCart className="h-4 w-4 mr-1" />
      {loading ? 'Redirigiendo...' : 'Comprar'}
    </Button>
  );
}
