import apiClient from '@/lib/api-client';
import type {
  DestaqueListagemResponse,
  MandarFResponse,
  VisualizarResponse,
} from '@/types/destaques.types';

export async function buscarDestaquesGrupo(
  grupoId: string,
  rodada?: number,
): Promise<DestaqueListagemResponse> {
  const response = await apiClient.get<DestaqueListagemResponse>(
    `/grupos/${grupoId}/destaques`,
    { params: rodada ? { rodada } : undefined },
  );
  return response.data;
}

export async function mandarF(
  grupoId: string,
  destaqueId: string,
): Promise<MandarFResponse> {
  const response = await apiClient.post<MandarFResponse>(
    `/grupos/${grupoId}/destaques/${destaqueId}/mandar-f`,
  );
  return response.data;
}

export async function marcarVisualizados(
  grupoId: string,
  destaqueIds: string[],
): Promise<VisualizarResponse> {
  const response = await apiClient.post<VisualizarResponse>(
    `/grupos/${grupoId}/destaques/visualizar`,
    { destaqueIds },
  );
  return response.data;
}
