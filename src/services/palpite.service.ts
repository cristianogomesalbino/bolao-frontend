import apiClient from '@/lib/api-client';
import { Palpite, PalpiteComJogo, DadosCriarPalpite, DadosAtualizarPalpite } from '@/types/palpite.types';

export async function criarPalpite(jogoId: string, dados: DadosCriarPalpite): Promise<Palpite> {
  const response = await apiClient.post<Palpite>(`/jogos/${jogoId}/palpites`, dados);
  return response.data;
}

export async function atualizarPalpite(palpiteId: string, dados: DadosAtualizarPalpite): Promise<Palpite> {
  const response = await apiClient.patch<Palpite>(`/palpites/${palpiteId}`, dados);
  return response.data;
}

export async function buscarMeuPalpite(jogoId: string): Promise<Palpite | null> {
  try {
    const response = await apiClient.get<Palpite>(`/jogos/${jogoId}/meu-palpite`);
    return response.data || null;
  } catch {
    return null;
  }
}

export async function buscarMeusPalpitesPorJogos(jogoIds: string[]): Promise<Palpite[]> {
  try {
    const response = await apiClient.post<Palpite[]>('/meus-palpites/por-jogos', { jogoIds });
    return response.data;
  } catch (error) {
    console.error('[palpite.service] Erro ao buscar palpites por jogos:', error);
    return [];
  }
}

export interface MembroStatusPalpite {
  nome: string;
  palpitou: boolean;
}

export interface EstatisticasPalpite {
  total: number;
  vitoriaCasa: number;
  empate: number;
  vitoriaFora: number;
  percentualCasa: number;
  percentualEmpate: number;
  percentualFora: number;
  palpitaram: string[];
  membrosStatus: MembroStatusPalpite[];
}

export async function buscarEstatisticasPalpite(
  grupoId: string,
  jogoId: string,
): Promise<EstatisticasPalpite | null> {
  try {
    const response = await apiClient.get<EstatisticasPalpite>(
      `/grupos/${grupoId}/jogos/${jogoId}/palpites/estatisticas`,
    );
    return response.data;
  } catch (error) {
    console.error('[palpite.service] Erro ao buscar estatísticas:', error);
    return null;
  }
}

export async function listarMeusPalpites(temporadaId: string): Promise<PalpiteComJogo[]> {
  const response = await apiClient.get<PalpiteComJogo[]>('/meus-palpites', {
    params: { temporadaId },
  });
  return response.data;
}

export interface PalpiteMembro {
  id: string;
  golsCasa: number;
  golsFora: number;
  jogoId: string;
  usuarioId: string;
  dataCriacao: string;
  atualizadoEm: string;
}

export async function buscarPalpitesGrupoJogo(
  grupoId: string,
  jogoId: string,
): Promise<PalpiteMembro[]> {
  try {
    const response = await apiClient.get<PalpiteMembro[]>(
      `/grupos/${grupoId}/jogos/${jogoId}/palpites`,
    );
    return response.data;
  } catch {
    return [];
  }
}
