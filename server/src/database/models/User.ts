import { Schema, model, type HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export type UserRole = 'admin' | 'player';

export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  age: number;
  mpesaNumber: string;
  balance: number;
  resetToken: string | null;
  resetTokenExpires: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, default: () => uuid() },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'player'], required: true, default: 'player' },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    mpesaNumber: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = HydratedDocument<UserDoc>;
export const UserModel = model<UserDoc>('User', userSchema);
