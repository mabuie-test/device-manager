import { ChatMessageModel } from '../database/models/index.js';
import { ChatMessage } from '../types/chat.js';

type ChatSource = {
  _id: string;
  userId: string | null;
  author: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

function toMessage(record: ChatSource): ChatMessage {
  return {
    id: record._id,
    user_id: record.userId,
    author: record.author,
    message: record.message,
    created_at: record.createdAt.toISOString(),
  };
}

export async function listMessages(limit = 50): Promise<ChatMessage[]> {
  const records = await ChatMessageModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return (records as ChatSource[]).reverse().map(toMessage);
}

export async function storeMessage(author: string, message: string, userId?: string): Promise<ChatMessage> {
  const doc = await ChatMessageModel.create({
    author,
    message,
    userId: userId ?? null,
  });
  return toMessage(doc.toObject() as ChatSource);
}
