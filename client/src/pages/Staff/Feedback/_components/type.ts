import type { FeedbackManagementResponse } from "@/services/feedback";

export type FeedbackTableProps = FeedbackManagementResponse & {
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};
