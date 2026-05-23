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
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  golsCasa: number | null;
  golsFora: number | null;
  vencedorId: string | null;
  timeCasa?: { id: string; nome: string; sigla: string; escudo: string | null };
  timeFora?: { id: string; nome: string; sigla: string; escudo: string | null };
}

export interface JogosResponse {
  fase: Fase;
  jogos: Jogo[];
}

export interface JogoProximo {
  id: string;
  timeCasa: string;
  timeFora: string;
  dataHora: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
}
