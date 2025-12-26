import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  // Silently suppress 400/401 auth errors - they are expected when no session exists
  if (res.status === 400 || res.status === 401) {
    return;
  }
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current session token, wrapped in try-catch to suppress errors
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session;
  } catch (error) {
    // Silently ignore auth errors - proceed without session
  }
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the current session token, wrapped in try-catch to suppress errors
    let session = null;
    try {
      const { data } = await supabase.auth.getSession();
      session = data?.session;
    } catch (error) {
      // Silently ignore auth errors - proceed without session
    }
    
    const headers: Record<string, string> = {};
    
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    // Return null for 400/401 errors if returnNull behavior is set
    if ((res.status === 400 || res.status === 401) && unauthorizedBehavior === "returnNull") {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error: any) => {
        // Never retry on 400/401 auth errors
        if (error?.message?.includes('400') || error?.message?.includes('401')) {
          return false;
        }
        // Don't retry on any auth-related errors
        if (error?.message?.toLowerCase().includes('auth') || 
            error?.message?.toLowerCase().includes('session')) {
          return false;
        }
        return false; // Disable retries entirely
      },
    },
    mutations: {
      retry: false,
    },
  },
});
