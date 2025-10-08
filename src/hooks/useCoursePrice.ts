import { useEffect, useState } from "react";
import { getCoursePriceBySlug, PriceRow } from "@/lib/getCoursePrice";

export function useCoursePrice(courseSlug: string, currency = "ARS", provider = "mercadopago") {
  const [price, setPrice] = useState<PriceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCoursePriceBySlug(courseSlug, { currency, provider })
      .then((res) => mounted && setPrice(res))
      .catch((e) => mounted && setError(String(e)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [courseSlug, currency, provider]);

  return { price, loading, error };
}
