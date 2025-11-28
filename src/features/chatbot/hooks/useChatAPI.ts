import { useCallback, useRef, useState } from "react";

import type { ChatRequestPayload, ChatResponsePayload } from "../types/chat";
import { CHATBOT_API_ENDPOINT, CHATBOT_API_BASE_URL } from "../../../config/api";

export function useChatAPI() {
  const controllerRef = useRef<AbortController | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = CHATBOT_API_ENDPOINT;

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
      const url = `${CHATBOT_API_BASE_URL}/chat/session/${encodeURIComponent(sessionId)}`;
      try {
        await fetch(url, { method: "DELETE" });
      } catch (err) {
        console.warn("Không thể xoá session chatbot", err);
      }
    },
    []
  );

  return {
    sendMessage,
    isLoading,
    error,
    resetError,
    clearSession,
  };
}
