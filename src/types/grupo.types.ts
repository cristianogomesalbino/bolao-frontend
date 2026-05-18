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
