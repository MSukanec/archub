import { useQuery } from '@tanstack/react-query';
export type FlowKey = 'user_signup'| 'billing_checkout';
interface FlowStatusResponse {
  flow?: string;
  blocked: boolean;
  alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    status: string;
    title: string;
  }>;
}
const FLOW_BLOCKED_MESSAGES: Record<FlowKey, { title: string; description: string }> = {
  user_signup: {
    title: 'Registro temporalmente no disponible',
    description: 'Estamos realizando mejoras en nuestro sistema. Por favor, intenta nuevamente en unos minutos.',
  },
  billing_checkout: {
    title: 'Pagos temporalmente no disponibles',
    description: 'Nuestro sistema de pagos está siendo actualizado. Por favor, intenta nuevamente en unos minutos.',
  },
};
async function fetchFlowStatus(flowKey: FlowKey): Promise<FlowStatusResponse> {
  try {
    const res = await fetch(`/api/ops/flow-status?flow=${flowKey}`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      return { blocked: false, alerts: [] };
    }
    
    return res.json();
  } catch {
    return { blocked: false, alerts: [] };
  }
}
export function getFlowBlockedMessage(flowKey: FlowKey): { title: string; description: string } {
  return FLOW_BLOCKED_MESSAGES[flowKey] || {
    title: 'Servicio temporalmente no disponible',
    description: 'Por favor, intenta nuevamente en unos minutos.',
  };
}
export function useFlowBlocking(flowKey: FlowKey) {
  const { data, isLoading } = useQuery<FlowStatusResponse>({
    queryKey: ['/api/ops/flow-status', flowKey],
    queryFn: () => fetchFlowStatus(flowKey),
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });
  const isBlocked = data?.blocked ?? false;
  const message = getFlowBlockedMessage(flowKey);
  return {
    isBlocked,
    isLoading,
    message,
    alerts: data?.alerts || [],
  };
}
export async function checkFlowBlocked(flowKey: FlowKey): Promise<{
  blocked: boolean;
  message: { title: string; description: string };
}> {
  const data = await fetchFlowStatus(flowKey);
  const message = getFlowBlockedMessage(flowKey);
  
  return { blocked: data.blocked, message };
}
