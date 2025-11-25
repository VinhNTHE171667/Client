import { RECOMMENDATION_API_BASE_URL } from "../config/api";

const API_BASE = RECOMMENDATION_API_BASE_URL;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  // timeout controller to avoid indefinite spinner
  const controller = new AbortController();
  const timeoutMs = 8000; // 8 seconds
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.debug(`[recommendation] fetch -> ${url}`);
    const response = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      console.error("[recommendation] non-ok response", { url, status: response.status, bodyText });
      throw new Error(bodyText || `Request to ${normalizedPath} failed with ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch((err) => {
      console.error("[recommendation] json parse error", { url, err });
      throw err;
    });

    console.debug("[recommendation] response", { url, data });
    return data as T;
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      console.error("[recommendation] request aborted (timeout)", { url });
      throw new Error("Request timeout");
    }
    console.error("[recommendation] fetch exception", { url, err });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export type RecommendationItem = {
  serviceId: string;
  serviceUuid?: string;
  serviceName?: string;
  price?: number;
  imageUrl?: string | null;
  score?: number;
  reason?: string;
  doctorId?: string | null;
  doctorName?: string | null;
  metadata?: Record<string, unknown>;
};

export type RecommendationResponse = {
  model?: string;
  items: RecommendationItem[];
  issuedAt?: string;
};

export async function getCustomerRecommendations(
  customerId: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<RecommendationResponse> {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const params = new URLSearchParams();
  if (options?.limit) {
    params.set("k", String(options.limit));
  }

  const query = params.toString();
  const path = `/api/recommendation/customer/${customerId}${query ? `?${query}` : ""}`;

  const response = await fetchJson<RecommendationResponse>(path, {
    signal: options?.signal,
  });

  return {
    model: response.model,
    issuedAt: response.issuedAt,
    items: Array.isArray(response.items) ? response.items : [],
  };
}

  export async function getServiceRecommendations(
    recommenderServiceId: string | number,
    options?: { limit?: number; signal?: AbortSignal }
  ): Promise<RecommendationResponse> {
    if (!recommenderServiceId) throw new Error('recommenderServiceId is required');
    const params = new URLSearchParams();
    if (options?.limit) params.set('k', String(options.limit));
    const query = params.toString();
    const path = `/api/recommendation/service/${recommenderServiceId}${query ? `?${query}` : ''}`;
    const response = await fetchJson<RecommendationResponse>(path, { signal: options?.signal });
    return {
      model: response.model,
      issuedAt: response.issuedAt,
      items: Array.isArray(response.items) ? response.items : [],
    };
  }

export async function getCartRecommendations(
  serviceIds: (string | number)[],
  options?: { limit?: number; signal?: AbortSignal }
): Promise<RecommendationResponse> {
  if (!serviceIds || serviceIds.length === 0) {
    throw new Error("serviceIds is required and cannot be empty");
  }

  const path = "/api/recommendation/cart";
  const response = await fetchJson<RecommendationResponse>(path, {
    method: "POST",
    signal: options?.signal,
    body: JSON.stringify({
      serviceIds,
      k: options?.limit ?? 6,
    }),
  });

  return {
    model: response.model,
    issuedAt: response.issuedAt,
    items: Array.isArray(response.items) ? response.items : [],
  };
}
