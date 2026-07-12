export type TipoStory =
  | 'ACERTOU_EM_CHEIO'
  | 'UNICO_NA_MOSCA'
  | 'SUBIU_RANKING'
  | 'SEQUENCIA_MOSCA'
  | 'SEQUENCIA_RESULTADO'
  | 'NAO_PALPITOU'
  | 'DOBROU_E_ACERTOU';

export interface StoryAutor {
  usuarioId: string;
  nome: string;
  avatar: string | null;
}

export interface StoryItem {
  id: string;
  tipo: TipoStory;
  titulo: string;
  dados: Record<string, unknown>;
  jogoId: string;
  rodada: number | null;
  criadoEm: string;
  contadorFs: number;
  jaEnviouF: boolean;
  visualizado: boolean;
  autor: StoryAutor;
}

export interface StoryListagemResponse {
  stories: StoryItem[];
}

export interface MandarFResponse {
  contadorFs: number;
}

export interface VisualizarResponse {
  registrados: number;
}

// Dados específicos por tipo (para renderização dos cards)

export interface TimeInfo {
  nome: string;
  sigla: string;
  escudo: string | null;
}

export interface DadosAcertouEmCheio {
  golsCasa: number;
  golsFora: number;
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
}

export interface DadosUnicoNaMosca {
  golsCasa: number;
  golsFora: number;
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
  rodada: number | null;
}

export interface DadosSubiuRanking {
  posicaoAnterior: number;
  posicaoNova: number;
  top5: Array<{ posicao: number; nome: string; pontuacao: number }>;
}

export interface RecordeInfo {
  valor: number;
  detentores: Array<{ nome: string; usuarioId: string }>;
  ehNovoRecorde: boolean;
}

export interface JogoSequencia {
  timeCasa: string;
  timeFora: string;
  golsCasa: number;
  golsFora: number;
  rodada: number | null;
  acertou: boolean;
}

export interface DadosSequenciaMosca {
  quantidadeAcertos: number;
  ultimosJogos: Array<JogoSequencia & { acertouEmCheio: boolean }>;
  recorde: RecordeInfo;
}

export interface DadosSequenciaResultado {
  quantidadeAcertos: number;
  rodadaInicio: number | null;
  rodadaFim: number | null;
  ultimosJogos: JogoSequencia[];
  recorde: RecordeInfo;
}

export interface JogoEsquecido {
  jogoId: string;
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
  golsCasa: number | null;
  golsFora: number | null;
}

export interface DadosNaoPalpitou {
  jogosEsquecidos: JogoEsquecido[];
  totalJogosRodada: number;
  rodada: number | null;
}

export interface DadosDobrouEAcertou {
  golsCasa: number;
  golsFora: number;
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
  pontosObtidos: number;
}

// Mapeamento de emojis e cores por tipo
export const STORY_CONFIG: Record<
  TipoStory,
  { emoji: string; cor: string; timerSegundos: number }
> = {
  ACERTOU_EM_CHEIO: { emoji: '🎯', cor: '#22C55E', timerSegundos: 5 },
  UNICO_NA_MOSCA: { emoji: '🦄', cor: '#8B5CF6', timerSegundos: 6 },
  SUBIU_RANKING: { emoji: '📈', cor: '#3B82F6', timerSegundos: 8 },
  SEQUENCIA_MOSCA: { emoji: '🔥', cor: '#F97316', timerSegundos: 7 },
  SEQUENCIA_RESULTADO: { emoji: '🔥', cor: '#F97316', timerSegundos: 7 },
  NAO_PALPITOU: { emoji: '😴', cor: '#6B7280', timerSegundos: 5 },
  DOBROU_E_ACERTOU: { emoji: '💎', cor: '#F59E0B', timerSegundos: 6 },
};
