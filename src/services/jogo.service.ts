import apiClient from '@/lib/api-client';
import {
  Fase,
  Jogo,
  JogosResponse,
  ImportarJogosPayload,
  ImportarJogosResponse,
  SincronizarJogosPayload,
  SincronizarJogosResponse,
} from '@/types/jogo.types';

export interface Temporada {
  id: string;
  nome: string;
  ano: number;
  campeonatoId: string;
  campeonato?: { id: string; nome: string };
}

export interface DadosTemporada {
  proximoJogo: { fase: Fase; jogo: Jogo } | null;
  proximosJogos: { fase: Fase; jogo: Jogo }[];
  totalAdiados: number;
}

export async function listarTemporadas(): Promise<Temporada[]> {
  const response = await apiClient.get<Temporada[]>('/temporadas');
  return response.data;
}

export async function listarFases(temporadaId: string): Promise<Fase[]> {
  const response = await apiClient.get<Fase[]>(`/temporadas/${temporadaId}/fases`);
  return response.data;
}

export async function listarJogosFase(faseId: string, rodada?: number, status?: string): Promise<JogosResponse> {
  const params: Record<string, unknown> = {};
  if (rodada) params.rodada = rodada;
  if (status) params.status = status;
  const response = await apiClient.get<JogosResponse>(`/fases/${faseId}/jogos`, { params });
  return response.data;
}

export async function listarJogosTemporada(temporadaId: string): Promise<Jogo[]> {
  const response = await apiClient.get<Jogo[]>(`/temporadas/${temporadaId}/jogos`);
  return response.data;
}

/**
 * Busca dados da temporada via endpoint otimizado (1 request):
 * - Próximo jogo agendado
 * - Total de jogos adiados
 */
export async function buscarDadosTemporada(temporadaId: string): Promise<DadosTemporada> {
  try {
    const response = await apiClient.get<{
      proximoJogo: { fase: Fase; jogo: Jogo } | null;
      proximosJogos: { fase: Fase; jogo: Jogo }[];
      totalAdiados: number;
    }>(`/temporadas/${temporadaId}/dados`);
    return response.data;
  } catch {
    return { proximoJogo: null, proximosJogos: [], totalAdiados: 0 };
  }
}

// --- Importação e Sincronização multi-campeonato (Admin) ---

export async function importarJogos(payload: ImportarJogosPayload): Promise<ImportarJogosResponse> {
  const response = await apiClient.post<ImportarJogosResponse>('/jogos/importar', payload);
  return response.data;
}

export async function sincronizarPlacares(
  faseId: string,
  payload: SincronizarJogosPayload,
): Promise<SincronizarJogosResponse> {
  const response = await apiClient.post<SincronizarJogosResponse>(
    `/fases/${faseId}/jogos/sincronizar`,
    payload,
  );
  return response.data;
}
