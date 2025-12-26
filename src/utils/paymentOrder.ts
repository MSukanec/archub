type PaymentMethod = "mercadopago" | "paypal" | "transfer";
/**
 * Verifica si el país es Argentina
 */
export function isArgentineCountry(countryAlpha3?: string): boolean {
  return countryAlpha3?.toUpperCase() === 'ARG'|| countryAlpha3?.toUpperCase() === 'AR';
}
/**
 * Ordena los métodos de pago según el país del usuario.
 * 
 * ARGENTINOS (ARG/AR):
 *   - Orden: Transfer → MercadoPago → PayPal
 *   - Todos habilitados
 * 
 * NO ARGENTINOS:
 *   - Orden: PayPal → Transfer → MercadoPago
 *   - Solo PayPal habilitado (Transfer y MP bloqueados)
 */
export function orderedMethods(countryAlpha3?: string, hasCoupon?: boolean): PaymentMethod[] {
  const isArgentine = isArgentineCountry(countryAlpha3);
  
  if (isArgentine) {
    // Argentinos: Transfer primero (incentiva descuento 5%), MP segundo, PayPal último
    return ['transfer', 'mercadopago', 'paypal'];
  } else {
    // No argentinos: PayPal primero (único habilitado), luego Transfer y MP (bloqueados)
    return ['paypal', 'transfer', 'mercadopago'];
  }
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
