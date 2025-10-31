import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface ChatMessageDoc {
  _id: string;
  userId: string | null;
  author: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDoc>(
  {
    _id: { type: String, default: () => uuid() },
    userId: { type: String, default: null },
    author: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ createdAt: -1 });

export type ChatMessageDocument = HydratedDocument<ChatMessageDoc>;
export const ChatMessageModel = model<ChatMessageDoc>('ChatMessage', chatMessageSchema);
