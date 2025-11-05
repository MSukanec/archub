type PaymentMethod = "mercadopago" | "paypal" | "transfer";

// Países donde Mercado Pago es el método preferido
const MP_COUNTRIES = new Set(['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY', 'PY']);

/**
 * Ordena los métodos de pago según el país del usuario.
 * MercadoPago primero para países LATAM, PayPal primero para el resto.
 * Si hay cupón aplicado, Transfer primero, PayPal segundo (MP bloqueado).
 */
export function orderedMethods(countryAlpha3?: string, hasCoupon?: boolean): PaymentMethod[] {
  // Si hay cupón aplicado, priorizar transferencia y PayPal (MP bloqueado temporalmente)
  if (hasCoupon) {
    return ['transfer', 'paypal', 'mercadopago'];
  }

  if (!countryAlpha3) {
    // Sin país seleccionado, orden por defecto
    return ['mercadopago', 'paypal', 'transfer'];
  }

  // Convertir alpha_3 a alpha_2 para comparar (simplificado)
  const alpha2Map: Record<string, string> = {
    'ARG': 'AR', 'BRA': 'BR', 'CHL': 'CL', 'COL': 'CO',
    'MEX': 'MX', 'PER': 'PE', 'URY': 'UY', 'PRY': 'PY'
  };
  
  const alpha2 = alpha2Map[countryAlpha3];
  const mpFirst = alpha2 && MP_COUNTRIES.has(alpha2);

  return mpFirst 
    ? ['mercadopago', 'paypal', 'transfer']
    : ['paypal', 'mercadopago', 'transfer'];
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
