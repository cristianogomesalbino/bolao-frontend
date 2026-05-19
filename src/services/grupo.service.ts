import apiClient from '@/lib/api-client';
import { Grupo, MembroGrupo, DadosCriarGrupo, DadosAtualizarGrupo } from '@/types/grupo.types';

export async function listarGrupos(): Promise<Grupo[]> {
  const response = await apiClient.get<Grupo[]>('/grupos');
  return response.data;
}

export async function buscarGrupo(grupoId: string): Promise<Grupo> {
  const response = await apiClient.get<Grupo>(`/grupos/${grupoId}`);
  return response.data;
}

export async function criarGrupo(dados: DadosCriarGrupo): Promise<Grupo> {
  const response = await apiClient.post<Grupo>('/grupos', dados);
  return response.data;
}

export async function atualizarGrupo(grupoId: string, dados: DadosAtualizarGrupo): Promise<Grupo> {
  const response = await apiClient.patch<Grupo>(`/grupos/${grupoId}`, dados);
  return response.data;
}

export async function excluirGrupo(grupoId: string): Promise<void> {
  await apiClient.delete(`/grupos/${grupoId}`);
}

export async function entrarNoGrupo(codigoConvite: string): Promise<MembroGrupo> {
  const response = await apiClient.post<MembroGrupo>('/grupos/entrar', { codigoConvite });
  return response.data;
}

export async function listarMembros(grupoId: string): Promise<MembroGrupo[]> {
  const response = await apiClient.get<MembroGrupo[]>(`/grupos/${grupoId}/membros`);
  return response.data;
}

export async function adicionarMembro(grupoId: string, email: string): Promise<MembroGrupo> {
  const response = await apiClient.post<MembroGrupo>(`/grupos/${grupoId}/adicionar`, { email });
  return response.data;
}

export async function sairDoGrupo(grupoId: string): Promise<void> {
  await apiClient.delete(`/grupos/${grupoId}/sair`);
}

export async function removerMembro(grupoId: string, usuarioId: string): Promise<void> {
  await apiClient.delete(`/grupos/${grupoId}/usuarios/${usuarioId}`);
}

export async function gerarNovoConvite(grupoId: string): Promise<Grupo> {
  const response = await apiClient.patch<Grupo>(`/grupos/${grupoId}/regenerar-convite`);
  return response.data;
}

export async function promoverAdmin(grupoId: string, usuarioId: string): Promise<MembroGrupo> {
  const response = await apiClient.patch<MembroGrupo>(`/grupos/${grupoId}/usuarios/${usuarioId}/cargo`, { role: 'ADMIN' });
  return response.data;
}

export async function rebaixarMembro(grupoId: string, usuarioId: string): Promise<MembroGrupo> {
  const response = await apiClient.patch<MembroGrupo>(`/grupos/${grupoId}/usuarios/${usuarioId}/cargo`, { role: 'MEMBER' });
  return response.data;
}
