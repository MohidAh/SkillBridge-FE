export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  errorCode: number;
}

export interface User {
  [prop: string]: any;

  id?: number | string | null;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  roles?: any[];
  role?: string;
  roleId?: number;
  permissions?: any[];
  profileComplete?: boolean;
}

export interface AuthData {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  user: User;
}

export interface Token {
  [prop: string]: any;

  access_token: string;
  token?: string;
  token_type?: string;
  tokenType?: string;
  expires_in?: number;
  expiresInMinutes?: number;
  exp?: number;
  refresh_token?: string;
}
