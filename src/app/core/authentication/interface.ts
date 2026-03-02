export interface User {
  [prop: string]: any;

  id?: number | string | null;
  name?: string;
  email?: string;
  avatar?: string;
  roles?: any[];
  roleId?: number;
  permissions?: any[];
  profileComplete?: boolean;
}

export interface Token {
  [prop: string]: any;

  access_token: string;
  token_type?: string;
  expires_in?: number;
  exp?: number;
  refresh_token?: string;
}

export interface ApiInterface<T> {
  status: string;
  message: string;
  data: T;

  errorCode: number;

  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  companyId: string;
  universityId: string;
}

export interface PersonalInfo {
  id: string;
  userId: string;
  dateOfBirth: string;
  country: string;
  city: string;
  phoneNumber: string;
  gender: number;
  educationLevel: number;
  shortBio: string;
  createdAt: string;
}
