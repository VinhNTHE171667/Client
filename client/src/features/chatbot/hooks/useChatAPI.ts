import { useCallback, useRef, useState } from "react";

import type { ChatRequestPayload, ChatResponsePayload } from "../types/chat";

const DEFAULT_ENDPOINT = "http://localhost:8000/chat";

export function useChatAPI() {
  const controllerRef = useRef<AbortController | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = import.meta.env.VITE_CHAT_API_URL || DEFAULT_ENDPOINT;

  const sendMessage = useCallback(
    async (payload: ChatRequestPayload): Promise<ChatResponsePayload> => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controllerRef.current.signal,
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || `Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as ChatResponsePayload;
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const clearSession = useCallback(
    async (sessionId: string | null | undefined) => {
      if (!sessionId) {
        return;
      }
      const normalized = endpoint.replace(/\/$/, "");
      const base = normalized.endsWith("/chat") ? normalized : `${normalized}/chat`;
      const url = `${base}/session/${encodeURIComponent(sessionId)}`;
      try {
        await fetch(url, { method: "DELETE" });
      } catch (err) {
        console.warn("Không thể xoá session chatbot", err);
      }
    },
    [endpoint]
  );

  return {
    sendMessage,
    isLoading,
    error,
    resetError,
    clearSession,
  };
}
