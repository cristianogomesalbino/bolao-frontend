import apiClient from '@/lib/api-client';
import { DadosLogin, RespostaTokens } from '@/types/auth.types';

export async function login(dados: DadosLogin): Promise<RespostaTokens> {
  const response = await apiClient.post<RespostaTokens>('/auth/login', dados);
  return response.data;
}

export async function refresh(): Promise<RespostaTokens> {
  const response = await apiClient.post<RespostaTokens>('/auth/refresh');
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function esqueciSenha(email: string): Promise<{ mensagem: string }> {
  const response = await apiClient.post<{ mensagem: string }>('/auth/esqueci-senha', { email });
  return response.data;
}

export async function resetarSenha(
  token: string,
  novaSenha: string,
): Promise<{ mensagem: string }> {
  const response = await apiClient.post<{ mensagem: string }>('/auth/resetar-senha', {
    token,
    novaSenha,
  });
  return response.data;
}
