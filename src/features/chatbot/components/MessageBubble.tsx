import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div
      className="message-bubble"
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        backgroundColor: isUser ? "#2e8b57" : "#fff",
        color: isUser ? "#fff" : "#2a1e42",
        borderRadius: "16px",
        padding: "12px 16px",
        maxWidth: "85%",
        boxShadow: isUser
          ? "0 6px 16px rgba(46, 139, 87, 0.3)"
          : "0 3px 12px rgba(57, 63, 72, 0.1)",
      }}
    >
      <div className="message-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
      {message.intent && message.role === "assistant" ? (
        <span
          style={{
            display: "inline-block",
            marginTop: "8px",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            backgroundColor: "rgba(46, 139, 87, 0.12)",
            color: "#2e8b57",
          }}
        >
          {message.intent}
        </span>
      ) : null}
    </div>
  );
};
