export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone: string;
  age: number;
  mpesa_number: string;
  balance: number;
  reset_token: string | null;
  reset_token_expires: number | null;
  created_at: string;
  updated_at: string;
}
