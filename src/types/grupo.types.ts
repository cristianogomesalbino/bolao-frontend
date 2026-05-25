export interface Grupo {
  id: string;
  nome: string;
  temporadaId: string;
  privado: boolean;
  codigoConvite: string | null;
  permitirPalpiteAutomatico: boolean;
  maxParticipantes: number;
  permitirPalpiteDobrado: boolean;
  ativo: boolean;
  dataCriacao: string;
  criadoPor: string;
  /** Dados extras retornados na listagem */
  totalParticipantes?: number;
  palpitesRestantes?: number;
  minhaColocacao?: number;
  rodadaAtual?: number;
  rodadaAberta?: boolean;
}

export interface MembroGrupo {
  id: string;
  usuarioId: string;
  grupoId: string;
  role: 'ADMIN' | 'MEMBER';
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface DadosCriarGrupo {
  nome: string;
  temporadaId: string;
  privado: boolean;
  permitirPalpiteAutomatico?: boolean;
  maxParticipantes?: number;
  permitirPalpiteDobrado?: boolean;
}

export interface DadosAtualizarGrupo {
  nome?: string;
  privado?: boolean;
  permitirPalpiteAutomatico?: boolean;
  permitirPalpiteDobrado?: boolean;
}

export interface RankingEntry {
  posicao: number;
  usuarioId: string;
  nomeUsuario: string;
  pontuacaoTotal: number;
  acertosEmCheio: number;
  acertosDeResultado: number;
  acertosDeGolsUmTime: number;
  errosTotais: number;
}
