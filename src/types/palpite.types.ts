export interface Palpite {
  id: string;
  golsCasa: number;
  golsFora: number;
  jogoId: string;
  usuarioId: string;
  dataCriacao: string;
  atualizadoEm: string;
}

export interface DadosCriarPalpite {
  golsCasa: number;
  golsFora: number;
}

export interface DadosAtualizarPalpite {
  golsCasa: number;
  golsFora: number;
}

export interface PalpiteComJogo extends Palpite {
  jogo: {
    id: string;
    faseId?: string;
    rodada: number | null;
    status: string;
    dataHora: string | null;
    golsCasa: number | null;
    golsFora: number | null;
    foiAdiado: boolean;
    timeCasa: { id: string; nome: string; sigla: string; escudo: string | null } | null;
    timeFora: { id: string; nome: string; sigla: string; escudo: string | null } | null;
  } | null;
}
