export type ChatIntent = "info" | "action" | "idle";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: ChatIntent;
  createdAt: number;
}

export interface ChatRequestPayload {
  session_id?: string;
  query: string;
  customer_id?: string | null;
}

export interface ChatResponsePayload {
  answer: string;
  intent: ChatIntent;
  metadata?: Record<string, unknown> | null;
}
