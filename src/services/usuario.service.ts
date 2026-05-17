import apiClient from '@/lib/api-client';
import { Usuario } from '@/types/usuario.types';
import { DadosCriarUsuario } from '@/types/auth.types';

export async function buscarPerfil(): Promise<Usuario> {
  const response = await apiClient.get<Usuario>('/usuarios/me');
  return response.data;
}

export async function criarUsuario(dados: DadosCriarUsuario): Promise<Usuario> {
  const response = await apiClient.post<Usuario>('/usuarios', dados);
  return response.data;
}
