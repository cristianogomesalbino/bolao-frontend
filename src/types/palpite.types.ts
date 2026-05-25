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
