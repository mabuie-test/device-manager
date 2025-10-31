export interface ChatMessage {
  id: string;
  user_id: string | null;
  author: string;
  message: string;
  created_at: string;
}
