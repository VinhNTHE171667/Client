import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { v4 as uuid } from "uuid";

import { useAuthStore } from "@/hooks/UseAuth";
import { useChatAPI } from "../hooks/useChatAPI";
import type { ChatMessage } from "../types/chat";
import "../styles/chatWidget.css";
import { MessageBubble } from "./MessageBubble";

type StorageKind = "session" | "history";

const STORAGE_PREFIX = "chatbot-widget";

function buildStorageKey(kind: StorageKind, accountId: string | null): string {
  const scope = accountId && accountId.trim() ? accountId.trim() : "guest";
  return `${STORAGE_PREFIX}:${scope}:${kind}`;
}

function loadSessionId(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch (err) {
    console.warn("Unable to read session id", err);
    return null;
  }
}

function persistSessionId(storageKey: string, id: string): void {
  try {
    window.localStorage.setItem(storageKey, id);
  } catch (err) {
    console.warn("Unable to store session id", err);
  }
}

function loadHistory(storageKey: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((message: ChatMessage) => ({
      ...message,
      createdAt: typeof message.createdAt === "number" ? message.createdAt : Date.now(),
    }));
  } catch (err) {
    console.warn("Unable to read chat history", err);
    return [];
  }
}

function persistHistory(storageKey: string, messages: ChatMessage[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
  } catch (err) {
    console.warn("Unable to persist chat history", err);
  }
}

function clearStorageKeys(keys: string[]): void {
  try {
    keys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn("Unable to clear chat storage", err);
  }
}

export function ChatWidget() {
  const [isOpen, setOpen] = useState(false);
  const {
    auth: { accountId },
  } = useAuthStore();

  useEffect(() => {
    console.log("🔥 [ChatWidget v2.0] Loaded (Feature). AccountId:", accountId);
  }, [accountId]);

  const sessionKey = useMemo(() => buildStorageKey("session", accountId ?? null), [accountId]);
  const historyKey = useMemo(() => buildStorageKey("history", accountId ?? null), [accountId]);
  const [sessionId, setSessionId] = useState(() => {
    const existing = loadSessionId(sessionKey);
    const nextId = existing ?? uuid();
    persistSessionId(sessionKey, nextId);
    return nextId;
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(historyKey));
  const { sendMessage, isLoading, error, resetError, clearSession } = useChatAPI();
  const previousAccountIdRef = useRef<string | null>(accountId ?? null);
  const previousSessionIdRef = useRef<string>(sessionId);

  const assistantGreeting = useMemo<ChatMessage>(
    () => ({
      id: "assistant-greeting",
      role: "assistant",
      content: "Xin chào 👋 Tôi có thể giúp bạn đặt lịch hoặc cung cấp thông tin dịch vụ spa!",
      intent: "idle",
      createdAt: Date.now(),
    }),
    []
  );

  const displayedMessages = messages.length > 0 ? messages : [assistantGreeting];

  useEffect(() => {
    const storedMessages = loadHistory(historyKey);
    setMessages(storedMessages);
    setSessionId((_current) => {
      const storedId = loadSessionId(sessionKey);
      if (storedId) {
        return storedId;
      }
      const generated = uuid();
      persistSessionId(sessionKey, generated);
      return generated;
    });
  }, [historyKey, sessionKey]);

  useEffect(() => {
    previousSessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const previousAccountId = previousAccountIdRef.current;
    const normalizedCurrent = accountId ?? null;
    const hasLoggedOut = Boolean(previousAccountId) && !normalizedCurrent;
    const switchedUser = Boolean(previousAccountId && normalizedCurrent && previousAccountId !== normalizedCurrent);

    if (hasLoggedOut || switchedUser) {
      const lastSessionId = previousSessionIdRef.current;
      clearStorageKeys([
        buildStorageKey("session", previousAccountId),
        buildStorageKey("history", previousAccountId),
      ]);
      if (lastSessionId) {
        clearSession(lastSessionId).catch((err) => {
          console.warn("Không thể clear session trên server", err);
        });
      }
      if (hasLoggedOut) {
        persistHistory(historyKey, []);
      }
      setMessages([]);
      const newId = uuid();
      setSessionId(newId);
      persistSessionId(sessionKey, newId);
    }

    previousAccountIdRef.current = normalizedCurrent;
  }, [accountId, clearSession, historyKey, sessionKey]);

  useEffect(() => {
    persistSessionId(sessionKey, sessionId);
  }, [sessionId, sessionKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || isLoading) {
      return;
    }
    resetError();

    const userMessage: ChatMessage = {
      id: uuid(),
      role: "user",
      content: value,
      createdAt: Date.now(),
    };

    const baseMessages = displayedMessages.filter((message: ChatMessage) => message.id !== "assistant-greeting");
    const nextMessages = [...baseMessages, userMessage];
    setMessages(nextMessages);
    persistHistory(historyKey, nextMessages);
    setInput("");

    try {
      const response = await sendMessage({
        session_id: sessionId,
        query: value,
        customer_id: accountId,
      });
      const assistantMessage: ChatMessage = {
        id: uuid(),
        role: "assistant",
        content: response.answer,
        intent: response.intent,
        createdAt: Date.now(),
      };
      const updatedMessages = [...nextMessages, assistantMessage];
      setMessages(updatedMessages);
      persistHistory(historyKey, updatedMessages);

      const shouldResetSession = Boolean(response.metadata && response.metadata["appointment_id"]);
      if (shouldResetSession) {
        await clearSession(sessionId);
        const refreshedId = uuid();
        setSessionId(refreshedId);
        persistSessionId(sessionKey, refreshedId);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const toggleWidget = () => {
    setOpen((previous: boolean) => !previous);
    if (!sessionId) {
      const generated = uuid();
      setSessionId(generated);
      persistSessionId(sessionKey, generated);
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="chatbot-widget" role="dialog" aria-label="Spa chatbot">
          <div className="chatbot-header">
            <h2>Trợ lý Spa</h2>
            <button
              type="button"
              aria-label="Đóng chat"
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "none",
                color: "#fff",
                borderRadius: "9999px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <div className="chatbot-body">
            <div className="chatbot-messages">
              {displayedMessages.map((message: ChatMessage) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </div>
          <div className="chatbot-footer">
            {error ? <p className="chatbot-error">{error}</p> : null}
            <form className="chatbot-input" onSubmit={handleSubmit}>
              <textarea
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                aria-label="Nội dung tin nhắn"
              />
              <button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? "Đang gửi..." : "Gửi"}
              </button>
            </form>
            {isLoading ? <p className="chatbot-loading">Trợ lý đang phản hồi...</p> : null}
          </div>
        </div>
      ) : null}
      {!isOpen ? (
        <button className="chatbot-toggle" type="button" onClick={toggleWidget} aria-label="Mở chatbot">
          Chat
        </button>
      ) : null}
    </>
  );
}

export default ChatWidget;
