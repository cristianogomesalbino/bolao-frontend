import apiClient from '@/lib/api-client';
import { DadosLogin, RespostaTokens } from '@/types/auth.types';

export async function login(dados: DadosLogin): Promise<RespostaTokens> {
  const response = await apiClient.post<RespostaTokens>('/auth/login', dados);
  return response.data;
}

export async function refresh(refreshToken: string): Promise<RespostaTokens> {
  const response = await apiClient.post<RespostaTokens>('/auth/refresh', { refreshToken });
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function esqueciSenha(email: string): Promise<{ mensagem: string }> {
  const response = await apiClient.post<{ mensagem: string }>('/auth/esqueci-senha', { email });
  return response.data;
}

export async function resetarSenha(token: string, novaSenha: string): Promise<{ mensagem: string }> {
  const response = await apiClient.post<{ mensagem: string }>('/auth/resetar-senha', { token, novaSenha });
  return response.data;
}
