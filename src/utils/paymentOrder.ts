type PaymentMethod = "mercadopago" | "paypal" | "transfer";

// Países donde Mercado Pago es el método preferido
const MP_COUNTRIES = new Set(['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY', 'PY']);

/**
 * Ordena los métodos de pago.
 * SIEMPRE: Transferencia primero (por descuento del 5%), Mercado Pago segundo, PayPal último.
 * Si hay cupón aplicado, MP queda bloqueado pero mantiene el orden.
 */
export function orderedMethods(countryAlpha3?: string, hasCoupon?: boolean): PaymentMethod[] {
  // Orden fijo: Transferencia primero (incentiva descuento 5%), MP segundo, PayPal último
  return ['transfer', 'mercadopago', 'paypal'];
}

/**
 * Retorna el texto del botón según el método de pago seleccionado
 */
export function getPaymentButtonText(method: PaymentMethod | null): string {
  if (!method) return 'Continuar al pago';
  
  switch (method) {
    case 'mercadopago':
      return 'Pagar con Mercado Pago';
    case 'paypal':
      return 'Pagar con PayPal';
    case 'transfer':
      return 'Ver datos bancarios';
    default:
      return 'Continuar al pago';
  }
}
