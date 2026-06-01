import apiClient from '@/lib/api-client';
import { Usuario } from '@/types/usuario.types';
import { DadosCriarUsuario } from '@/types/auth.types';

export interface DadosAtualizarUsuario {
  nome?: string;
  email?: string;
  senha?: string;
}

export async function buscarPerfil(): Promise<Usuario> {
  const response = await apiClient.get<Usuario>('/usuarios/me');
  return response.data;
}

export async function criarUsuario(dados: DadosCriarUsuario): Promise<Usuario> {
  const response = await apiClient.post<Usuario>('/usuarios', dados);
  return response.data;
}

export async function atualizarUsuario(id: string, dados: DadosAtualizarUsuario): Promise<Usuario> {
  const response = await apiClient.patch<Usuario>(`/usuarios/${id}`, dados);
  return response.data;
}

export async function excluirUsuario(id: string): Promise<void> {
  await apiClient.delete(`/usuarios/${id}`);
}

export async function definirGrupoFavorito(grupoId: string | null): Promise<Usuario> {
  const response = await apiClient.patch<Usuario>('/usuarios/me/grupo-favorito', { grupoId });
  return response.data;
}
