export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Secret {
  id: number;
  title: string;
  username: string | null;
  password: string;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretInput {
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
