import type { VercelRequest } from "@vercel/node";
import { capturePayPalOrder } from "./api";

export type CaptureCourseOrderResult =
  | { success: true; capture: any }
  | { success: false; error: string; status?: number };

export async function captureCourseOrder(
  req: VercelRequest
): Promise<CaptureCourseOrderResult> {
  try {
    const { orderId } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!orderId) {
      return {
        success: false,
        error: "Missing orderId",
        status: 400,
      };
    }

    const capture = await capturePayPalOrder(orderId);

    return {
      success: true,
      capture,
    };
  } catch (e: any) {
    return {
      success: false,
      error: String(e?.message || e),
      status: 500,
    };
  }
}
