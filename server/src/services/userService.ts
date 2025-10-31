import { UserModel, type UserDocument, type UserDoc } from '../database/models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { User } from '../types/user.js';

export type RegisterPayload = {
  email: string;
  password: string;
  phone: string;
  age: number;
  mpesaNumber: string;
};

type UserSource = UserDocument | (UserDoc & { createdAt: Date; updatedAt: Date });

function toUser(user: UserSource | null | undefined): User | undefined {
  if (!user) return undefined;
  const plain = 'toObject' in user ? (user.toObject() as UserSource) : user;
  return {
    id: plain._id,
    email: plain.email,
    password_hash: plain.passwordHash,
    role: plain.role,
    phone: plain.phone,
    age: plain.age,
    mpesa_number: plain.mpesaNumber,
    balance: plain.balance,
    reset_token: plain.resetToken ?? null,
    reset_token_expires: plain.resetTokenExpires ?? null,
    created_at: plain.createdAt.toISOString(),
    updated_at: plain.updatedAt.toISOString(),
  };
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const existing = await UserModel.findOne({ email: payload.email.toLowerCase() }).lean();
  if (existing) {
    throw new Error('Email já registado.');
  }

  const created = await UserModel.create({
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    role: 'player',
    phone: payload.phone,
    age: payload.age,
    mpesaNumber: payload.mpesaNumber,
    balance: 0,
    resetToken: null,
    resetTokenExpires: null,
  });

  const user = toUser(created);
  if (!user) {
    throw new Error('Não foi possível criar o utilizador.');
  }
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  const record = await UserModel.findOne({ email: email.toLowerCase() }).exec();
  if (!record || !verifyPassword(password, record.passwordHash)) {
    throw new Error('Credenciais inválidas.');
  }
  const user = toUser(record);
  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const record = await UserModel.findById(id).exec();
  return toUser(record);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const record = await UserModel.findOne({ email: email.toLowerCase() }).exec();
  return toUser(record);
}

export async function getUserByResetToken(token: string): Promise<User | undefined> {
  const record = await UserModel.findOne({ resetToken: token }).exec();
  return toUser(record);
}

export async function listUsers(): Promise<User[]> {
  const records = await UserModel.find().sort({ createdAt: -1 }).exec();
  return records
    .map((record: UserDocument) => toUser(record)!)
    .filter((user): user is User => Boolean(user));
}

export async function updateUserBalance(id: string, balance: number): Promise<void> {
  await UserModel.updateOne(
    { _id: id },
    { $set: { balance, updatedAt: new Date() } }
  ).exec();
}

export async function incrementBalance(id: string, delta: number): Promise<void> {
  await UserModel.updateOne(
    { _id: id },
    { $inc: { balance: delta }, $set: { updatedAt: new Date() } }
  ).exec();
}

export async function setResetToken(userId: string, token: string, expiresAt: number): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        resetToken: token,
        resetTokenExpires: expiresAt,
        updatedAt: new Date(),
      },
    }
  ).exec();
}

export async function clearResetToken(userId: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    }
  ).exec();
}

export async function updatePassword(userId: string, password: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        passwordHash: hashPassword(password),
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    }
  ).exec();
}

export async function updateProfile(
  userId: string,
  data: Partial<Pick<User, 'phone' | 'mpesa_number'>>
): Promise<User> {
  const update: Partial<UserDoc> = {};
  if (data.phone) update.phone = data.phone;
  if (data.mpesa_number) update.mpesaNumber = data.mpesa_number;

  const record = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { ...update, updatedAt: new Date() } },
    { new: true }
  ).exec();

  if (!record) {
    throw new Error('Utilizador não encontrado.');
  }

  const user = toUser(record);
  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }
  return user;
}
