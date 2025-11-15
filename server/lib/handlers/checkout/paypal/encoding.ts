export function encodeInvoiceId(data: { 
  productType: string; 
  userId: string; 
  productSlug: string; 
  months?: number;
  organizationId?: string;
  billingPeriod?: 'monthly' | 'annual';
}): string {
  if (data.productType === 'subscription') {
    return `subscription|${data.organizationId}|${data.productSlug}|${data.billingPeriod}`;
  }
  
  return `course|${data.userId}|${data.productSlug}|${data.months || 12}`;
}

export function encodeCustomId(data: {
  userId: string;
  productType: string;
  productSlug?: string;
  months?: number;
  organizationId?: string;
  planSlug?: string;
  billingPeriod?: 'monthly' | 'annual';
  couponCode?: string;
  couponId?: string;
}): string {
  const parts: string[] = [
    data.userId,
    data.productType,
    data.productSlug || '',
    String(data.months || ''),
    data.organizationId || '',
    data.planSlug || '',
    data.billingPeriod || '',
    data.couponCode || '',
    data.couponId || '',
  ];
  
  return parts.join('|');
}

export type DecodedInvoiceId = {
  productType: 'course' | 'subscription' | null;
  userId?: string;
  productSlug?: string;
  months?: number;
  organizationId?: string;
  billingPeriod?: 'monthly' | 'annual';
};

export function decodeInvoiceId(invoiceId: string): DecodedInvoiceId {
  const parts = invoiceId.split('|');
  
  if (parts[0] === 'subscription') {
    return {
      productType: 'subscription',
      organizationId: parts[1] || undefined,
      productSlug: parts[2] || undefined,
      billingPeriod: (parts[3] === 'monthly' || parts[3] === 'annual') ? parts[3] : undefined,
    };
  }
  
  if (parts[0] === 'course') {
    return {
      productType: 'course',
      userId: parts[1] || undefined,
      productSlug: parts[2] || undefined,
      months: parts[3] ? Number(parts[3]) : undefined,
    };
  }
  
  return { productType: null };
}

export type DecodedCustomId = {
  userId?: string;
  productType?: string;
  productSlug?: string;
  months?: number;
  organizationId?: string;
  planSlug?: string;
  billingPeriod?: 'monthly' | 'annual';
  couponCode?: string;
  couponId?: string;
};

export function decodeCustomId(customId: string): DecodedCustomId {
  const parts = customId.split('|');
  
  return {
    userId: parts[0] || undefined,
    productType: parts[1] || undefined,
    productSlug: parts[2] || undefined,
    months: parts[3] ? Number(parts[3]) : undefined,
    organizationId: parts[4] || undefined,
    planSlug: parts[5] || undefined,
    billingPeriod: (parts[6] === 'monthly' || parts[6] === 'annual') ? parts[6] : undefined,
    couponCode: parts[7] || undefined,
    couponId: parts[8] || undefined,
  };
}
