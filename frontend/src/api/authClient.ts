import { apiClient } from './client';
import { AuthTokenResponse, UserProfile, UserRole, ApiMessageResponse } from './types';

export async function registerApi(
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<ApiMessageResponse> {
  const response = await apiClient.post<ApiMessageResponse>('/auth/register', {
    name,
    email,
    password,
    role,
  });
  return response.data;
}

export async function loginApi(email: string, password: string): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function verifyEmailApi(token: string): Promise<ApiMessageResponse> {
  const response = await apiClient.get<ApiMessageResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
  return response.data;
}

export async function getMeApi(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
}

export async function loginWithGoogleApi(token: string, role: UserRole = 'finance_manager'): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>('/auth/google', {
    token,
    role,
  });
  return response.data;
}

export async function getGoogleConfigApi(): Promise<{ client_id: string | null }> {
  const response = await apiClient.get<{ client_id: string | null }>('/auth/google/config');
  return response.data;
}
