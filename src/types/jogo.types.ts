export type StatusJogo = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO' | 'ADIADO';

export interface Fase {
  id: string;
  nome: string;
  tipo: 'PONTOS_CORRIDOS' | 'MATA_MATA';
  ordem: number;
}

export interface Jogo {
  id: string;
  faseId: string;
  rodada: number | null;
  timeCasaId: string;
  timeForaId: string;
  dataHora: string;
  status: StatusJogo;
  foiAdiado?: boolean;
  golsCasa: number | null;
  golsFora: number | null;
  temProrrogacao?: boolean;
  golsProrrogacaoCasa?: number | null;
  golsProrrogacaoFora?: number | null;
  temPenaltis?: boolean;
  penaltisCasa?: number | null;
  penaltisFora?: number | null;
  vencedorId: string | null;
  fonteResultado?: 'MANUAL' | 'API_EXTERNA';
  externoId?: string | null;
  timeCasa?: { id: string; nome: string; sigla: string; escudo: string | null };
  timeFora?: { id: string; nome: string; sigla: string; escudo: string | null };
}

export interface JogosResponse {
  fase: Fase;
  jogos: Jogo[];
  rodadaAtual: number | null;
}

// --- Multi-campeonato (Copa do Mundo) ---

export type CampeonatoSlug = 'brasileirao' | 'copa-do-mundo-2026';

export interface FaseSlugConfig {
  label: string;
  slug: string;
  maxRodadas: number;
  tipo: 'PONTOS_CORRIDOS' | 'MATA_MATA';
}

export interface CampeonatoConfig {
  label: string;
  slug: CampeonatoSlug;
  fases: FaseSlugConfig[];
}

export const CAMPEONATOS: CampeonatoConfig[] = [
  {
    label: 'Brasileirão Série A',
    slug: 'brasileirao',
    fases: [
      { label: 'Fase Única', slug: 'fase-unica-campeonato-brasileiro-2026', maxRodadas: 38, tipo: 'PONTOS_CORRIDOS' },
    ],
  },
  {
    label: 'Copa do Mundo 2026',
    slug: 'copa-do-mundo-2026',
    fases: [
      { label: 'Fase de Grupos', slug: 'fase-de-grupos-copa-do-mundo-2026', maxRodadas: 3, tipo: 'PONTOS_CORRIDOS' },
      { label: '16 Avos de Final', slug: 'segunda-fase-copa-do-mundo-2026', maxRodadas: 16, tipo: 'MATA_MATA' },
      { label: 'Oitavas de Final', slug: 'oitavas-copa-do-mundo-2026', maxRodadas: 1, tipo: 'MATA_MATA' },
      { label: 'Quartas de Final', slug: 'quartas-copa-do-mundo-2026', maxRodadas: 1, tipo: 'MATA_MATA' },
      { label: 'Semifinais', slug: 'semifinal-copa-do-mundo-2026', maxRodadas: 1, tipo: 'MATA_MATA' },
      { label: 'Disputa 3º Lugar', slug: 'terceiro-copa-do-mundo-2026', maxRodadas: 1, tipo: 'MATA_MATA' },
      { label: 'Final', slug: 'final-copa-do-mundo-2026', maxRodadas: 1, tipo: 'MATA_MATA' },
    ],
  },
];

export interface ImportarJogosPayload {
  campeonatoSlug: CampeonatoSlug;
  faseSlug: string;
  rodada: number;
  faseId: string;
}

export interface SincronizarJogosPayload {
  campeonatoSlug: CampeonatoSlug;
  faseSlug: string;
}

export interface ImportarJogosResponse {
  importados: number;
  ignorados: number;
}

export interface SincronizarJogosResponse {
  sincronizados: number;
  jogosAtualizados?: Array<{
    id: string;
    timeCasa: string;
    timeFora: string;
    status: string;
    golsCasa: number | null;
    golsFora: number | null;
    rodada: number | null;
    horarioAlterado: boolean;
    horarioAnterior: string | null;
    horarioNovo: string | null;
  }>;
}
