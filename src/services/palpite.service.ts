import apiClient from '@/lib/api-client';
import { Palpite, DadosCriarPalpite, DadosAtualizarPalpite } from '@/types/palpite.types';

export async function criarPalpite(jogoId: string, dados: DadosCriarPalpite): Promise<Palpite> {
  const response = await apiClient.post<Palpite>(`/jogos/${jogoId}/palpites`, dados);
  return response.data;
}

export async function atualizarPalpite(palpiteId: string, dados: DadosAtualizarPalpite): Promise<Palpite> {
  const response = await apiClient.patch<Palpite>(`/palpites/${palpiteId}`, dados);
  return response.data;
}

export async function excluirPalpite(palpiteId: string): Promise<void> {
  await apiClient.delete(`/palpites/${palpiteId}`);
}

export async function buscarMeuPalpite(jogoId: string): Promise<Palpite | null> {
  try {
    const response = await apiClient.get<Palpite>(`/jogos/${jogoId}/meu-palpite`);
    return response.data;
  } catch {
    return null;
  }
}
